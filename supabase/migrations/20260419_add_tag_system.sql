-- FAC-060: 태그 시스템 DB 스키마
-- tags, track_tags, artist_tags 테이블 + RLS + 시드 데이터

-- ============================================================
-- 1. tags 테이블 (마스터 태그 목록)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('genre', 'mood', 'bpm', 'instrument')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, category)
);

CREATE INDEX IF NOT EXISTS idx_tags_category ON public.tags (category);

-- RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (태그 목록 조회)
CREATE POLICY "Anyone can read tags"
  ON public.tags FOR SELECT
  USING (true);

-- ============================================================
-- 2. track_tags 테이블 (트랙 ↔ 태그 연결)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.track_tags (
  track_id    UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (track_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_track_tags_tag_id ON public.track_tags (tag_id);

ALTER TABLE public.track_tags ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 (차트/추천에 활용)
CREATE POLICY "Anyone can read track_tags"
  ON public.track_tags FOR SELECT
  USING (true);

-- 트랙 소유자만 태그 추가
CREATE POLICY "Track owners can insert track_tags"
  ON public.track_tags FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.tracks WHERE id = track_id)
  );

-- 트랙 소유자만 태그 삭제
CREATE POLICY "Track owners can delete track_tags"
  ON public.track_tags FOR DELETE
  USING (
    auth.uid() = (SELECT user_id FROM public.tracks WHERE id = track_id)
  );

-- ============================================================
-- 3. artist_tags 테이블 (아티스트 ↔ 태그 연결, 취향/스타일 표현)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.artist_tags (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_tags_tag_id ON public.artist_tags (tag_id);

ALTER TABLE public.artist_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read artist_tags"
  ON public.artist_tags FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own artist_tags"
  ON public.artist_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own artist_tags"
  ON public.artist_tags FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. 시드 데이터 (공통 태그 초기값)
-- ============================================================

-- genre
INSERT INTO public.tags (name, category) VALUES
  ('K-Pop',        'genre'),
  ('Hip-Hop',      'genre'),
  ('R&B',          'genre'),
  ('Lo-fi',        'genre'),
  ('Indie',        'genre'),
  ('EDM',          'genre'),
  ('Pop',          'genre'),
  ('Jazz',         'genre'),
  ('Classical',    'genre'),
  ('Rock',         'genre'),
  ('Ballad',       'genre'),
  ('House',        'genre'),
  ('Trap',         'genre'),
  ('Ambient',      'genre')
ON CONFLICT (name, category) DO NOTHING;

-- mood
INSERT INTO public.tags (name, category) VALUES
  ('새벽감성',      'mood'),
  ('드라이브',      'mood'),
  ('공부할 때',     'mood'),
  ('파티',         'mood'),
  ('힐링',         'mood'),
  ('운동',         'mood'),
  ('감성적',        'mood'),
  ('신나는',        'mood'),
  ('잔잔한',        'mood'),
  ('몽환적',        'mood')
ON CONFLICT (name, category) DO NOTHING;

-- bpm
INSERT INTO public.tags (name, category) VALUES
  ('Slow (< 80)',   'bpm'),
  ('Mid (80-120)',  'bpm'),
  ('Fast (> 120)',  'bpm')
ON CONFLICT (name, category) DO NOTHING;

-- instrument
INSERT INTO public.tags (name, category) VALUES
  ('피아노',        'instrument'),
  ('기타',         'instrument'),
  ('드럼',         'instrument'),
  ('베이스',        'instrument'),
  ('현악기',        'instrument'),
  ('신디사이저',     'instrument'),
  ('보컬',         'instrument'),
  ('Featuring',    'instrument')
ON CONFLICT (name, category) DO NOTHING;
