-- Matchmaking queue table
CREATE TABLE IF NOT EXISTS match_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  time_control INTEGER NOT NULL DEFAULT 600,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own queue entry" ON match_queue;
CREATE POLICY "Users can view their own queue entry"
  ON match_queue FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own queue entry" ON match_queue;
CREATE POLICY "Users can insert their own queue entry"
  ON match_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own queue entry" ON match_queue;
CREATE POLICY "Users can delete their own queue entry"
  ON match_queue FOR DELETE
  USING (auth.uid() = user_id);

-- Matchmaking function
CREATE OR REPLACE FUNCTION join_match_queue(p_user_id UUID, p_time_control INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  opponent RECORD;
  new_match_id UUID;
  result JSONB;
BEGIN
  -- Check if already in queue
  DELETE FROM match_queue WHERE user_id = p_user_id;

  -- Look for an opponent with same time control
  SELECT * INTO opponent FROM match_queue
  WHERE time_control = p_time_control
  ORDER BY joined_at ASC
  LIMIT 1;

  IF FOUND THEN
    -- Create match
    new_match_id := gen_random_uuid();
    INSERT INTO matches (id, player_white, player_black, result, time_control)
    VALUES (new_match_id, opponent.user_id, p_user_id, 'ongoing', p_time_control);

    -- Remove opponent from queue
    DELETE FROM match_queue WHERE id = opponent.id;

    result := jsonb_build_object('id', new_match_id, 'player_white', opponent.user_id, 'player_black', p_user_id);
    RETURN result;
  ELSE
    -- Add to queue
    INSERT INTO match_queue (user_id, time_control) VALUES (p_user_id, p_time_control);
    RETURN NULL;
  END IF;
END;
$$;
