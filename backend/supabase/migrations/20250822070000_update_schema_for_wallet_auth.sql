-- Migration to update schema for wallet-based authentication and new poll structure

-- Drop existing tables to recreate with new structure
DROP TABLE IF EXISTS poll_options_voters CASCADE;
DROP TABLE IF EXISTS poll_options CASCADE;
DROP TABLE IF EXISTS poll_results CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create updated Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  username VARCHAR(100),
  avatar_url TEXT,
  total_polls_created INTEGER DEFAULT 0,
  total_votes_cast INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated Polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_address VARCHAR(42) NOT NULL,
  options TEXT[] NOT NULL, -- Store options as array
  category VARCHAR(50) DEFAULT 'General',
  duration_hours INTEGER NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  total_votes INTEGER DEFAULT 0,
  total_pool DECIMAL(18, 8) DEFAULT 0, -- For cryptocurrency amounts
  contract_poll_id INTEGER NULL, -- Reference to blockchain poll ID
  is_on_chain BOOLEAN DEFAULT FALSE
);

-- Create Votes table (replaces poll_options_voters)
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voter_address VARCHAR(42) NOT NULL,
  option_index INTEGER NOT NULL, -- Index of the option in the poll.options array
  amount DECIMAL(18, 8) NOT NULL DEFAULT 0.001, -- Amount voted (for prediction markets)
  tx_hash VARCHAR(66) NULL, -- Blockchain transaction hash
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_on_chain BOOLEAN DEFAULT FALSE,
  UNIQUE(poll_id, voter_address) -- Prevent double voting
);

-- Create indexes for better performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_polls_creator_id ON polls(creator_id);
CREATE INDEX idx_polls_creator_address ON polls(creator_address);
CREATE INDEX idx_polls_end_time ON polls(end_time);
CREATE INDEX idx_polls_is_active ON polls(is_active);
CREATE INDEX idx_polls_category ON polls(category);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_votes_voter_address ON votes(voter_address);
CREATE INDEX idx_votes_option_index ON votes(option_index);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at 
  BEFORE UPDATE ON polls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only update their own profile
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Anyone can view polls
CREATE POLICY "Anyone can view polls" ON polls
  FOR SELECT USING (true);

-- Only authenticated users can create polls
CREATE POLICY "Authenticated users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Poll creators can update their own polls
CREATE POLICY "Poll creators can update own polls" ON polls
  FOR UPDATE USING (creator_id::text = auth.uid()::text);

-- Anyone can view votes (for transparency)
CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT USING (true);

-- Only authenticated users can create votes
CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert some sample data for testing
INSERT INTO users (wallet_address, username, avatar_url) VALUES
('0x742d35b2dc1bba2e8a5cf3e6e2d0b1b4c5a6e7f8', 'Alice Crypto', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3E%3Crect width="150" height="150" fill="%23f0b90b"/%3E%3Ctext x="75" y="85" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" font-weight="bold"%3EAC%3C/text%3E%3C/svg%3E'),
('0x123a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a', 'Bob Builder', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3E%3Crect width="150" height="150" fill="%2310b981"/%3E%3Ctext x="75" y="85" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" font-weight="bold"%3EBB%3C/text%3E%3C/svg%3E');

-- Insert sample polls
INSERT INTO polls (title, description, creator_id, creator_address, options, category, duration_hours, end_time) 
SELECT 
  'Which blockchain will dominate 2024?',
  'Predict which blockchain technology will have the most adoption in 2024',
  u.id,
  u.wallet_address,
  ARRAY['Ethereum', 'Binance Smart Chain', 'Solana', 'Polygon'],
  'Technology',
  168, -- 7 days
  NOW() + INTERVAL '7 days'
FROM users u WHERE u.wallet_address = '0x742d35b2dc1bba2e8a5cf3e6e2d0b1b4c5a6e7f8'
LIMIT 1;
