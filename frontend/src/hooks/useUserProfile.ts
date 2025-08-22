import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { apiClient } from '../lib/api';

export interface UserProfile {
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
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

  // Fetch user profile with balance
  const fetchProfile = useCallback(async () => {
    if (!isConnected || !address) {
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getUserProfile();
      
      if (response.success) {
        setProfile(response.data);
      } else {
        setError('Failed to fetch profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  // Refresh profile data
  const refreshProfile = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Auto-fetch profile when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [isConnected, address, fetchProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
    fetchProfile
  };
}
