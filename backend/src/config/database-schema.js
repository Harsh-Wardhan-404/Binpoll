/**
 * Database Schema Documentation
 * 
 * This file contains the complete database schema based on all migrations:
 * - 20250822063659_create_tables.sql
 * - 20250822070000_update_schema_for_wallet_auth.sql
 * - 20250823080000_add_credibility_and_voting_limits.sql
 * - 20250823000000_add_blockchain_columns.sql
 * - 20250823001000_fix_votes_rls_policy.sql
 */

const { sql, supabase } = require('./database');

/**
 * DATABASE SCHEMA
 */

// USERS TABLE
const USERS_TABLE = {
  name: 'users',
  columns: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    wallet_address: 'VARCHAR(42) UNIQUE NOT NULL',
    username: 'VARCHAR(100)',
    avatar_url: 'TEXT',
    total_polls_created: 'INTEGER DEFAULT 0',
    total_votes_cast: 'INTEGER DEFAULT 0',
    credibility_score: 'DECIMAL(5,2) DEFAULT 60.00 CHECK (credibility_score >= 0 AND credibility_score <= 100)',
    successful_predictions: 'INTEGER DEFAULT 0',
    total_predictions: 'INTEGER DEFAULT 0',
    reputation_level: 'VARCHAR(20) DEFAULT \'Novice\' CHECK (reputation_level IN (\'Novice\', \'Apprentice\', \'Expert\', \'Master\', \'Legend\'))',
    last_activity: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
  }
};

// POLLS TABLE
const POLLS_TABLE = {
  name: 'polls',
  columns: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    title: 'VARCHAR(200) NOT NULL',
    description: 'TEXT NOT NULL',
    creator_id: 'UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE',
    creator_address: 'VARCHAR(42) NOT NULL',
    options: 'TEXT[] NOT NULL', // Store options as array
    category: 'VARCHAR(50) DEFAULT \'General\'',
    duration_hours: 'INTEGER NOT NULL',
    end_time: 'TIMESTAMP WITH TIME ZONE NOT NULL',
    is_active: 'BOOLEAN DEFAULT TRUE',
    total_votes: 'INTEGER DEFAULT 0',
    total_pool: 'DECIMAL(18, 8) DEFAULT 0', // For cryptocurrency amounts
    contract_poll_id: 'INTEGER NULL', // Reference to blockchain poll ID
    is_on_chain: 'BOOLEAN DEFAULT FALSE',
    blockchain_id: 'VARCHAR(50) NULL',
    transaction_hash: 'VARCHAR(66) NULL',
    min_credibility_required: 'DECIMAL(5,2) DEFAULT 0.00 CHECK (min_credibility_required >= 0 AND min_credibility_required <= 100)',
    max_voters: 'INTEGER DEFAULT NULL CHECK (max_voters IS NULL OR max_voters > 0)',
    current_voter_count: 'INTEGER DEFAULT 0',
    is_credibility_gated: 'BOOLEAN DEFAULT FALSE',
    voting_weight_multiplier: 'DECIMAL(3,2) DEFAULT 1.00 CHECK (voting_weight_multiplier >= 0.1 AND voting_weight_multiplier <= 5.0)',
    creator_credibility_bonus: 'DECIMAL(5,2) DEFAULT 0.00 CHECK (creator_credibility_bonus >= 0 AND creator_credibility_bonus <= 10)',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    updated_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
  }
};

// VOTES TABLE
const VOTES_TABLE = {
  name: 'votes',
  columns: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    poll_id: 'UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE',
    voter_id: 'UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE',
    voter_address: 'VARCHAR(42) NOT NULL',
    option_index: 'INTEGER NOT NULL', // Index of the option in the poll.options array
    amount: 'DECIMAL(18, 8) NOT NULL DEFAULT 0.001', // Amount voted (for prediction markets)
    tx_hash: 'VARCHAR(66) NULL', // Blockchain transaction hash
    is_on_chain: 'BOOLEAN DEFAULT FALSE',
    voter_credibility_at_time: 'DECIMAL(5,2) NOT NULL',
    vote_weight: 'DECIMAL(8,4) DEFAULT 1.0000',
    credibility_earned: 'DECIMAL(5,2) DEFAULT 0.00',
    is_correct_prediction: 'BOOLEAN DEFAULT NULL',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
  },
  constraints: {
    unique_poll_voter: 'UNIQUE(poll_id, voter_address)' // Prevent double voting
  }
};

