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
import Galaxy from './Galaxy';
import { usePolls } from '../hooks/usePolls';
import { useAuth } from '../hooks/useAuth';
import { useSimplePoll } from '../hooks/useSimplePoll';
import type { Poll } from '../types';
import type { PollDetail as PollDetailType } from '../types';

const Dashboard: React.FC = () => {
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [blockchainPollsLoading, setBlockchainPollsLoading] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [votedPollId, setVotedPollId] = useState<string | null>(null);
  const [votedOption, setVotedOption] = useState<string>('');
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    recents: false,
    hots: false,
    large_bets: false
  });

  // Wagmi hooks
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const isCorrectNetwork = chainId === bscTestnet.id || chainId === hardhat.id;

  // API hooks
  const { polls, dashboardPolls, loading: isLoading, fetchPolls, voteOnPoll, voteOnBlockchainPoll } = usePolls();

  // Blockchain hooks
  const { getAllPolls, voteOnPoll: blockchainVote, entryFee, voteTxHash } = useSimplePoll(chainId);

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
        
        // Only show blockchain polls that exist in our database
        // This ensures users can only vote on polls that are properly tracked
        const databaseBlockchainPolls = polls.filter(poll => poll.is_on_chain && poll.blockchain_id);
        
        console.log('💾 Database blockchain polls:', databaseBlockchainPolls);
        
                 // Convert database blockchain polls to match our Poll interface
         const formattedBlockchainPolls: Poll[] = databaseBlockchainPolls.map(poll => ({
           id: poll.id, // Use the actual UUID from database
           title: poll.title,
           description: poll.description,
           options: poll.options.map((option) => {
             const optionText = typeof option === 'string' ? option : 
               (option && typeof option === 'object' && 'optionText' in option ? String(option.optionText) : 
               (option && typeof option === 'object' && 'text' in option ? String(option.text) : ''));
             const voteCount = Array.isArray(option.votes) ? option.votes.length : 0;
             const percentage = (poll.total_votes || 0) > 0 ? (voteCount / (poll.total_votes || 0)) * 100 : 0;
             return {
               text: optionText,
               votes: voteCount,
               percentage: percentage
             };
           }),
           totalVotes: poll.total_votes || 0,
           endDate: poll.end_time,
           isActive: !!(poll.is_active && poll.end_time && new Date(poll.end_time) > new Date()),
           category: poll.category,
           creator: {
             name: poll.users?.username || 'Unknown',
             avatar: poll.users?.avatar_url || ''
           },
           isBlockchain: poll.is_on_chain,
           blockchainId: poll.blockchain_id,
           userVote: poll.userVote // Now includes user vote from backend
         }));
        
        // Combine API polls and formatted blockchain polls (avoiding duplicates)
        const apiOnlyPolls = polls.filter(poll => !poll.is_on_chain);
        setAllPolls([...apiOnlyPolls, ...formattedBlockchainPolls]);
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

  // Only load blockchain polls when wallet/network changes, not on every polls change
  useEffect(() => {
    if (isAuthenticated && isConnected && isCorrectNetwork) {
      loadBlockchainPolls();
    } else if (isAuthenticated) {
      setAllPolls(polls); // fallback to API polls only
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isCorrectNetwork, chainId, isAuthenticated]);
  // Remove 'polls' from dependency array to avoid repeated calls

  // Watch for successful blockchain votes
  useEffect(() => {
    if (voteTxHash && votedPollId) {
      // Save the blockchain vote to database
      const saveVoteToDatabase = async () => {
        try {
          const poll = allPolls.find(p => p.id === votedPollId);
          if (poll?.is_on_chain) {
            const optionIndex = parseInt(votedOption);
            
            console.log('💾 Saving blockchain vote to database');
            console.log('🎯 Poll ID:', votedPollId);
            console.log('🎯 Transaction Hash:', voteTxHash);
            
            // The backend will handle finding the correct poll by blockchain ID
            const voteResult = await voteOnBlockchainPoll(votedPollId, optionIndex, voteTxHash, entryFee);
            
            if (voteResult) {
              // Refresh poll data to show updated vote counts and user vote status
              await fetchPolls();
              await loadBlockchainPolls();
              
              setShowSuccessModal(true);
              console.log('✅ Vote successfully recorded on blockchain and database');
            }
          }
        } catch (error) {
          console.error('❌ Error saving vote to database:', error);
          // Still show success modal since blockchain vote succeeded
          setShowSuccessModal(true);
        } finally {
          // Clear voting state after a delay to allow modal to show
          setTimeout(() => {
            setVotedPollId(null);
            setVotedOption('');
          }, 1000);
        }
      };
      
      saveVoteToDatabase();
    }
  }, [voteTxHash, votedPollId, votedOption, allPolls, voteOnBlockchainPoll, entryFee]);

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

  const handleVote = async (poll: PollDetailType, optionIndex: number) => {
    if (!address) return;

    // Find the poll to determine if it's a blockchain poll
   
    
    try {
      if (poll?.is_on_chain) {
        // For blockchain polls, we need to call the smart contract
        console.log('🔗 Blockchain poll detected - calling smart contract vote');
        console.log('💰 Entry fee required:', entryFee, 'BNB');
        
        // Use the blockchain ID from the poll data
        const blockchainId = poll.blockchain_id;
        const blockchainIdNum = typeof blockchainId === 'string' ? parseInt(blockchainId) : Number(blockchainId);
        
        // Store voting intention for success tracking
        setVotedPollId(poll.id);
        setVotedOption(optionIndex.toString());
        
        // Call the blockchain voting function
        blockchainVote(blockchainIdNum, optionIndex);
        
        alert(`Please confirm the transaction in your wallet to submit your vote with ${entryFee} BNB!`);
        // await voteOnPoll(poll.id, optionIndex);


      } else {
        // For API polls, use the regular voting flow
        await voteOnPoll(poll.id, optionIndex);
        setShowSuccessModal(true);
        setVotedPollId(poll.id);
        const option = poll?.options[optionIndex];
        const optionText = typeof option === 'string' ? option : 
          (option && typeof option === 'object' && 'optionText' in option ? String(option.optionText) : 
          (option && typeof option === 'object' && 'text' in option ? String(option.text) : `Option ${optionIndex + 1}`));
        setVotedOption(optionText);
      }
      
      // The polls will be automatically refreshed by the hook
    } catch (error) {
      console.error('Failed to vote:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to vote: ${errorMessage}`);
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

  const toggleSection = (section: 'recents' | 'hots' | 'large_bets') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Refresh dashboard data when modal is closed (indicating a poll was created)
  const handleCreateModalClose = async () => {
    setShowCreateModal(false);
    // Refresh polls data to show the newly created poll
    if (isAuthenticated) {
      console.log('🔄 Refreshing dashboard data after poll creation...');
      setIsRefreshing(true);
      try {
        await fetchPolls();
        await loadBlockchainPolls();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Listen for successful poll creation and refresh data
  useEffect(() => {
    const handlePollCreated = async () => {
      if (isAuthenticated) {
        console.log('🔄 Poll created - refreshing dashboard data...');
        setIsRefreshing(true);
        try {
          await fetchPolls();
          await loadBlockchainPolls();
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    // Listen for custom event when poll is created
    window.addEventListener('poll-created', handlePollCreated);
    
    return () => {
      window.removeEventListener('poll-created', handlePollCreated);
    };
  }, [isAuthenticated, fetchPolls, loadBlockchainPolls]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-secondary-900">
        {/* Galaxy Background */}
        {/* <div className="fixed inset-0 z-0">
          <Galaxy 
            mouseRepulsion={false}
            mouseInteraction={false}
            density={0.05}
            glowIntensity={0.4}
            saturation={0.8}
            hueShift={105}
            twinkleIntensity={0.4}
            rotationSpeed={0.05}
            transparent={true}
          />
        </div> */}
        
        {/* Background overlay for better text readability */}
        <div className="fixed inset-0 bg-gradient-to-br from-secondary-900/80 via-secondary-800/60 to-secondary-900/80 z-0" />
        
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
        pollId={selectedPoll.id}
        onBack={handleBackToDashboard}
        onVote={handleVote}
      />
    );
  }

  if (isLoading || blockchainPollsLoading || isRefreshing) {
    return (
      <div className="min-h-screen bg-secondary-900">
        {/* Galaxy Background */}
        {/* <div className="fixed inset-0 z-0">
          <Galaxy 
            mouseRepulsion={true}
            mouseInteraction={true}
            density={0.6}
            glowIntensity={0.5}
            saturation={0.8}
            hueShift={45}
            twinkleIntensity={0.4}
            rotationSpeed={0.05}
            transparent={true}
          />
        </div> */}
        
        {/* Background overlay for better text readability */}
        <div className="fixed inset-0 bg-gradient-to-br from-secondary-900/80 via-secondary-800/60 to-secondary-900/80 z-0" />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-secondary-300 text-lg">
              {isRefreshing ? 'Refreshing polls...' : 'Loading polls...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="min-h-screen bg-secondary-900">
      {/* Galaxy Background */}
      <div className="fixed inset-0 z-0">
        <Galaxy 

        />
      </div>
      
      {/* Background overlay for better text readability */}
      <div className="fixed inset-0 bg-gradient-to-br from-secondary-900/80 via-secondary-800/60 to-secondary-900/80 z-0" />
      
      <div className="relative z-10">
        {/* Header Section */}
        <section className="pt-20 pb-16">
          <div className="container-custom">
            <div className="text-center mb-12">
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
            {/* Show filtered results when searching or filtering */}
            {(searchQuery || selectedCategory !== 'All') ? (
              <>
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
              </>
            ) : (
              /* Show dashboard sections when no filters applied */
              <div className="space-y-16">
                {/* Recent Polls Section */}
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Recent Polls</h2>
                    <p className="text-secondary-400">Latest polls from the community</p>
                  </div>
                  <AnimatePresence mode="wait">
                    {dashboardPolls.recents.length > 0 ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
                        >
                          {dashboardPolls.recents.slice(0, 3).map((poll, index) => (
                            <PollCardSmall
                              key={poll.id}
                              poll={poll}
                              onClick={() => handlePollClick(poll)}
                              index={index}
                            />
                          ))}
                        </motion.div>
                        
                        {/* Show more/less button if there are more than 3 polls */}
                        {dashboardPolls.recents.length > 3 && (
                          <div className="text-center mt-8">
                            <motion.button
                              onClick={() => toggleSection('recents')}
                              className="px-6 py-3 bg-white/5 text-secondary-300 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 flex items-center space-x-2 mx-auto"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span>{expandedSections.recents ? 'Show Less' : `Show ${dashboardPolls.recents.length - 3} More`}</span>
                              <svg 
                                className={`w-5 h-5 transition-transform duration-300 ${expandedSections.recents ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </motion.button>
                          </div>
                        )}
                        
                        {/* Expanded polls */}
                        <AnimatePresence>
                          {expandedSections.recents && dashboardPolls.recents.length > 3 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mt-6"
                            >
                              {dashboardPolls.recents.slice(3).map((poll, index) => (
                                <PollCardSmall
                                  key={poll.id}
                                  poll={poll}
                                  onClick={() => handlePollClick(poll)}
                                  index={index + 3}
                                />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                      >
                        <p className="text-secondary-400">No recent polls available</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hot Polls Section */}
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">🔥 Hot Polls</h2>
                    <p className="text-secondary-400">Most voted polls trending now</p>
                  </div>
                  <AnimatePresence mode="wait">
                    {dashboardPolls.hots.length > 0 ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
                        >
                          {dashboardPolls.hots.slice(0, 3).map((poll, index) => (
                            <PollCardSmall
                              key={poll.id}
                              poll={poll}
                              onClick={() => handlePollClick(poll)}
                              index={index}
                            />
                          ))}
                        </motion.div>
                        
                        {/* Show more/less button if there are more than 3 polls */}
                        {dashboardPolls.hots.length > 3 && (
                          <div className="text-center mt-8">
                            <motion.button
                              onClick={() => toggleSection('hots')}
                              className="px-6 py-3 bg-white/5 text-secondary-300 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 flex items-center space-x-2 mx-auto"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span>{expandedSections.hots ? 'Show Less' : `Show ${dashboardPolls.hots.length - 3} More`}</span>
                              <svg 
                                className={`w-5 h-5 transition-transform duration-300 ${expandedSections.hots ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </motion.button>
                          </div>
                        )}
                        
                        {/* Expanded polls */}
                        <AnimatePresence>
                          {expandedSections.hots && dashboardPolls.hots.length > 3 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mt-6"
                            >
                              {dashboardPolls.hots.slice(3).map((poll, index) => (
                                <PollCardSmall
                                  key={poll.id}
                                  poll={poll}
                                  onClick={() => handlePollClick(poll)}
                                  index={index + 3}
                                />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                      >
                        <p className="text-secondary-400">No hot polls available</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Large Bets Section */}
                <div>
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">💰 Large Bets</h2>
                    <p className="text-secondary-400">High-stakes polls with big rewards</p>
                  </div>
                  <AnimatePresence mode="wait">
                    {dashboardPolls.large_bets.length > 0 ? (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto"
                        >
                          {dashboardPolls.large_bets.slice(0, 3).map((poll, index) => (
                            <PollCardSmall
                              key={poll.id}
                              poll={poll}
                              onClick={() => handlePollClick(poll)}
                              index={index}
                            />
                          ))}
                        </motion.div>
                        
                        {/* Show more/less button if there are more than 3 polls */}
                        {dashboardPolls.large_bets.length > 3 && (
                          <div className="text-center mt-8">
                            <motion.button
                              onClick={() => toggleSection('large_bets')}
                              className="px-6 py-3 bg-white/5 text-secondary-300 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-300 flex items-center space-x-2 mx-auto"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span>{expandedSections.large_bets ? 'Show Less' : `Show ${dashboardPolls.large_bets.length - 3} More`}</span>
                              <svg 
                                className={`w-5 h-5 transition-transform duration-300 ${expandedSections.large_bets ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </motion.button>
                          </div>
                        )}
                        
                        {/* Expanded polls */}
                        <AnimatePresence>
                          {expandedSections.large_bets && dashboardPolls.large_bets.length > 3 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mt-6"
                            >
                              {dashboardPolls.large_bets.slice(3).map((poll, index) => (
                                <PollCardSmall
                                  key={poll.id}
                                  poll={poll}
                                  onClick={() => handlePollClick(poll)}
                                  index={index + 3}
                                />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12"
                      >
                        <p className="text-secondary-400">No large bet polls available</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={showCreateModal}
        onClose={handleCreateModalClose}
      />
      
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-secondary-800 border border-white/10 rounded-2xl p-6 max-w-md mx-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Vote Submitted!</h3>
                <p className="text-secondary-300 mb-4">
                  Your vote has been successfully recorded on the blockchain and database!
                </p>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4">
                  <p className="text-green-400 text-sm">
                    ✓ Blockchain transaction confirmed
                  </p>
                  <p className="text-green-400 text-sm">
                    ✓ Vote saved to database
                  </p>
                  <p className="text-green-400 text-sm">
                    ✓ BNB payment processed
                  </p>
                </div>
                <p className="text-secondary-400 text-sm mb-6">
                  You cannot vote again on this poll.
                </p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Force refresh to show updated poll state
                    window.location.reload();
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-secondary-900 font-semibold rounded-lg hover:shadow-xl hover:shadow-primary-500/25 transition-all"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
