-- FAC-46: public.users에 아티스트 tier 관련 컬럼 추가
-- 선행 조건: FAC-45의 20260413_add_users_nickname.sql 적용 완료 필요

-- 1. public.users에 컬럼 추가 (FAC-45가 생성한 테이블)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS artist_tier        TEXT    NOT NULL DEFAULT 'basic'
    REFERENCES public.artist_tiers(tier_name),
  ADD COLUMN IF NOT EXISTS revenue_share_rate INTEGER NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS follower_count     INTEGER NOT NULL DEFAULT 0;
-- 참고: updated_at은 FAC-45가 이미 추가하므로 중복 추가 불필요

-- 2. play_history 월별 집계 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_play_history_track_played
  ON public.play_history (track_id, played_at);

-- 3. RLS 추가 정책: artist_tier, revenue_share_rate는 RPC만 UPDATE 가능
--    (public.users 기존 UPDATE 정책: "Users can update own profile" — 본인만 UPDATE 가능)
--    직접 UPDATE를 통한 tier 변조 방지를 위해 column-level 제어는 RPC SECURITY DEFINER로 처리.
--    추가 정책 불필요 — refresh_artist_tiers()가 SECURITY DEFINER이므로 RLS 우회하여 UPDATE 가능.
--    일반 유저의 직접 UPDATE는 "Users can update own profile" 정책으로 허용되나,
--    실제 UI/API에서 artist_tier/revenue_share_rate 직접 변경 경로를 노출하지 않음으로써 제어.

-- 4. calculate_artist_tier RPC
--    단일 아티스트의 tier 계산. play_history에서 이번 달 해당 유저 트랙의 유니크 리스너 수 집계.
CREATE OR REPLACE FUNCTION calculate_artist_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_follower_count   INTEGER;
  v_monthly_plays    INTEGER;
  v_tier             TEXT := 'basic';
BEGIN
  -- 팔로워 수 조회
  SELECT COALESCE(follower_count, 0)
    INTO v_follower_count
    FROM public.users
   WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN 'basic';
  END IF;

  -- 이번 달 재생수 집계
  -- play_history UNIQUE(user_id, track_id): 한 유저가 같은 트랙을 재생해도 1행 (played_at만 갱신)
  -- 따라서 COUNT(*) = 해당 아티스트 트랙을 들은 유니크 리스너 수의 합산 (월 기준)
  SELECT COUNT(*)
    INTO v_monthly_plays
    FROM public.play_history ph
    JOIN public.tracks t ON t.id = ph.track_id
   WHERE t.user_id = p_user_id
     AND ph.played_at >= date_trunc('month', now() AT TIME ZONE 'UTC');

  -- artist_tiers 테이블에서 조건 만족하는 가장 높은 tier 반환
  SELECT tier_name
    INTO v_tier
    FROM public.artist_tiers
   WHERE min_followers    <= v_follower_count
     AND min_monthly_plays <= v_monthly_plays
   ORDER BY sort_order DESC
   LIMIT 1;

  RETURN COALESCE(v_tier, 'basic');

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[calculate_artist_tier] user_id=%, error=%', p_user_id, SQLERRM;
  RETURN 'basic';
END;
$$;

-- 5. refresh_artist_tiers RPC
--    모든 아티스트(tracks에 1곡 이상)의 tier 일괄 갱신.
--    수동 호출 전용 — 추후 pg_cron 스케줄러 연동 예정 (FAC-XX 별도 이슈).
CREATE OR REPLACE FUNCTION refresh_artist_tiers()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r_user_id   UUID;
  v_new_tier  TEXT;
  v_rate      INTEGER;
BEGIN
  FOR r_user_id IN
    SELECT DISTINCT user_id FROM public.tracks
  LOOP
    BEGIN
      v_new_tier := calculate_artist_tier(r_user_id);

      SELECT revenue_share_rate
        INTO v_rate
        FROM public.artist_tiers
       WHERE tier_name = v_new_tier;

      UPDATE public.users
         SET artist_tier        = v_new_tier,
             revenue_share_rate = v_rate,
             updated_at         = now()
       WHERE user_id = r_user_id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[refresh_artist_tiers] user_id=%, error=%', r_user_id, SQLERRM;
      -- 에러 발생한 유저 건너뛰고 계속 처리 (가용성 우선)
      CONTINUE;
    END;
  END LOOP;
END;
$$;
