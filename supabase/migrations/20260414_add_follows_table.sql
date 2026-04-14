-- FAC-48: Follow system (public.follows 테이블 + RLS + toggle_follow RPC)

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- 역방향 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_follows_following_id
  ON public.follows (following_id);

-- RLS 활성화
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 팔로우 관계는 공개 (누구나 조회 가능)
CREATE POLICY "Anyone can read follows"
  ON public.follows FOR SELECT
  USING (true);

-- follower_count 갱신 트리거 함수
CREATE OR REPLACE FUNCTION public.update_follower_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- INSERT: following_id의 follower_count +1
  -- DELETE: following_id의 follower_count -1
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users
       SET follower_count = follower_count + 1,
           updated_at = now()
     WHERE user_id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users
       SET follower_count = GREATEST(follower_count - 1, 0),
           updated_at = now()
     WHERE user_id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 트리거 바인딩
CREATE TRIGGER follows_update_follower_count
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_follower_count();

-- toggle_follow RPC (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.toggle_follow(p_artist_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_is_following    BOOLEAN;
  v_follower_count  INTEGER;
BEGIN
  -- 현재 로그인 사용자 ID 조회
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- 자기 자신 팔로우 방지
  IF v_current_user_id = p_artist_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot follow yourself'
    );
  END IF;

  -- 팔로우 존재 여부 확인
  SELECT EXISTS(
    SELECT 1 FROM public.follows
     WHERE follower_id = v_current_user_id
       AND following_id = p_artist_user_id
  ) INTO v_is_following;

  -- 팔로우 상태 토글
  IF v_is_following THEN
    -- 언팔로우: DELETE
    DELETE FROM public.follows
     WHERE follower_id = v_current_user_id
       AND following_id = p_artist_user_id;
  ELSE
    -- 팔로우: INSERT (트리거가 자동으로 follower_count +1)
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (v_current_user_id, p_artist_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 변경 후 follower_count 조회
  SELECT COALESCE(follower_count, 0)
    INTO v_follower_count
    FROM public.users
   WHERE user_id = p_artist_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'following', NOT v_is_following,
    'follower_count', v_follower_count
  );

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[toggle_follow] user_id=%, artist_user_id=%, error=%',
    v_current_user_id, p_artist_user_id, SQLERRM;
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Follow operation failed'
  );
END;
$$;
