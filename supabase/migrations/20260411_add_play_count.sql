-- FAC-16 / FAC-17: play_count tracking + artist column
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. play_count 컬럼 추가
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS play_count INTEGER NOT NULL DEFAULT 0;

-- 2. artist 이름 컬럼 추가 (artist_id는 user UUID이므로 표시명 별도 저장)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS artist TEXT;

-- 3. play_count 원자적 증가 RPC 함수
CREATE OR REPLACE FUNCTION increment_play_count(track_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE tracks SET play_count = play_count + 1 WHERE id = track_id;
$$;
