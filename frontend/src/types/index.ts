// Poll related types
export interface Poll {
  id: string;
  title: string;
  description: string;
  options: string[];
  category: string;
  end_time: string;
  is_active: boolean;
  total_votes: number;
  optionVotes: number[];
  totalVotes: number;
  users: {
    id: string;
    username: string;
    wallet_address: string;
    avatar_url: string;
  };
}

export interface CreatePollData {
  title: string;
  description: string;
  options: string[];
  durationHours: number;
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
