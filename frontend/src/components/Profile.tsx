import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from 'wagmi';
import ProfileCard from './ProfileCard';

const Profile: React.FC = () => {
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();
  const { address } = useAccount();

  useEffect(() => {
    if (profileRef.current) {
      gsap.fromTo(
        profileRef.current,
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
        }
      );
    }
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-secondary-900">
        {/* Background effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(240,185,11,0.1),transparent_50%)]" />
        
                 <div className="relative z-10 flex items-center justify-center min-h-screen">
           <div className="text-center max-w-2xl mx-auto px-6">
             <h1 className="text-gradient text-4xl font-bold mb-6">
               User Profile
             </h1>
             <p className="text-lg text-secondary-300 mb-8 leading-relaxed">
               Connect your wallet and authenticate to view your profile information.
             </p>
           </div>
         </div>
      </div>
    );
  }

  return (
    <div ref={profileRef} className="min-h-screen bg-secondary-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(240,185,11,0.1),transparent_50%)]" />
      
      <div className="relative z-10">
                 {/* Header Section */}
         <section className="pt-20 pb-16">
           <div className="container-custom">
             <div className="text-center mb-12">
               <h1 className="text-gradient text-4xl font-bold mb-6">
                 User Profile
               </h1>
               <p className="text-lg text-secondary-300 max-w-2xl mx-auto leading-relaxed">
                 View your profile information, statistics, and activity on BinPoll.
               </p>
             </div>
           </div>
         </section>

        {/* Profile Content */}
        <section className="pb-20">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-center mb-12">
                <ProfileCard
                  name={user.username || 'Anonymous User'}
                  title="BinPoll User"
                  handle={user.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : 'user'}
                  status="Online"
                  contactText="Edit Profile"
                  avatarUrl={user.avatarUrl || `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="#f0b90b"/><text x="200" y="320" font-family="Arial, sans-serif" font-size="120" fill="#1a1a1b" text-anchor="middle" font-weight="bold">U</text></svg>')}`}
                  showUserInfo={true}
                  enableTilt={true}
                  enableMobileTilt={false}
                  onContactClick={() => console.log('Edit profile clicked')}
                />
              </div>

              {/* Profile Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Polls Created</h3>
                    <p className="text-2xl font-bold text-primary-400">{user.totalPollsCreated || 0}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Votes Cast</h3>
                    <p className="text-2xl font-bold text-primary-400">{user.totalVotesCast || 0}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Member Since</h3>
                    <p className="text-lg font-medium text-secondary-300">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Wallet Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-xl font-semibold text-white mb-4">Wallet Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-300">Wallet Address:</span>
                    <span className="font-mono text-white">{address || 'Not connected'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-300">Username:</span>
                    <span className="text-white">{user.username || 'Not set'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-secondary-300">User ID:</span>
                    <span className="text-white">{user.id}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
