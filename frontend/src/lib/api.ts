const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  getToken() {
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async authenticateWallet(address: string, message: string, signature: string) {
    return this.request<{
      success: boolean;
      token: string;
      user: {
        id: string;
        walletAddress: string;
        username: string;
        avatarUrl: string;
      };
    }>('/auth/wallet', {
      method: 'POST',
      body: JSON.stringify({ address, message, signature }),
    });
  }

  async getProfile() {
    return this.request<{
      success: boolean;
      user: {
        id: string;
        walletAddress: string;
        username: string;
        avatarUrl: string;
        totalPollsCreated: number;
        totalVotesCast: number;
        createdAt: string;
      };
    }>('/auth/me');
  }

  async getUserProfile() {
    return this.request<{
      success: boolean;
      data: {
        id: string;
        walletAddress: string;
        username: string;
        avatarUrl: string;
        totalPollsCreated: number;
        totalVotesCast: number;
        balance: {
          bnb: string;
          usd: string;
        };
        stats: {
          pollsCreated: number;
          votesCast: number;
          totalEarnings: string;
          rank: string;
        };
        recentActivity: Array<{
          id: string;
          type: 'poll_created' | 'vote_cast' | 'poll_ended';
          title: string;
          timestamp: string;
          amount?: string;
        }>;
      };
    }>('/users/profile');
  }

  async updateProfile(username: string) {
    return this.request<{
      success: boolean;
      user: {
        id: string;
        walletAddress: string;
        username: string;
        avatarUrl: string;
      };
    }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ username }),
    });
  }

  async verifyToken() {
    return this.request<{
      success: boolean;
      valid: boolean;
      user: {
        id: string;
        walletAddress: string;
        username: string;
        avatarUrl: string;
      };
    }>('/auth/verify', {
      method: 'POST',
    });
  }

  // Poll endpoints
  async getPolls(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request<{
      success: boolean;
      count: number;
      data: Array<{
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
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
      };
    }>(`/polls${query ? `?${query}` : ''}`);
  }

  async getPoll(id: string) {
    return this.request<{
      success: boolean;
      data: {
        id: string;
        title: string;
        description: string;
        options: string[];
        category: string;
        end_time: string;
        is_active: boolean;
        total_votes: number;
        optionVotes: number[];
        optionPercentages: number[];
        totalVotes: number;
        userVote: number | null;
        isActive: boolean;
        users: {
          id: string;
          username: string;
          wallet_address: string;
          avatar_url: string;
        };
      };
    }>(`/polls/${id}`);
  }

  async createPoll(data: {
    title: string;
    description: string;
    options: string[];
    durationHours: number;
    category?: string;
  }) {
    return this.request<{
      success: boolean;
      data: {
        id: string;
        title: string;
        description: string;
        options: string[];
        category: string;
        end_time: string;
        is_active: boolean;
        total_votes: number;
        optionVotes: number[];
        optionPercentages: number[];
        totalVotes: number;
      };
    }>('/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createBlockchainPoll(data: {
    title: string;
    description: string;
    options: string[];
    durationHours: number;
    category?: string;
    blockchainId: string;
    transactionHash: string;
    creatorAddress: string;
    totalPool: string;
  }) {
    return this.request<{
      success: boolean;
      data: {
        id: string;
        title: string;
        description: string;
        options: string[];
        category: string;
        end_time: string;
        is_active: boolean;
        total_votes: number;
        optionVotes: number[];
        optionPercentages: number[];
        totalVotes: number;
        blockchain_id?: string;
        transaction_hash?: string;
        creator_address?: string;
        total_pool?: string;
      };
    }>('/polls/blockchain', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async voteOnPoll(pollId: string, optionIndex: number, amount?: string) {
    return this.request<{
      success: boolean;
      data: {
        vote: {
          id: string;
          poll_id: string;
          option_index: number;
          amount: string;
        };
        poll: {
          id: string;
          total_votes: number;
          total_pool: string;
        };
      };
    }>(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionIndex, amount }),
    });
  }

  async voteOnBlockchainPoll(pollId: string, optionIndex: number, transactionHash: string, amount?: string) {
    return this.request<{
      success: boolean;
      data: {
        vote: {
          id: string;
          option_index: number;
          amount: string;
          voter_address: string;
          tx_hash: string;
          created_at: string;
        };
        poll: {
          id: string;
          total_votes: number;
          total_pool: string;
        };
        transactionHash: string;
      };
    }>(`/polls/${pollId}/vote/blockchain`, {
      method: 'POST',
      body: JSON.stringify({ optionIndex, transactionHash, amount }),
    });
  }

  async getMyVotes() {
    return this.request<{
      success: boolean;
      count: number;
      data: Array<{
        id: string;
        option_index: number;
        amount: string;
        created_at: string;
        polls: {
          id: string;
          title: string;
          options: string[];
          end_time: string;
          is_active: boolean;
          users: {
            username: string;
            wallet_address: string;
          };
        };
      }>;
    }>('/polls/my-votes');
  }

  async getPollsByCreator(creatorAddress: string) {
    return this.request<{
      success: boolean;
      count: number;
      data: Array<{
        id: string;
        title: string;
        description: string;
        options: string[];
        category: string;
        end_time: string;
        is_active: boolean;
        total_votes: number;
      }>;
    }>(`/polls/creator/${creatorAddress}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
