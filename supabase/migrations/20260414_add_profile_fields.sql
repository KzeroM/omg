-- FAC-47: 프로필 편집 기능 (bio + social_links)

-- 1. public.users에 컬럼 추가 (FAC-45에서 생성한 테이블)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT NULL;

-- 2. bio 길이 제약 (최대 300자)
ALTER TABLE public.users
  ADD CONSTRAINT users_bio_check CHECK (char_length(bio) <= 300);
