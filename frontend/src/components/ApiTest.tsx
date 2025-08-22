import React, { useEffect } from 'react';
import { usePolls } from '../hooks/usePolls';
import { useAuth } from '../hooks/useAuth';

const ApiTest: React.FC = () => {
  const { polls, loading, error, fetchPolls, createPoll } = usePolls();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Fetch polls when component mounts
    fetchPolls();
  }, []); // Remove fetchPolls from dependency array since it's now memoized

  const handleCreateTestPoll = async () => {
    if (!isAuthenticated) {
      alert('Please authenticate first');
      return;
    }

    try {
      const newPoll = await createPoll({
        title: 'Test Poll from Frontend',
        description: 'This is a test poll created from the frontend API',
        options: ['Option 1', 'Option 2', 'Option 3'],
        durationHours: 24,
        category: 'Test'
      });

      if (newPoll) {
        alert('Test poll created successfully!');
        // Refresh the polls list
        fetchPolls();
      }
    } catch (error) {
      console.error('Error creating test poll:', error);
      alert('Failed to create test poll');
    }
  };

  return (
    <div className="p-6 bg-secondary-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">API Test Component</h2>
      
      <div className="mb-6">
        <button
          onClick={handleCreateTestPoll}
          disabled={!isAuthenticated || loading}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Test Poll'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400">Error: {error}</p>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Polls from API ({polls.length})
        </h3>
        {loading ? (
          <p className="text-secondary-300">Loading polls...</p>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => (
              <div key={poll.id} className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-white font-medium">{poll.title}</h4>
                <p className="text-secondary-300 text-sm">{poll.description}</p>
                <div className="mt-2">
                  <p className="text-secondary-400 text-xs">
                    Options: {poll.options.join(', ')}
                  </p>
                  <p className="text-secondary-400 text-xs">
                    Total Votes: {poll.totalVotes} | Category: {poll.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-secondary-400">
        <p>Authentication Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
        {user && (
          <p>User: {user.username} ({user.walletAddress})</p>
        )}
      </div>
    </div>
  );
};

export default ApiTest;
