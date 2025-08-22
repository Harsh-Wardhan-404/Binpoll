import React, { useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';
import { useAuth } from '../hooks/useAuth';
import { useAccount } from 'wagmi';
import { useUserProfile } from '../hooks/useUserProfile';
import ProfileCard from './ProfileCard';

const Profile: React.FC = () => {
  const profileRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const { address } = useAccount();
  const { profile, loading, error, refreshProfile } = useUserProfile();

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

  if (!isAuthenticated) {
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
              {loading ? (
                <div className="flex justify-center mb-12">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-secondary-300 text-lg">Loading profile...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex justify-center mb-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-red-400 text-lg mb-4">Failed to load profile</p>
                    <button
                      onClick={refreshProfile}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : profile ? (
                <div className="flex justify-center mb-12">
                  <ProfileCard
                    name={profile.username}
                    title={profile.stats.rank}
                    handle={profile.walletAddress ? `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}` : 'user'}
                    status="Online"
                    contactText="Edit Profile"
                    avatarUrl={profile.avatarUrl}
                    showUserInfo={true}
                    enableTilt={false}
                    enableMobileTilt={false}
                    onContactClick={() => console.log('Edit profile clicked')}
                  />
                </div>
              ) : null}

              {/* Profile Stats */}
              {profile && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
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
                      <p className="text-2xl font-bold text-primary-400">{profile.totalPollsCreated}</p>
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
                      <p className="text-2xl font-bold text-primary-400">{profile.totalVotesCast}</p>
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
                      <h3 className="text-lg font-semibold text-white mb-2">Total Earnings</h3>
                      <p className="text-2xl font-bold text-primary-400">{profile.stats.totalEarnings} BNB</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Rank</h3>
                      <p className="text-lg font-medium text-primary-400">{profile.stats.rank}</p>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Wallet Information */}
              {profile && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <h3 className="text-xl font-semibold text-white mb-4">Wallet Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary-300">Wallet Address:</span>
                      <span className="font-mono text-white">{profile.walletAddress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary-300">Username:</span>
                      <span className="text-white">{profile.username}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary-300">User ID:</span>
                      <span className="text-white">{profile.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary-300">Balance:</span>
                      <span className="text-white">{profile.balance.bnb} BNB (${profile.balance.usd})</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Recent Activity */}
              {profile && profile.recentActivity && profile.recentActivity.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {profile.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {activity.type === 'poll_created' && (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                              {activity.type === 'vote_cast' && (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                              )}
                              {activity.type === 'poll_ended' && (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              )}
                            </svg>
                          </div>
                          <div>
                            <p className="text-white font-medium">{activity.title}</p>
                            <p className="text-secondary-300 text-sm">
                              {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-primary-400 text-sm font-medium capitalize">
                          {activity.type.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
