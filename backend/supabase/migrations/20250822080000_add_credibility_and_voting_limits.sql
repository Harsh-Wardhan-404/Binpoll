-- Migration to add user credibility, voting limits, and enhanced poll management

-- Add credibility and voting limit fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credibility_score DECIMAL(5,2) DEFAULT 60.00 CHECK (credibility_score >= 0 AND credibility_score <= 100),
ADD COLUMN IF NOT EXISTS successful_predictions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_predictions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_level VARCHAR(20) DEFAULT 'Novice' CHECK (reputation_level IN ('Novice', 'Apprentice', 'Expert', 'Master', 'Legend')),
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add voting limits and credibility requirements to polls table
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS min_credibility_required DECIMAL(5,2) DEFAULT 0.00 CHECK (min_credibility_required >= 0 AND min_credibility_required <= 100),
ADD COLUMN IF NOT EXISTS max_voters INTEGER DEFAULT NULL CHECK (max_voters IS NULL OR max_voters > 0),
ADD COLUMN IF NOT EXISTS current_voter_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_credibility_gated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS voting_weight_multiplier DECIMAL(3,2) DEFAULT 1.00 CHECK (voting_weight_multiplier >= 0.1 AND voting_weight_multiplier <= 5.0),
ADD COLUMN IF NOT EXISTS creator_credibility_bonus DECIMAL(5,2) DEFAULT 0.00 CHECK (creator_credibility_bonus >= 0 AND creator_credibility_bonus <= 10);

-- Add credibility tracking to votes table
ALTER TABLE votes 
ADD COLUMN IF NOT EXISTS voter_credibility_at_time DECIMAL(5,2) NOT NULL,
ADD COLUMN IF NOT EXISTS vote_weight DECIMAL(8,4) DEFAULT 1.0000,
ADD COLUMN IF NOT EXISTS credibility_earned DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS is_correct_prediction BOOLEAN DEFAULT NULL;

-- Create credibility history table for tracking changes
CREATE TABLE IF NOT EXISTS credibility_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  poll_id UUID REFERENCES polls(id) ON DELETE SET NULL,
  old_score DECIMAL(5,2) NOT NULL,
  new_score DECIMAL(5,2) NOT NULL,
  change_amount DECIMAL(5,2) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll results table for tracking outcomes
CREATE TABLE IF NOT EXISTS poll_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  winning_option_index INTEGER NOT NULL,
  total_participants INTEGER NOT NULL,
  total_votes_cast INTEGER NOT NULL,
  average_credibility DECIMAL(5,2) NOT NULL,
  result_announced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_credibility_score ON users(credibility_score);
