-- Add settlement fields to polls table
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS settled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS winning_option INTEGER;

-- Create index for better performance on settlement queries
CREATE INDEX IF NOT EXISTS idx_polls_settled ON polls(settled);
CREATE INDEX IF NOT EXISTS idx_polls_end_time ON polls(end_time);

-- Add comment for clarity
COMMENT ON COLUMN polls.settled IS 'Whether the poll has been automatically settled';
COMMENT ON COLUMN polls.winning_option IS 'Index of the winning option (0-based)';
