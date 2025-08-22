import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from 'wagmi';
import apiClient from '../lib/api';

const AuthTest: React.FC = () => {
  const { isAuthenticated, user, authenticate, isLoading } = useAuth();
  const { address, isConnected } = useAccount();

  const testApiConnection = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/test');
      const data = await response.json();
      console.log('API Test Response:', data);
      alert(`API Connection: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('API Test Error:', error);
      alert(`API Error: ${error}`);
    }
  };

  const testAuthentication = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      console.log('Starting authentication test...');
      await authenticate();
      console.log('Authentication successful!');
    } catch (error) {
      console.error('Authentication test error:', error);
      alert(`Authentication Error: ${error}`);
    }
  };

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-4 rounded-lg text-sm max-w-md">
      <h3 className="font-bold mb-2">🔧 Auth Debug Panel</h3>
      
      <div className="space-y-2 text-xs">
        <div>Wallet Connected: {isConnected ? '✅' : '❌'}</div>
        <div>Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None'}</div>
        <div>Auth Loading: {isLoading ? '⏳' : '✅'}</div>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {user ? user.username : 'None'}</div>
        <div>API Token: {apiClient.getToken() ? '✅' : '❌'}</div>
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={testApiConnection}
          className="block w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
        >
          Test API Connection
        </button>
        
        <button
          onClick={testAuthentication}
          disabled={!isConnected || isLoading}
          className="block w-full px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-xs"
        >
          Test Authentication
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Check browser console for details
      </div>
    </div>
  );
};

export default AuthTest;