// POLL RESULTS TABLE
const POLL_RESULTS_TABLE = {
  name: 'poll_results',
  columns: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    poll_id: 'UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE',
    winning_option_index: 'INTEGER NOT NULL',
    total_participants: 'INTEGER NOT NULL',
    total_votes_cast: 'INTEGER NOT NULL',
    average_credibility: 'DECIMAL(5,2) NOT NULL',
    result_announced_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
    created_at: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
  }
};

/**
 * HELPER FUNCTIONS FOR DATABASE QUERIES
 */

// User-related queries
const UserQueries = {
  // Get user by ID
  getById: (userId) => sql`
    SELECT * FROM users WHERE id = ${userId}
  `,

  // Get user by wallet address
  getByWalletAddress: (walletAddress) => sql`
    SELECT * FROM users WHERE wallet_address = ${walletAddress.toLowerCase()}
  `,

  // Get user profile with stats
  getProfileWithStats: (userId) => sql`
    SELECT 
      u.*,
      COALESCE(poll_count.count, 0) as total_polls_created,
      COALESCE(vote_count.count, 0) as total_votes_cast
    FROM users u
    LEFT JOIN (
      SELECT creator_id, COUNT(*) as count 
      FROM polls 
      WHERE creator_id = ${userId}
    ) poll_count ON u.id = poll_count.creator_id
    LEFT JOIN (
      SELECT voter_id, COUNT(*) as count 
      FROM votes 
      WHERE voter_id = ${userId}
    ) vote_count ON u.id = vote_count.voter_id
    WHERE u.id = ${userId}
  `,

  // Update user stats
  updateStats: (userId) => sql`
    UPDATE users 
    SET 
      total_polls_created = (
        SELECT COUNT(*) FROM polls WHERE creator_id = ${userId}
      ),
      total_votes_cast = (
        SELECT COUNT(*) FROM votes WHERE voter_id = ${userId}
      ),
      updated_at = NOW()
    WHERE id = ${userId}
  `,

  // Get users by credibility range
  getByCredibilityRange: (minCredibility, maxCredibility) => sql`
    SELECT 
      id, username, avatar_url, credibility_score, reputation_level, 
      total_polls_created, total_votes_cast
    FROM users 
    WHERE credibility_score >= ${minCredibility} 
    AND credibility_score <= ${maxCredibility}
    ORDER BY credibility_score DESC
  `
};

// Poll-related queries
const PollQueries = {
  // Get all polls with creator info
  getAllWithCreator: () => sql`
    SELECT 
      p.*,
      u.username as creator_username,
      u.avatar_url as creator_avatar,
      u.credibility_score as creator_credibility
    FROM polls p
    LEFT JOIN users u ON p.creator_id = u.id
    ORDER BY p.created_at DESC
  `,

  // Get poll by ID with creator info
  getByIdWithCreator: (pollId) => sql`
    SELECT 
      p.*,
      u.username as creator_username,
      u.avatar_url as creator_avatar,
      u.credibility_score as creator_credibility
    FROM polls p
    LEFT JOIN users u ON p.creator_id = u.id
    WHERE p.id = ${pollId}
  `,

  // Get polls by creator
  getByCreator: (creatorId) => sql`
    SELECT * FROM polls 
    WHERE creator_id = ${creatorId}
    ORDER BY created_at DESC
  `,

  // Get polls by credibility requirement
  getByCredibilityRequirement: (minCredibility) => sql`
    SELECT * FROM polls 
    WHERE min_credibility_required >= ${minCredibility}
    AND is_active = true
    ORDER BY created_at DESC
  `,

  // Get polls with voting limits
  getWithVotingLimits: () => sql`
    SELECT * FROM polls 
    WHERE max_voters IS NOT NULL
    AND is_active = true
    ORDER BY created_at DESC
  `,

  // Update poll stats
  updatePollStats: (pollId) => sql`
    UPDATE polls 
    SET 
      total_votes = (
        SELECT COUNT(*) FROM votes WHERE poll_id = ${pollId}
      ),
      current_voter_count = (
        SELECT COUNT(DISTINCT voter_address) FROM votes WHERE poll_id = ${pollId}
      ),
      updated_at = NOW()
    WHERE id = ${pollId}
  `
};

