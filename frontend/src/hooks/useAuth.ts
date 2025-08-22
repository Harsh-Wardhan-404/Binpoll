import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import apiClient from '../lib/api';

interface User {
  id: string;
  walletAddress: string;
  username: string;
  avatarUrl: string;
  totalPollsCreated?: number;
  totalVotesCast?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem('auth_token'),
    isLoading: true,
  });

  const { address, isConnected } = useAccount();

  // Sign authentication message
  const signMessage = useCallback(async (walletAddress: string): Promise<{ message: string; signature: string }> => {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const message = `Sign this message to authenticate with BinPoll.

Wallet: ${walletAddress}
Timestamp: ${Date.now()}
Nonce: ${Math.random().toString(36).substring(2, 15)}

This request will not trigger a blockchain transaction or cost any gas fees.`;

    const signature = await signer.signMessage(message);

    return { message, signature };
  }, []);

  // Authenticate with backend
  const authenticate = useCallback(async (): Promise<void> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Sign authentication message
      const { message, signature } = await signMessage(address);

      // Authenticate with backend
      const response = await apiClient.authenticateWallet(address, message, signature);

      if (response.success) {
        apiClient.setToken(response.token);
        setAuthState({
          isAuthenticated: true,
          user: response.user,
          token: response.token,
          isLoading: false,
        });
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [isConnected, address, signMessage]);

  // Logout
  const logout = useCallback(() => {
    apiClient.setToken(null);
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    });
  }, []);

  // Update profile
  const updateProfile = useCallback(async (username: string): Promise<void> => {
    try {
      const response = await apiClient.updateProfile(username);
      if (response.success) {
        setAuthState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, username: response.user.username } : null,
        }));
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }, []);

  // Verify token on app startup
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        apiClient.setToken(token);
        const response = await apiClient.verifyToken();
        
        if (response.success && response.valid) {
          setAuthState({
            isAuthenticated: true,
            user: response.user,
            token,
            isLoading: false,
          });
        } else {
          logout();
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        logout();
      }
    };

    verifyToken();
  }, [logout]);

  // Handle wallet disconnection
  useEffect(() => {
    if (!isConnected && authState.isAuthenticated) {
      logout();
    }
  }, [isConnected, authState.isAuthenticated, logout]);

  return {
    ...authState,
    authenticate,
    logout,
    updateProfile,
    signMessage,
  };
};
