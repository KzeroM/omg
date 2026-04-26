-- featured_artists 테이블 (HeroBanner "오늘의 아티스트")
CREATE TABLE IF NOT EXISTS featured_artists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name   TEXT NOT NULL,
  tagline       TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: 읽기는 누구나, 쓰기는 서비스 롤(admin)만
ALTER TABLE featured_artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read featured artists"
  ON featured_artists FOR SELECT USING (active = true);
