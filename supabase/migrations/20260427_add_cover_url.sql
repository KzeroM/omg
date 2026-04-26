-- tracks 테이블에 커버 이미지 URL 컬럼 추가
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- omg-covers 스토리지 버킷 생성 (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'omg-covers',
  'omg-covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 커버 버킷 RLS: 업로드는 로그인 유저, 읽기는 누구나
CREATE POLICY "Public read covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'omg-covers');

CREATE POLICY "Auth users upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'omg-covers' AND auth.uid() IS NOT NULL);

CREATE POLICY "Owner update covers"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'omg-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner delete covers"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'omg-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
