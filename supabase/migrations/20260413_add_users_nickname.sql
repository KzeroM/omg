-- ============================================================
-- FAC-45: public.users 테이블 + 닉네임 트리거 + RLS
-- ============================================================

-- 1. public.users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 닉네임 유효성 CHECK constraint
--    허용: 영문자, 숫자, 언더스코어, 하이픈 / 2~30자
ALTER TABLE public.users
  ADD CONSTRAINT users_nickname_format
  CHECK (nickname ~ '^[a-zA-Z0-9_-]{2,30}$');

-- 3. 예약어 차단 CHECK constraint
ALTER TABLE public.users
  ADD CONSTRAINT users_nickname_reserved
  CHECK (lower(nickname) NOT IN (
    'admin', 'api', 'system', 'root', 'support',
    'help', 'info', 'omg', 'official', 'moderator'
  ));

-- 4. 대소문자 무관 유니크 인덱스 (lower() 기반)
CREATE UNIQUE INDEX IF NOT EXISTS users_nickname_lower_uniq
  ON public.users (lower(nickname));

-- 5. updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. on_auth_user_created 트리거:
--    signUp options.data.nickname이 있으면 users 테이블에 INSERT
--    없으면 email prefix로 임시 닉네임 생성 (충돌 시 UUID suffix 추가)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nickname  TEXT;
  v_base      TEXT;
  v_candidate TEXT;
  v_suffix    TEXT;
BEGIN
  -- 메타데이터에서 nickname 추출
  v_nickname := NEW.raw_user_meta_data->>'nickname';

  IF v_nickname IS NULL OR v_nickname = '' THEN
    -- 폴백: email prefix (@ 앞부분), 영숫자/언더스코어만 남김
    v_base := regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g');
    -- 길이 2~30 보장
    v_base := substring(v_base FROM 1 FOR 30);
    IF length(v_base) < 2 THEN
      v_base := 'user_' || v_base;
    END IF;
    v_nickname := v_base;
  END IF;

  -- 충돌 시 UUID suffix로 유니크 보장
  v_candidate := v_nickname;
  WHILE EXISTS (
    SELECT 1 FROM public.users WHERE lower(nickname) = lower(v_candidate)
  ) LOOP
    v_suffix := substring(gen_random_uuid()::text FROM 1 FOR 6);
    v_candidate := substring(v_nickname FROM 1 FOR 23) || '_' || v_suffix;
  END LOOP;

  INSERT INTO public.users (user_id, nickname)
  VALUES (NEW.id, v_candidate);

  RETURN NEW;
END;
$$;

-- 기존 트리거가 있으면 교체
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. RLS 정책
-- 닉네임은 공개 (아티스트 페이지 조회에 필요)
CREATE POLICY "Anyone can read nicknames"
  ON public.users FOR SELECT
  USING (true);

-- 본인 행만 수정 가능
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT는 트리거(SECURITY DEFINER)에서만 수행 → 직접 INSERT 차단
-- (트리거가 SECURITY DEFINER이므로 RLS 우회하여 INSERT 가능)
-- 일반 사용자 직접 INSERT는 허용하지 않음 (정책 미생성 = 기본 거부)

-- 9. artist 텍스트 기반 조회 성능 개선을 위한 인덱스
CREATE INDEX IF NOT EXISTS tracks_artist_lower ON tracks (lower(artist));
