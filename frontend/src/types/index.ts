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
  is_on_chain?: boolean;
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
