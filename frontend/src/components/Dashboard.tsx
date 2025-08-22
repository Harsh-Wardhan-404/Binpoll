import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import PollCardSmall from './PollCardSmall';
import SearchBar from './SearchBar';
import CreatePollModal from './CreatePollModal';
import Galaxy from './Galaxy';
import { usePolls } from '../hooks/usePolls';
import { useAuth } from '../hooks/useAuth';

import type { Poll } from '../types';

const Dashboard: React.FC = () => {
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allPolls, setAllPolls] = useState<Poll[]>([]);
  const [blockchainPollsLoading, setBlockchainPollsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    recents: false,
    hots: false,
    large_bets: false
  });

  // Hooks
  const { isAuthenticated } = useAuth();
  const { 
    polls, 
    dashboardPolls,
    loading: isLoading, 
    fetchPolls
  } = usePolls();

  // Categories for filtering
  const categories = ['All', 'Blockchain', 'Technology', 'Politics', 'Sports', 'Entertainment', 'Finance', 'Other'];

  // Load blockchain polls
  const loadBlockchainPolls = async () => {
    if (!isAuthenticated) return;
    
    setBlockchainPollsLoading(true);
    try {
      // This would be your blockchain polls loading logic
      console.log('Loading blockchain polls...');
    } catch (error) {
      console.error('Error loading blockchain polls:', error);
    } finally {
      setBlockchainPollsLoading(false);
    }
  };

  // Initialize data - Call API when dashboard loads
  useEffect(() => {
    console.log('🔄 Dashboard: Initializing data...');
    console.log('🔄 Dashboard: isAuthenticated =', isAuthenticated);
    
    if (isAuthenticated) {
      console.log('🔄 Dashboard: Fetching polls...');
      fetchPolls();
      loadBlockchainPolls();
    } else {
      console.log('🔄 Dashboard: Not authenticated, skipping poll fetch');
    }
  }, [isAuthenticated, fetchPolls]);

  // Update allPolls when polls data changes
  useEffect(() => {
    console.log('🔄 Dashboard: polls data updated, length:', polls?.length || 0);
    if (polls && polls.length > 0) {
      setAllPolls(polls);
      console.log('✅ Dashboard: Updated allPolls with', polls.length, 'polls');
    }
  }, [polls]);

  // Update filtered polls when data changes
  useEffect(() => {
    console.log('🔄 Dashboard: Updating filtered polls...');
    console.log('🔄 Dashboard: allPolls length:', allPolls.length);
    console.log('🔄 Dashboard: searchQuery:', searchQuery);
    console.log('🔄 Dashboard: selectedCategory:', selectedCategory);
    
    let filtered = [...allPolls];
    
    if (searchQuery) {
      filtered = filtered.filter(poll => 
        poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        poll.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(poll => poll.category === selectedCategory);
    }

    setFilteredPolls(filtered);
    console.log('✅ Dashboard: Filtered polls length:', filtered.length);
  }, [allPolls, searchQuery, selectedCategory]);

  const handlePollClick = (poll: Poll) => {
    navigate(`/polldetails/${poll.id}`);
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
    window.addEventListener('pollCreated', handlePollCreated);
    return () => window.removeEventListener('pollCreated', handlePollCreated);
  }, [isAuthenticated, fetchPolls]);

  // Helper function to render poll section
  const renderPollSection = (
    title: string, 
    polls: Poll[], 
    sectionKey: 'recents' | 'hots' | 'large_bets',
    icon: string
  ) => {
    if (polls.length === 0) return null;

    const displayPolls = expandedSections[sectionKey] ? polls : polls.slice(0, 3);
    const hasMore = polls.length > 3;

    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">{icon}</span>
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <span className="text-secondary-400 text-sm">({polls.length} polls)</span>
          </div>
          {hasMore && (
            <motion.button
              onClick={() => toggleSection(sectionKey)}
              className="px-4 py-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {expandedSections[sectionKey] ? 'Show Less' : 'Show More'}
            </motion.button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPolls.map((poll, index) => (
            <PollCardSmall
              key={poll.id}
              poll={poll}
              onClick={() => handlePollClick(poll)}
              index={index}
            />
          ))}
        </div>
        
        {hasMore && !expandedSections[sectionKey] && (
          <div className="text-center mt-6">
            <motion.button
              onClick={() => toggleSection(sectionKey)}
              className="px-6 py-3 bg-white/5 text-secondary-300 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View All {polls.length} Polls
            </motion.button>
          </div>
        )}
      </section>
    );
  };

  // Show loading state
  if (isLoading || blockchainPollsLoading || isRefreshing) {
    return (
      <div className="min-h-screen bg-secondary-900">
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

  // Check if we have dashboard data structure
  const hasDashboardData = dashboardPolls.recents.length > 0 || 
                          dashboardPolls.hots.length > 0 || 
                          dashboardPolls.large_bets.length > 0;

  console.log('🔄 Dashboard: Rendering with data:');
  console.log('🔄 Dashboard: hasDashboardData =', hasDashboardData);
  console.log('🔄 Dashboard: dashboardPolls.recents.length =', dashboardPolls.recents.length);
  console.log('🔄 Dashboard: dashboardPolls.hots.length =', dashboardPolls.hots.length);
  console.log('🔄 Dashboard: dashboardPolls.large_bets.length =', dashboardPolls.large_bets.length);
  console.log('🔄 Dashboard: filteredPolls.length =', filteredPolls.length);
  console.log('🔄 Dashboard: allPolls.length =', allPolls.length);

  return (
    <div ref={dashboardRef} className="min-h-screen bg-secondary-900">
      {/* Galaxy Background */}
      <div className="fixed inset-0 z-0">
        <Galaxy />
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
                
                {/* Create Poll Button */}
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  className="ml-4 px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-secondary-900 font-semibold rounded-full shadow-lg shadow-primary-500/25 hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create Poll
                </motion.button>
              </div>
            </div>

            {/* Polls Grid - Show dashboard sections if available, otherwise show filtered polls */}
            <div className="max-w-7xl mx-auto">
              {hasDashboardData ? (
                // Dashboard sections layout
                <div>
                  {renderPollSection('Recent Polls', dashboardPolls.recents, 'recents', '🕒')}
                  {renderPollSection('Hot Polls', dashboardPolls.hots, 'hots', '🔥')}
                  {renderPollSection('Large Bets', dashboardPolls.large_bets, 'large_bets', '💰')}
                </div>
              ) : (
                // Fallback to filtered polls layout
                <>
                  {filteredPolls.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPolls.map((poll, index) => (
                        <PollCardSmall
                          key={poll.id}
                          poll={poll}
                          onClick={() => handlePollClick(poll)}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No polls found</h3>
                      <p className="text-secondary-400 mb-6">
                        {searchQuery || selectedCategory !== 'All' 
                          ? 'Try adjusting your search or filters'
                          : 'Be the first to create a poll!'
                        }
                      </p>
                      {!searchQuery && selectedCategory === 'All' && (
                        <motion.button
                          onClick={() => setShowCreateModal(true)}
                          className="px-8 py-3 bg-primary-500 text-secondary-900 font-semibold rounded-lg hover:bg-primary-600 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Create Your First Poll
                        </motion.button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Create Poll Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePollModal
            isOpen={showCreateModal}
            onClose={handleCreateModalClose}
          />
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-secondary-800 rounded-2xl p-8 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Vote Submitted!</h3>
              <p className="text-secondary-300 mb-6">
                Your vote has been successfully recorded.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-3 bg-primary-500 text-secondary-900 font-semibold rounded-lg hover:bg-primary-600 transition-colors"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
