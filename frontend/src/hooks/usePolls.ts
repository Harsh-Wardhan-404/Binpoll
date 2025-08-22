import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../lib/api';
import type { Poll, CreatePollData, PollsResponse, CreatePollResponse, PollFilters } from '../types';

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const isLoadingRef = useRef(false);

  // Fetch polls with filters
  const fetchPolls = useCallback(async (params?: PollFilters) => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('🔄 fetchPolls: Skipping call - already loading');
      return;
    }
    
    console.log('📡 fetchPolls: Starting API call');
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getPolls(params);
      
      if (response.success) {
        setPolls(response.data);
        setPagination(response.pagination);
        console.log('✅ fetchPolls: Success - loaded', response.data.length, 'polls');
      } else {
        setError('Failed to fetch polls');
        console.log('❌ fetchPolls: API returned error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch polls');
      console.log('❌ fetchPolls: Exception -', err.message);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Create a new poll
  const createPoll = useCallback(async (pollData: CreatePollData): Promise<Poll | null> => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) return null;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await apiClient.createPoll(pollData);
      
      if (response.success) {
        // Add the new poll to the beginning of the list
        setPolls(prevPolls => [response.data, ...prevPolls]);
        return response.data;
      } else {
        setError('Failed to create poll');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create poll');
      return null;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Create a blockchain poll (save to database after blockchain transaction)
  const createBlockchainPoll = useCallback(async (pollData: CreatePollData & { 
    blockchainId: string;
    transactionHash: string;
    creatorAddress: string;
    totalPool: string;
  }): Promise<Poll | null> => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) return null;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('💾 Saving blockchain poll to database:', pollData);
      
      const response = await apiClient.createBlockchainPoll(pollData);
      
      if (response.success) {
        // Add the new poll to the beginning of the list
        setPolls(prevPolls => [response.data, ...prevPolls]);
        console.log('✅ Blockchain poll saved to database successfully');
        return response.data;
      } else {
        setError('Failed to save blockchain poll to database');
        console.error('❌ Failed to save blockchain poll:', response);
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save blockchain poll');
      console.error('❌ Error saving blockchain poll:', err);
      return null;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Get a single poll by ID
  const getPoll = useCallback(async (id: string): Promise<Poll | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getPoll(id);
      
      if (response.success) {
        return response.data;
      } else {
        setError('Failed to fetch poll');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch poll');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Vote on a poll
  const voteOnPoll = useCallback(async (pollId: string, optionIndex: number, amount?: string) => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) return null;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await apiClient.voteOnPoll(pollId, optionIndex, amount);
      
      if (response.success) {
        // Refresh the polls to get updated vote counts
        await fetchPolls();
        return response.data;
      } else {
        setError('Failed to vote on poll');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to vote on poll');
      return null;
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [fetchPolls]);

  // Get user's votes
  const getMyVotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getMyVotes();
      
      if (response.success) {
        return response.data;
      } else {
        setError('Failed to fetch user votes');
        return [];
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user votes');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get polls by creator
  const getPollsByCreator = useCallback(async (creatorAddress: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getPollsByCreator(creatorAddress);
      
      if (response.success) {
        return response.data;
      } else {
        setError('Failed to fetch creator polls');
        return [];
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch creator polls');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    polls,
    loading,
    error,
    pagination,
    fetchPolls,
    createPoll,
    createBlockchainPoll,
    getPoll,
    voteOnPoll,
    getMyVotes,
    getPollsByCreator,
    clearError
  };
}
