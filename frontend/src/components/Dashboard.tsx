import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import ProfileCard from './ProfileCard';
import PollCard from './PollCard';
import SearchBar from './SearchBar';
import ScrollVelocity from './ScrollVelocity';

// Dummy data for polls
const dummyPolls = [
  {
    id: '1',
    title: 'Best Programming Language 2024',
    description: 'Which programming language do you think will dominate the industry in 2024?',
    options: [
      { id: '1a', text: 'Python', votes: 1250, percentage: 45.2 },
      { id: '1b', text: 'JavaScript', votes: 980, percentage: 35.4 },
      { id: '1c', text: 'Rust', votes: 320, percentage: 11.6 },
      { id: '1d', text: 'Go', votes: 220, percentage: 7.8 }
    ],
    totalVotes: 2770,
    endDate: '2024-12-31T23:59:59Z',
    isActive: true,
    category: 'Technology',
    creator: {
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    }
  },
  {
    id: '2',
    title: 'Favorite Movie Genre',
    description: 'What type of movies do you enjoy watching the most?',
    options: [
      { id: '2a', text: 'Action/Adventure', votes: 890, percentage: 38.5 },
      { id: '2b', text: 'Comedy', votes: 650, percentage: 28.1 },
      { id: '2c', text: 'Drama', votes: 420, percentage: 18.2 },
      { id: '2d', text: 'Sci-Fi', votes: 350, percentage: 15.2 }
    ],
    totalVotes: 2310,
    endDate: '2024-11-15T23:59:59Z',
    isActive: true,
    category: 'Entertainment',
    creator: {
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    }
  },
  {
    id: '3',
    title: 'Most Important Global Issue',
    description: 'Which global issue should be humanity\'s top priority?',
    options: [
      { id: '3a', text: 'Climate Change', votes: 2100, percentage: 52.5 },
      { id: '3b', text: 'Poverty', votes: 680, percentage: 17.0 },
      { id: '3c', text: 'Healthcare', votes: 520, percentage: 13.0 },
      { id: '3d', text: 'Education', votes: 700, percentage: 17.5 }
    ],
    totalVotes: 4000,
    endDate: '2024-10-20T23:59:59Z',
    isActive: false,
    category: 'Politics',
    creator: {
      name: 'Michael Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    }
  },
  {
    id: '4',
    title: 'Best Sports Team',
    description: 'Which sports team do you think will win the championship this year?',
    options: [
      { id: '4a', text: 'Lakers', votes: 750, percentage: 30.0 },
      { id: '4b', text: 'Warriors', votes: 680, percentage: 27.2 },
      { id: '4c', text: 'Celtics', votes: 520, percentage: 20.8 },
      { id: '4d', text: 'Heat', votes: 550, percentage: 22.0 }
    ],
    totalVotes: 2500,
    endDate: '2024-12-15T23:59:59Z',
    isActive: true,
    category: 'Sports',
    creator: {
      name: 'David Wilson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    }
  },
  {
    id: '5',
    title: 'Future of AI',
    description: 'How do you think AI will impact society in the next decade?',
    options: [
      { id: '5a', text: 'Mostly Positive', votes: 1200, percentage: 40.0 },
      { id: '5b', text: 'Mixed Impact', votes: 900, percentage: 30.0 },
      { id: '5c', text: 'Mostly Negative', votes: 600, percentage: 20.0 },
      { id: '5d', text: 'Uncertain', votes: 300, percentage: 10.0 }
    ],
    totalVotes: 3000,
    endDate: '2024-11-30T23:59:59Z',
    isActive: true,
    category: 'Technology',
    creator: {
      name: 'Emma Thompson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    }
  },
  {
    id: '6',
    title: 'Coffee vs Tea',
    description: 'Which hot beverage do you prefer for your daily caffeine fix?',
    options: [
      { id: '6a', text: 'Coffee', votes: 1800, percentage: 60.0 },
      { id: '6b', text: 'Tea', votes: 900, percentage: 30.0 },
      { id: '6c', text: 'Neither', votes: 300, percentage: 10.0 }
    ],
    totalVotes: 3000,
    endDate: '2024-09-15T23:59:59Z',
    isActive: false,
    category: 'Lifestyle',
    creator: {
      name: 'Lisa Park',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
    }
  }
];

const Dashboard: React.FC = () => {
  const [polls, setPolls] = useState(dummyPolls);
  const [filteredPolls, setFilteredPolls] = useState(dummyPolls);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const categories = ['All', 'Technology', 'Politics', 'Sports', 'Entertainment', 'Science', 'Lifestyle'];

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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

  const handleVote = (pollId: string, optionId: string) => {
    setPolls(prevPolls => 
      prevPolls.map(poll => {
        if (poll.id === pollId) {
          const updatedOptions = poll.options.map(option => {
            if (option.id === optionId) {
              return { ...option, votes: option.votes + 1 };
            }
            return option;
          });

          const totalVotes = updatedOptions.reduce((sum, option) => sum + option.votes, 0);
          const updatedOptionsWithPercentage = updatedOptions.map(option => ({
            ...option,
            percentage: (option.votes / totalVotes) * 100
          }));

          return {
            ...poll,
            options: updatedOptionsWithPercentage,
            totalVotes
          };
        }
        return poll;
      })
    );
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
                  className="ml-4 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-secondary-900 font-semibold rounded-full transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/25 hover:scale-105 active:scale-95 flex items-center space-x-2"
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
                    avatarUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face"
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
                            {...poll}
                            onVote={handleVote}
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
      </div>
    </div>
  );
};

export default Dashboard;