CREATE INDEX IF NOT EXISTS idx_users_reputation_level ON users(reputation_level);
CREATE INDEX IF NOT EXISTS idx_polls_min_credibility ON polls(min_credibility_required);
CREATE INDEX IF NOT EXISTS idx_polls_max_voters ON polls(max_voters);
CREATE INDEX IF NOT EXISTS idx_votes_voter_credibility ON votes(voter_credibility_at_time);
CREATE INDEX IF NOT EXISTS idx_credibility_history_user_id ON credibility_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credibility_history_poll_id ON credibility_history(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_results_poll_id ON poll_results(poll_id);

-- Function to calculate reputation level based on credibility score
CREATE OR REPLACE FUNCTION calculate_reputation_level(credibility_score DECIMAL)
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN CASE 
    WHEN credibility_score >= 95 THEN 'Legend'
    WHEN credibility_score >= 85 THEN 'Master'
    WHEN credibility_score >= 70 THEN 'Expert'
    WHEN credibility_score >= 55 THEN 'Apprentice'
    ELSE 'Novice'
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to update user credibility after poll ends
CREATE OR REPLACE FUNCTION update_user_credibility_after_poll()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  credibility_change DECIMAL(5,2);
  new_credibility DECIMAL(5,2);
  new_reputation VARCHAR(20);
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM users WHERE id = NEW.voter_id;
  
  -- Calculate credibility change based on prediction accuracy
  IF NEW.is_correct_prediction = TRUE THEN
    credibility_change := 2.0; -- +2 points for correct prediction
  ELSIF NEW.is_correct_prediction = FALSE THEN
    credibility_change := -1.0; -- -1 point for incorrect prediction
  ELSE
    credibility_change := 0.0; -- No change if prediction not evaluated
  END IF;
  
  -- Calculate new credibility score
  new_credibility := GREATEST(0, LEAST(100, user_record.credibility_score + credibility_change));
  
  -- Update user credibility
  UPDATE users 
  SET 
    credibility_score = new_credibility,
    reputation_level = calculate_reputation_level(new_credibility),
    successful_predictions = CASE WHEN NEW.is_correct_prediction = TRUE 
                                 THEN successful_predictions + 1 
                                 ELSE successful_predictions END,
    total_predictions = total_predictions + 1,
    last_activity = NOW()
  WHERE id = NEW.voter_id;
  
  -- Record credibility change in history
  INSERT INTO credibility_history (
    user_id, 
    poll_id, 
    old_score, 
    new_score, 
    change_amount, 
    reason
  ) VALUES (
    NEW.voter_id,
    NEW.poll_id,
    user_record.credibility_score,
    new_credibility,
    credibility_change,
    CASE 
      WHEN NEW.is_correct_prediction = TRUE THEN 'Correct prediction'
      WHEN NEW.is_correct_prediction = FALSE THEN 'Incorrect prediction'
      ELSE 'Vote cast'
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate voting eligibility
CREATE OR REPLACE FUNCTION validate_voting_eligibility(
  p_poll_id UUID,
  p_voter_id UUID,
  p_voter_credibility DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  poll_record RECORD;
  current_voter_count INTEGER;
BEGIN
  -- Get poll information
  SELECT * INTO poll_record FROM polls WHERE id = p_poll_id;
  
  -- Check if poll exists and is active
  IF NOT FOUND OR NOT poll_record.is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Check if poll has ended
  IF poll_record.end_time < NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- Check minimum credibility requirement
  IF p_voter_credibility < poll_record.min_credibility_required THEN
    RETURN FALSE;
  END IF;
  
  -- Check maximum voter limit
  IF poll_record.max_voters IS NOT NULL THEN
    SELECT COUNT(*) INTO current_voter_count 
    FROM votes 
    WHERE poll_id = p_poll_id;
    
    IF current_voter_count >= poll_record.max_voters THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate vote weight based on credibility
CREATE OR REPLACE FUNCTION calculate_vote_weight(
  p_voter_credibility DECIMAL,
  p_poll_weight_multiplier DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  -- Base weight calculation: credibility score influences weight
  -- Higher credibility = higher weight, but with diminishing returns
  RETURN LEAST(5.0, GREATEST(0.1, 
    (p_voter_credibility / 100.0) * p_poll_weight_multiplier
  ));
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vote weight and voter credibility when vote is created
CREATE OR REPLACE FUNCTION set_vote_metadata()
RETURNS TRIGGER AS $$
DECLARE
  user_credibility DECIMAL(5,2);
  poll_weight_multiplier DECIMAL(3,2);
  calculated_weight DECIMAL(8,4);
BEGIN
  -- Get user's current credibility
  SELECT credibility_score INTO user_credibility 
  FROM users WHERE id = NEW.voter_id;
  
  -- Get poll's weight multiplier
  SELECT voting_weight_multiplier INTO poll_weight_multiplier 
  FROM polls WHERE id = NEW.poll_id;
  
  -- Set voter credibility at time of vote
  NEW.voter_credibility_at_time := user_credibility;
  
  -- Calculate and set vote weight
  calculated_weight := calculate_vote_weight(user_credibility, poll_weight_multiplier);
  NEW.vote_weight := calculated_weight;
  
  -- Update poll's current voter count
  UPDATE polls 
  SET current_voter_count = current_voter_count + 1
  WHERE id = NEW.poll_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_set_vote_metadata
  BEFORE INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION set_vote_metadata();

CREATE TRIGGER trigger_update_credibility_after_poll
  AFTER UPDATE OF is_correct_prediction ON votes
  FOR EACH ROW
  WHEN (OLD.is_correct_prediction IS NULL AND NEW.is_correct_prediction IS NOT NULL)
  EXECUTE FUNCTION update_user_credibility_after_poll();

-- Update existing users to have default credibility
UPDATE users 
SET 
  credibility_score = 60.00,
  reputation_level = calculate_reputation_level(60.00)
WHERE credibility_score IS NULL;

-- Add RLS policies for new tables
ALTER TABLE credibility_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for credibility_history
CREATE POLICY "Users can view own credibility history" ON credibility_history
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- RLS policies for poll_results
CREATE POLICY "Anyone can view poll results" ON poll_results
  FOR SELECT USING (true);

-- Insert sample data for testing credibility system
INSERT INTO users (wallet_address, username, avatar_url, credibility_score, reputation_level) VALUES
('0x999d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d', 'Credibility Master', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3E%3Crect width="150" height="150" fill="%23ffd700"/%3E%3Ctext x="75" y="85" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" font-weight="bold"%3ECM%3C/text%3E%3C/svg%3E', 95.00, 'Legend'),
('0x888c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c', 'New Voter', 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150"%3E%3Crect width="150" height="150" fill="%2387ceeb"/%3E%3Ctext x="75" y="85" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" font-weight="bold"%3ENV%3C/text%3E%3C/svg%3E', 60.00, 'Novice')
ON CONFLICT (wallet_address) DO NOTHING;
