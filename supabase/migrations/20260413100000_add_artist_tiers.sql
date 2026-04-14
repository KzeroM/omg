-- FAC-46: artist_tiers 참조 테이블 생성
-- 등급 정의를 DB에 저장해 코드 변경 없이 비즈니스 파라미터 조정 가능

CREATE TABLE IF NOT EXISTS public.artist_tiers (
  tier_name            TEXT PRIMARY KEY,
  display_name         TEXT NOT NULL,
  min_followers        INTEGER NOT NULL DEFAULT 0,
  min_monthly_plays    INTEGER NOT NULL DEFAULT 0,
  revenue_share_rate   INTEGER NOT NULL,
  sort_order           INTEGER NOT NULL,
  badge_color          TEXT NOT NULL DEFAULT ''
);

-- RLS: SELECT 공개, INSERT/UPDATE/DELETE는 superuser만 (직접 수정 차단)
ALTER TABLE public.artist_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read artist_tiers"
  ON public.artist_tiers FOR SELECT USING (true);

-- 시드 데이터
INSERT INTO public.artist_tiers (tier_name, display_name, min_followers, min_monthly_plays, revenue_share_rate, sort_order, badge_color)
VALUES
  ('basic',   'Basic',   0,      0,       70, 0, ''),
  ('silver',  'Silver',  100,    10000,   75, 1, '#C0C0C0'),
  ('gold',    'Gold',    1000,   100000,  80, 2, '#FFD700'),
  ('diamond', 'Diamond', 10000,  1000000, 85, 3, '#B9F2FF')
ON CONFLICT (tier_name) DO NOTHING;
