-- FAC-20: track_likes 테이블 + like_count 컬럼 + toggle_track_like RPC
-- 파일: supabase/migrations/20260411_add_track_likes.sql

-- 1. track_likes 테이블 생성
CREATE TABLE IF NOT EXISTS track_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id   UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_id)
);

-- 2. tracks 테이블에 like_count 컬럼 추가
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;

-- 3. RLS 활성화 (track_likes)
ALTER TABLE track_likes ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 본인 행만 SELECT
CREATE POLICY "Users can view own likes"
  ON track_likes FOR SELECT
  USING (user_id = auth.uid());

-- 5. RLS 정책: 본인 행만 INSERT
--    (단, toggle_track_like RPC는 SECURITY DEFINER이므로 RPC 경로에서는 RLS 우회됨)
CREATE POLICY "Users can insert own likes"
  ON track_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 6. RLS 정책: 본인 행만 DELETE
CREATE POLICY "Users can delete own likes"
  ON track_likes FOR DELETE
  USING (user_id = auth.uid());

-- 7. toggle_track_like RPC — 원자적 트랜잭션으로 INSERT/DELETE + like_count 증감
CREATE OR REPLACE FUNCTION toggle_track_like(p_track_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id  UUID;
  v_liked    BOOLEAN;
  v_count    INTEGER;
BEGIN
  -- 현재 로그인 사용자 확인
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 이미 좋아요 여부 확인
  IF EXISTS (
    SELECT 1 FROM track_likes
    WHERE user_id = v_user_id AND track_id = p_track_id
  ) THEN
    -- 좋아요 취소: DELETE + like_count -1
    DELETE FROM track_likes
    WHERE user_id = v_user_id AND track_id = p_track_id;

    UPDATE tracks
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = p_track_id;

    v_liked := FALSE;
  ELSE
    -- 좋아요 추가: INSERT + like_count +1
    INSERT INTO track_likes (user_id, track_id)
    VALUES (v_user_id, p_track_id);

    UPDATE tracks
    SET like_count = like_count + 1
    WHERE id = p_track_id;

    v_liked := TRUE;
  END IF;

  -- 최신 like_count 조회
  SELECT like_count INTO v_count FROM tracks WHERE id = p_track_id;

  RETURN json_build_object('liked', v_liked, 'like_count', v_count);
END;
$$;
