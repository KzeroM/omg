-- FAC-51: albums + album_tracks 테이블 + RLS + manage_album_tracks RPC

-- ============================================================
-- 1. albums 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.albums (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT        NOT NULL,
  description      TEXT,
  cover_type       TEXT        NOT NULL DEFAULT 'gradient'
                               CHECK (cover_type IN ('gradient', 'image')),
  cover_image_path TEXT,       -- cover_type='image' 일 때 Storage 경로
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_id 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_albums_user_id
  ON public.albums (user_id);

-- updated_at 자동 갱신 트리거 (기존 handle_updated_at() 재사용)
CREATE TRIGGER albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 2. albums RLS
-- ============================================================
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- 누구나 앨범 조회 가능
CREATE POLICY "Anyone can read albums"
  ON public.albums FOR SELECT
  USING (true);

-- 본인만 앨범 생성
CREATE POLICY "Users can insert own albums"
  ON public.albums FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인만 앨범 수정
CREATE POLICY "Users can update own albums"
  ON public.albums FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인만 앨범 삭제
CREATE POLICY "Users can delete own albums"
  ON public.albums FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. album_tracks 조인 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS public.album_tracks (
  album_id   UUID        NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  track_id   UUID        NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position   INTEGER     NOT NULL DEFAULT 0,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (album_id, track_id)
);

-- position 순서 조회 최적화
CREATE INDEX IF NOT EXISTS idx_album_tracks_album_position
  ON public.album_tracks (album_id, position);

-- ============================================================
-- 4. album_tracks RLS
--    album.user_id 검증이 필요하므로 SECURITY DEFINER RPC로 쓰기 위임
--    SELECT는 직접 허용 (앨범이 공개이므로 트랙 목록도 공개)
-- ============================================================
ALTER TABLE public.album_tracks ENABLE ROW LEVEL SECURITY;

-- 누구나 앨범 트랙 목록 조회 가능
CREATE POLICY "Anyone can read album_tracks"
  ON public.album_tracks FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE는 RPC(SECURITY DEFINER)에서만 수행
-- 직접 DML은 허용하지 않음 (정책 미생성 = 기본 거부)

-- ============================================================
-- 5. manage_album_tracks RPC (SECURITY DEFINER)
--    앨범 소유자만 트랙 추가/삭제 가능
--    p_action: 'add' | 'remove'
-- ============================================================
CREATE OR REPLACE FUNCTION public.manage_album_tracks(
  p_album_id UUID,
  p_track_id UUID,
  p_action   TEXT,         -- 'add' | 'remove'
  p_position INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID;
  v_album_owner UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 앨범 소유자 확인
  SELECT user_id INTO v_album_owner
    FROM public.albums
   WHERE id = p_album_id;

  IF v_album_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Album not found');
  END IF;

  IF v_album_owner != v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not album owner');
  END IF;

  IF p_action = 'add' THEN
    INSERT INTO public.album_tracks (album_id, track_id, position, added_at)
    VALUES (p_album_id, p_track_id, p_position, now())
    ON CONFLICT (album_id, track_id) DO UPDATE
      SET position = EXCLUDED.position;

    RETURN jsonb_build_object('success', true, 'action', 'added');

  ELSIF p_action = 'remove' THEN
    DELETE FROM public.album_tracks
     WHERE album_id = p_album_id
       AND track_id = p_track_id;

    RETURN jsonb_build_object('success', true, 'action', 'removed');

  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid action. Use add or remove');
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[manage_album_tracks] album_id=%, track_id=%, action=%, error=%',
    p_album_id, p_track_id, p_action, SQLERRM;
  RETURN jsonb_build_object('success', false, 'error', 'Operation failed');
END;
$$;

-- ============================================================
-- 6. album_tracks DML 정책 추가 (RPC 경유만 허용)
-- ============================================================
CREATE POLICY "album_tracks DML blocked (use RPC)"
  ON public.album_tracks FOR INSERT
  WITH CHECK (false);

CREATE POLICY "album_tracks UPDATE blocked (use RPC)"
  ON public.album_tracks FOR UPDATE
  USING (false);

CREATE POLICY "album_tracks DELETE blocked (use RPC)"
  ON public.album_tracks FOR DELETE
  USING (false);
