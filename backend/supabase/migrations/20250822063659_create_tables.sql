-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_address VARCHAR(42) UNIQUE NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  photo_key VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Polls Table
CREATE TABLE IF NOT EXISTS polls (
  poll_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic VARCHAR(200) NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  number_of_polls INTEGER DEFAULT 1,
  limits_per_poll INTEGER DEFAULT 1,
  creator_fee DECIMAL(10, 2) DEFAULT 0.00,
  random_winner INTEGER DEFAULT 1 CHECK (random_winner IN (1, 2, 3)),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Poll Options Table
CREATE TABLE IF NOT EXISTS poll_options (
  poll_option_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(poll_id) ON DELETE CASCADE,
  option_text VARCHAR(500) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Poll Options Voters Table
CREATE TABLE IF NOT EXISTS poll_options_voters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_option_id UUID NOT NULL REFERENCES poll_options(poll_option_id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_option_id, voter_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_creator_id ON polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_polls_end_date ON polls(end_date);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_voters_poll_option_id ON poll_options_voters(poll_option_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_voters_voter_id ON poll_options_voters(voter_id);
CREATE INDEX IF NOT EXISTS idx_users_account_address ON users(account_address);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poll_options_updated_at BEFORE UPDATE ON poll_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



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
