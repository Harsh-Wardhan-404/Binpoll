-- Migration 002: Update schema based on new requirements
-- Remove random_winner_rank column from polls table
-- Add new poll_results table

-- Remove the random_winner column from polls table
ALTER TABLE polls DROP COLUMN IF EXISTS random_winner;

-- Create Poll Results Table
CREATE TABLE IF NOT EXISTS poll_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(poll_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  winner_type VARCHAR(20) NOT NULL CHECK (winner_type IN ('correct_poll', 'random_winner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Create indexes for the new poll_results table
CREATE INDEX IF NOT EXISTS idx_poll_results_poll_id ON poll_results(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_results_user_id ON poll_results(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_results_winner_type ON poll_results(winner_type);

-- Create trigger for updating timestamps on poll_results table
CREATE TRIGGER update_poll_results_updated_at BEFORE UPDATE ON poll_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
