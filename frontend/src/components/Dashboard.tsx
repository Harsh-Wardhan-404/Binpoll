import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useAccount, useChainId } from 'wagmi';
import { bscTestnet, hardhat } from 'wagmi/chains';
import ProfileCard from './ProfileCard';
import PollCard from './PollCard';
import SearchBar from './SearchBar';
import ScrollVelocity from './ScrollVelocity';
import CreatePollModal from './CreatePollModal';
import WalletConnectAuth from './WalletConnectAuth';
import { usePolls } from '../hooks/usePolls';
import type { Poll } from '../types';



const Dashboard: React.FC = () => {
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // API hooks
  const { polls, loading: isLoading, fetchPolls, createPoll, voteOnPoll } = usePolls();

  // Wagmi hooks
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const isCorrectNetwork = chainId === bscTestnet.id || chainId === hardhat.id;

  const categories = ['All', 'Technology', 'Politics', 'Sports', 'Entertainment', 'Science', 'Lifestyle'];

  // Load polls from API on component mount
  useEffect(() => {
    fetchPolls();
  }, []); // Remove fetchPolls from dependency array since it's now memoized

  useEffect(() => {
    if (dashboardRef.current) {
      gsap.fromTo(
        dashboardRef.current,
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

  useEffect(() => {
    let filtered = polls;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(poll =>
        poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poll.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poll.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(poll => poll.category === selectedCategory);
    }

    setFilteredPolls(filtered);
  }, [polls, searchQuery, selectedCategory]);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!address) return;

    try {
      await voteOnPoll(pollId, optionIndex);
      // The polls will be automatically refreshed by the hook
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  // Transform API poll data to match PollCard interface
  const transformPollForCard = (poll: Poll) => {
    const totalVotes = poll.totalVotes || 0;
    const options = poll.options.map((option, index) => ({
      id: `${poll.id}-${index}`,
      text: option,
      votes: poll.optionVotes?.[index] || 0,
      percentage: totalVotes > 0 ? ((poll.optionVotes?.[index] || 0) / totalVotes) * 100 : 0
    }));

    return {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      options,
      totalVotes,
      endDate: poll.end_time,
      isActive: poll.is_active && new Date(poll.end_time) > new Date(),
      category: poll.category,
      creator: {
        name: poll.users?.username || 'Unknown',
        avatar: poll.users?.avatar_url || ''
      }
    };
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-300 text-lg">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="min-h-screen bg-secondary-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(240,185,11,0.1),transparent_50%)]" />
      
      <div className="relative z-10">
        {/* Header Section */}
        <section className="pt-20 pb-16">
          <div className="container-custom">
            <div className="text-center mb-16">
              <ScrollVelocity
                texts={['Poll Dashboard', 'Vote & Decide']}
                velocity={50}
                className="text-gradient"
                parallaxClassName="mb-8"
                scrollerClassName="text-gradient"
              />
              <p className="text-xl text-secondary-300 max-w-2xl mx-auto leading-relaxed">
                Discover and participate in polls from around the world. Your voice matters in shaping opinions and decisions.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="max-w-4xl mx-auto mb-12">
              <SearchBar onSearch={handleSearch} className="mb-8" />
              
              {/* Category Filters and Create Poll Button */}
              <div className="flex flex-wrap justify-center items-center gap-3">
                <div className="flex flex-wrap justify-center gap-3">
                  {categories.map((category) => (
                    <motion.button
                      key={category}
                      onClick={() => handleCategoryFilter(category)}
                      className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                        selectedCategory === category
                          ? 'bg-primary-500 text-secondary-900 shadow-lg shadow-primary-500/25'
                          : 'bg-white/5 text-secondary-300 hover:bg-white/10 border border-white/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>
                
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  disabled={!isConnected || !isCorrectNetwork}
                  className="ml-4 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-secondary-900 font-semibold rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/25 hover:scale-105 active:scale-95 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Poll</span>
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="pb-20">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Section */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <ProfileCard
                    name="Alex Johnson"
                    title="Poll Enthusiast"
                    handle="alexj"
                    status="Online"
                    contactText="View Profile"
                    avatarUrl={`data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="#f0b90b"/><text x="200" y="320" font-family="Arial, sans-serif" font-size="120" fill="#1a1a1b" text-anchor="middle" font-weight="bold">AJ</text></svg>')}`}
                    showUserInfo={true}
                    enableTilt={true}
                    enableMobileTilt={false}
                    onContactClick={() => console.log('Profile clicked')}
                  />
                </div>
              </div>

              {/* Polls Section */}
              <div className="lg:col-span-2">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {filteredPolls.length} Poll{filteredPolls.length !== 1 ? 's' : ''} Found
                  </h2>
                  <p className="text-secondary-400">
                    {searchQuery && `Searching for: "${searchQuery}"`}
                    {selectedCategory !== 'All' && ` • Category: ${selectedCategory}`}
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {filteredPolls.length > 0 ? (
                    <motion.div
                      key={`${searchQuery}-${selectedCategory}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid gap-6"
                    >
                      {filteredPolls.map((poll, index) => (
                        <motion.div
                          key={poll.id}
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                          <PollCard
                            {...transformPollForCard(poll)}
                            onVote={(pollId, optionId) => {
                              // Extract option index from optionId (format: "pollId-index")
                              const optionIndex = parseInt(optionId.split('-')[1]);
                              handleVote(pollId, optionIndex);
                            }}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20"
                    >
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No polls found</h3>
                      <p className="text-secondary-400">
                        Try adjusting your search or filter criteria
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* Wallet Connection Prompt */}
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 right-8 z-40"
          >
            <div className="bg-secondary-800 border border-primary-500/30 rounded-2xl p-6 max-w-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold mb-2">Connect Your Wallet</h4>
                <p className="text-secondary-300 text-sm mb-4">
                  Connect your wallet to create polls and participate in prediction markets
                </p>
                <WalletConnectAuth className="w-full justify-center" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Network Warning */}
        {isConnected && !isCorrectNetwork && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 right-8 z-40"
          >
            <div className="bg-red-900/90 border border-red-500/50 rounded-2xl p-6 max-w-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold mb-2">Wrong Network</h4>
                <p className="text-red-200 text-sm mb-4">
                  Please switch to BSC Testnet or Hardhat Local to use BinPoll
                </p>
                <div className="text-xs text-red-300">
                  Current: {chainId === 1 ? 'Ethereum Mainnet' : `Chain ${chainId}`}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default Dashboard;
