import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useAccount, useChainId } from 'wagmi';
import { bscTestnet, hardhat } from 'wagmi/chains';
import PollCardSmall from './PollCardSmall';
import PollDetail from './PollDetail';
import SearchBar from './SearchBar';
import ScrollVelocity from './ScrollVelocity';
import CreatePollModal from './CreatePollModal';
import WalletConnectAuth from './WalletConnectAuth';
import { usePolls } from '../hooks/usePolls';
import { useAuth } from '../hooks/useAuth';
import { useSimplePoll } from '../hooks/useSimplePoll';
import type { Poll } from '../types';

const Dashboard: React.FC = () => {
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [blockchainPollsLoading, setBlockchainPollsLoading] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // API hooks
  const { polls, loading: isLoading, fetchPolls, voteOnPoll } = usePolls();

  // Blockchain hooks
  const { getAllPolls } = useSimplePoll();

  // Wagmi hooks
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const isCorrectNetwork = chainId === bscTestnet.id || chainId === hardhat.id;

  // Auth hook
  const { isAuthenticated } = useAuth();

  const categories = ['All', 'Technology', 'Politics', 'Sports', 'Entertainment', 'Science', 'Lifestyle', 'Blockchain'];

  // Fetch all polls (API + Blockchain)
  const fetchAllPolls = async () => {
    console.log('🔄 Fetching all polls...');
    
    // Fetch API polls first
    await fetchPolls();
  };

  // Load blockchain polls when connected to correct network
  const loadBlockchainPolls = async () => {
    if (isConnected && isCorrectNetwork && getAllPolls) {
      setBlockchainPollsLoading(true);
      try {
        const blockchainPolls = await getAllPolls();
        console.log('🔗 Blockchain polls:', blockchainPolls);
        
        // Convert blockchain polls to match our Poll interface
        const formattedBlockchainPolls: Poll[] = blockchainPolls.map(poll => ({
          id: `blockchain-${poll.id}`,
          title: poll.title,
          description: poll.description,
          options: poll.options.map((option: string) => ({
            text: option,
            votes: 0, // TODO: Get actual vote counts
            percentage: 0
          })),
          totalVotes: 0, // TODO: Get total vote count
          endDate: new Date(Number(poll.endTime) * 1000).toISOString(),
          isActive: !poll.settled && new Date(Number(poll.endTime) * 1000) > new Date(),
          category: 'Blockchain', // Default category for blockchain polls
          creator: {
            name: poll.creator,
            avatar: ''
          },
          isBlockchain: true,
          blockchainId: poll.id
        }));
        
        // Combine API polls and blockchain polls
        setAllPolls([...polls, ...formattedBlockchainPolls]);
      } catch (error) {
        console.error('❌ Error fetching blockchain polls:', error);
        setAllPolls(polls); // Fallback to API polls only
      } finally {
        setBlockchainPollsLoading(false);
      }
    } else {
      setAllPolls(polls);
    }
  };

  // Load polls from API only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllPolls();
    }
  }, [isAuthenticated]); // Only fetch when authentication status changes

  // Load blockchain polls when wallet/network changes
  useEffect(() => {
    if (isAuthenticated) {
      loadBlockchainPolls();
    }
  }, [polls, isConnected, isCorrectNetwork, chainId, isAuthenticated]);

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
    let filtered = allPolls;

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
  }, [allPolls, searchQuery, selectedCategory]);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!address) return;

    try {
      await voteOnPoll(pollId, optionIndex);
      // The polls will be automatically refreshed by the hook
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handlePollClick = (poll: Poll) => {
    setSelectedPoll(poll);
  };

  const handleBackToDashboard = () => {
    setSelectedPoll(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-secondary-900">
        {/* Background effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900" />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(240,185,11,0.1),transparent_50%)]" />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-2xl mx-auto px-6">
            <ScrollVelocity
              texts={['Poll Dashboard', 'Connect to Access']}
              velocity={50}
              className="text-gradient text-3xl"
              parallaxClassName="mb-6"
              scrollerClassName="text-gradient text-3xl"
            />
            <p className="text-xl text-secondary-300 mb-8 leading-relaxed">
              Connect your wallet and authenticate to access the full polling experience. 
              Create polls, vote on predictions, and participate in the community.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <WalletConnectAuth className="w-full sm:w-auto" />
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Create Polls</h3>
                <p className="text-secondary-300 text-sm">Start your own polls and gather community opinions</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Vote & Predict</h3>
                <p className="text-secondary-300 text-sm">Participate in polls and make predictions</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
                <p className="text-secondary-300 text-sm">Join the community and see trending polls</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show poll detail if a poll is selected
  if (selectedPoll) {
    return (
      <PollDetail
        poll={selectedPoll}
        onBack={handleBackToDashboard}
        onVote={handleVote}
      />
    );
  }

  if (isLoading || blockchainPollsLoading) {
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
            <div className="text-center mb-12">
              <ScrollVelocity
                texts={['Poll Dashboard', 'Vote & Decide']}
                velocity={50}
                className="text-gradient text-3xl"
                parallaxClassName="mb-6"
                scrollerClassName="text-gradient text-3xl"
              />
              <p className="text-lg text-secondary-300 max-w-2xl mx-auto leading-relaxed">
                Discover and participate in polls from around the world. Your voice matters in shaping opinions and decisions.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="max-w-6xl mx-auto mb-12">
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
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
                >
                  {filteredPolls.map((poll, index) => (
                    <PollCardSmall
                      key={poll.id}
                      poll={poll}
                      onClick={() => handlePollClick(poll)}
                      index={index}
                    />
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
        </section>
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
