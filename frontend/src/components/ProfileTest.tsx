import React from 'react';
import ProfileCard from './ProfileCard';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../hooks/useAuth';

const ProfileTest: React.FC = () => {
  const { profile, loading, error, refreshProfile } = useUserProfile();
  const { isAuthenticated, authenticate } = useAuth();

  const handleRefresh = () => {
    refreshProfile();
  };

  return (
    <div className="min-h-screen bg-secondary-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Profile Card Test</h1>
          
          <div className="flex gap-4 mb-6">
            {!isAuthenticated ? (
              <button
                onClick={authenticate}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh Profile'}
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400">Error: {error}</p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Profile Data:</h2>
            <pre className="bg-white/5 p-4 rounded-lg text-sm text-secondary-300 overflow-auto">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex justify-center">
          <ProfileCard
            avatarUrl=""
            name="Test User"
            title="Test Title"
            handle="testuser"
            status="Online"
            contactText="Contact"
            showUserInfo={true}
            enableTilt={true}
            enableMobileTilt={false}
            onContactClick={() => console.log('Profile clicked')}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileTest;
