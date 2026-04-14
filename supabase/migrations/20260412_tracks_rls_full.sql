-- Enable RLS on tracks table
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Drop existing policy to avoid conflicts
DROP POLICY IF EXISTS "Users can update own tracks" ON tracks;

-- Policy 1: Anyone can read tracks
CREATE POLICY "Anyone can read tracks"
  ON tracks FOR SELECT USING (true);

-- Policy 2: Authenticated users can insert their own tracks
CREATE POLICY "Authenticated users can insert own tracks"
  ON tracks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own tracks
CREATE POLICY "Users can update own tracks"
  ON tracks FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own tracks
CREATE POLICY "Users can delete own tracks"
  ON tracks FOR DELETE USING (auth.uid() = user_id);
