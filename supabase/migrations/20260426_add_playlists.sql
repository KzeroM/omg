-- playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- playlist_tracks table
CREATE TABLE IF NOT EXISTS playlist_tracks (
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id    UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, track_id)
);

-- index for ordering
CREATE INDEX IF NOT EXISTS playlist_tracks_position_idx
  ON playlist_tracks (playlist_id, position);

-- RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- playlists: owner can do anything; others can read public ones
CREATE POLICY "owner full access" ON playlists
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "public playlists readable" ON playlists
  FOR SELECT USING (is_public = true);

-- playlist_tracks: inherit playlist visibility
CREATE POLICY "owner full access" ON playlist_tracks
  USING (EXISTS (
    SELECT 1 FROM playlists p
    WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM playlists p
    WHERE p.id = playlist_tracks.playlist_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "public playlist tracks readable" ON playlist_tracks
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM playlists p
    WHERE p.id = playlist_tracks.playlist_id AND p.is_public = true
  ));

-- auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
