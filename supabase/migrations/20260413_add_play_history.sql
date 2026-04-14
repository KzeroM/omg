-- FAC-40: play_history 테이블 + upsert_play_history RPC

-- 1. play_history 테이블 생성
CREATE TABLE IF NOT EXISTS play_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id   UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  played_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, track_id)
);

-- 2. RLS 활성화
ALTER TABLE play_history ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책: 본인 행만 SELECT
CREATE POLICY "Users can view own history"
  ON play_history FOR SELECT
  USING (user_id = auth.uid());

-- 4. RLS 정책: 본인 행만 INSERT
--    (upsert_play_history RPC는 SECURITY DEFINER이므로 RPC 경로에서 RLS 우회됨)
CREATE POLICY "Users can insert own history"
  ON play_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. RLS 정책: 본인 행만 UPDATE
CREATE POLICY "Users can update own history"
  ON play_history FOR UPDATE
  USING (user_id = auth.uid());

-- 6. upsert_play_history RPC
--    - 비로그인(auth.uid() IS NULL) 시 no-op (예외 없이 조용히 종료)
--    - 로그인 시 UPSERT: 기존 행이면 played_at만 갱신, 없으면 INSERT
CREATE OR REPLACE FUNCTION upsert_play_history(p_track_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  -- 비로그인 시 no-op (예외 없음)
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO play_history (user_id, track_id, played_at)
  VALUES (v_user_id, p_track_id, now())
  ON CONFLICT (user_id, track_id)
  DO UPDATE SET played_at = now();
END;
$$;
