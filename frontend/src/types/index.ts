// Poll related types
export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  category: string;
  end_time?: string;
  endDate?: string;
  is_active?: boolean;
  isActive?: boolean;
  total_votes?: number;
  totalVotes: number;
  optionVotes?: number[];
  users?: {
    id: string;
    username: string;
    wallet_address: string;
    avatar_url: string;
  };
  creator?: {
    name: string;
    avatar: string;
  };
  // Blockchain specific fields
  isBlockchain?: boolean;
  blockchainId?: bigint | string;
  // Database fields
  is_on_chain?: boolean;
  blockchain_id?: string;
  transaction_hash?: string;
  // User vote information
  userVote?: number | null; // Index of the option the user voted for
  // Settlement information
  settled?: boolean;
  winningOption?: number;
  totalPool?: string;
  creatorAddress?: string;
  // Database fields
  // Additional fields from new API
  total_pool?: number;
  current_voter_count?: number;
  is_credibility_gated?: boolean;
  voting_weight_multiplier?: number;
  creator_credibility_bonus?: number;
  min_credibility_required?: number;
  max_voters?: number | null;
  // Updated users field to include credibility
  users?: {
    id: string;
    username: string;
    wallet_address: string;
    avatar_url: string;
    credibility_score?: number;
    reputation_level?: string;
  };
}

// Detailed poll data from API
export interface PollDetail {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  creator_address: string;
  options: Array<{
    optionIndex: number;
    optionText: string;
    votes: Array<{
      id: string;
      poll_id: string;
      voter_id: string;
      voter_address: string;
      option_index: number;
      amount: number;
      tx_hash: string | null;
      created_at: string;
      is_on_chain: boolean;
      voter_credibility_at_time: number;
      vote_weight: number;
      credibility_earned: number;
      is_correct_prediction: boolean | null;
      users: {
        id: string;
        username: string;
        avatar_url: string;
        wallet_address: string;
        reputation_level: string;
        credibility_score: number;
      };
    }>;
  }>;
  category: string;
  duration_hours: number;
  end_time: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  total_votes: number;
  total_pool: number;
  contract_poll_id: number | null;
  is_on_chain: boolean;
  blockchain_id: string | null;
  transaction_hash: string | null;
  min_credibility_required: number;
  max_voters: number | null;
  current_voter_count: number;
  is_credibility_gated: boolean;
  voting_weight_multiplier: number;
  creator_credibility_bonus: number;
  settled: boolean;
  winning_option: number | null;
  users: {
    id: string;
    username: string;
    avatar_url: string;
    wallet_address: string;
    reputation_level: string;
    credibility_score: number;
  };
  creator: {
    id: string;
    username: string;
    avatar_url: string;
    wallet_address: string;
    reputation_level: string;
    credibility_score: number;
  };
  votes: Array<{
    id: string;
    poll_id: string;
    voter_id: string;
    voter_address: string;
    option_index: number;
    amount: number;
    tx_hash: string | null;
    created_at: string;
    is_on_chain: boolean;
    voter_credibility_at_time: number;
    vote_weight: number;
    credibility_earned: number;
    is_correct_prediction: boolean | null;
    users: {
      id: string;
      username: string;
      avatar_url: string;
      wallet_address: string;
      reputation_level: string;
      credibility_score: number;
    };
  }>;
  pollResult: {
    id: string;
    winning_option_index: number;
    total_participants: number;
    total_votes_cast: number;
    average_credibility: number;
    result_announced_at: string;
  } | null;
  userVote: number | null;
  isActive: boolean;
}

export interface PollOption {
  id?: string;
  text: string;
  votes: number;
  percentage: number;
}

export interface CreatePollData {
  title: string;
  description: string;
  options: string[];
  durationMinutes: number;
  category?: string;
  requiredCredibility?: number;
  pollPrice?: string;
  maxVotes?: number;
}

export interface PollsResponse {
  success: boolean;
  count: number;
  data: Poll[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// New response structure for dashboard
export interface DashboardPollsResponse {
  success: boolean;
  data: {
    recents: Poll[];
    hots: Poll[];
    large_bets: Poll[];
  };
}

export interface CreatePollResponse {
  success: boolean;
  data: Poll;
}

// User related types
export interface User {
  id: string;
  walletAddress: string;
  username: string;
  avatarUrl: string;
  totalPollsCreated?: number;
  totalVotesCast?: number;
  createdAt?: string;
}

// Vote related types
export interface Vote {
  id: string;
  poll_id: string;
  option_index: number;
  amount: string;
  voter_address: string;
  created_at: string;
}

export interface VoteResponse {
  success: boolean;
  data: {
    vote: Vote;
    poll: {
      id: string;
      total_votes: number;
      total_pool: string;
    };
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Filter types
export interface PollFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  status?: string;
}