// Vote-related queries
const VoteQueries = {
  // Get votes for a poll with voter info
  getByPollWithVoter: (pollId) => sql`
    SELECT 
      v.*,
      u.username as voter_username,
      u.avatar_url as voter_avatar,
      u.credibility_score as voter_credibility
    FROM votes v
    LEFT JOIN users u ON v.voter_id = u.id
    WHERE v.poll_id = ${pollId}
    ORDER BY v.created_at DESC
  `,

  // Get votes by user
  getByUser: (userId) => sql`
    SELECT 
      v.*,
      p.title as poll_title,
      p.options as poll_options
    FROM votes v
    LEFT JOIN polls p ON v.poll_id = p.id
    WHERE v.voter_id = ${userId}
    ORDER BY v.created_at DESC
  `,

  // Get vote statistics for a poll
  getPollStats: (pollId) => sql`
    SELECT 
      option_index,
      COUNT(*) as vote_count,
      SUM(amount) as total_amount,
      AVG(voter_credibility_at_time) as avg_credibility
    FROM votes 
    WHERE poll_id = ${pollId}
    GROUP BY option_index
    ORDER BY option_index
  `,

  // Check if user has voted on poll
  hasUserVoted: (pollId, voterAddress) => sql`
    SELECT COUNT(*) as has_voted
    FROM votes 
    WHERE poll_id = ${pollId} 
    AND voter_address = ${voterAddress.toLowerCase()}
  `
};

// Poll Results queries
const PollResultQueries = {
  // Get poll results
  getByPoll: (pollId) => sql`
    SELECT * FROM poll_results 
    WHERE poll_id = ${pollId}
  `,

  // Create poll result
  create: (pollId, winningOptionIndex, totalParticipants, totalVotesCast, averageCredibility) => sql`
    INSERT INTO poll_results (
      poll_id, winning_option_index, total_participants, 
      total_votes_cast, average_credibility
    ) VALUES (
      ${pollId}, ${winningOptionIndex}, ${totalParticipants}, 
      ${totalVotesCast}, ${averageCredibility}
    )
    RETURNING *
  `
};

/**
 * UTILITY FUNCTIONS
 */

const DatabaseUtils = {
  // Update user activity
  updateUserActivity: async (userId) => {
    return await sql`
      UPDATE users 
      SET last_activity = NOW() 
      WHERE id = ${userId}
    `;
  },

  // Get user credibility score
  getUserCredibility: async (userId) => {
    const result = await sql`
      SELECT credibility_score, reputation_level 
      FROM users 
      WHERE id = ${userId}
    `;
    return result[0];
  },

  // Validate voting eligibility
  validateVotingEligibility: async (pollId, voterId, voterCredibility) => {
    const poll = await sql`
      SELECT * FROM polls WHERE id = ${pollId}
    `;
    
    if (!poll[0] || !poll[0].is_active) return false;
    if (poll[0].end_time < new Date()) return false;
    if (voterCredibility < poll[0].min_credibility_required) return false;
    
    if (poll[0].max_voters) {
      const currentVoters = await sql`
        SELECT COUNT(*) as count FROM votes WHERE poll_id = ${pollId}
      `;
      if (currentVoters[0].count >= poll[0].max_voters) return false;
    }
    
    return true;
  },

  // Calculate vote weight
  calculateVoteWeight: (voterCredibility, pollWeightMultiplier) => {
    return Math.min(5.0, Math.max(0.1, (voterCredibility / 100.0) * pollWeightMultiplier));
  },

  // Update all user stats
  updateAllUserStats: async (userId) => {
    await UserQueries.updateStats(userId);
    await DatabaseUtils.updateUserActivity(userId);
  }
};

module.exports = {
  // Schema definitions
  USERS_TABLE,
  POLLS_TABLE,
  VOTES_TABLE,
  POLL_RESULTS_TABLE,
  
  // Query helpers
  UserQueries,
  PollQueries,
  VoteQueries,
  PollResultQueries,
  
  // Utilities
  DatabaseUtils,
  
  // Database connection
  sql,
  supabase
};
