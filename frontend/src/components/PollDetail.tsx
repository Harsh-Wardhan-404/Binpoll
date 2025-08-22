import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useAccount, useChainId } from 'wagmi';
import { useSimplePoll } from '../hooks/useSimplePoll';
import { apiClient } from '../lib/api';
import type { PollDetail as PollDetailType } from '../types';

interface PollDetailProps {
  pollId: string;
  onBack: () => void;
  onVote: (poll: PollDetailType, optionIndex: number) => Promise<void>;
}

const PollDetail: React.FC<PollDetailProps> = ({ pollId, onBack, onVote }) => {
  const [poll, setPoll] = useState<PollDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const chainId = useChainId();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showVoteConfirmation, setShowVoteConfirmation] = useState(false);
  const [pendingVote, setPendingVote] = useState<number | null>(null);
  const [pollEntryFee, setPollEntryFee] = useState<string>('0');
  const hasFetchedRef = useRef(false);

  // Get blockchain voting info if it's a blockchain poll
  const { 
    entryFee, 
    isVoting: isBlockchainVoting, 
    voteTxHash,
    getDynamicVotePrice
  } = useSimplePoll(chainId);

  // Fetch poll data
  useEffect(() => {
    const fetchPoll = async () => {
      // Prevent multiple fetches
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      
      try {
        setLoading(true);
        const response = await apiClient.getPoll(pollId);
        if (response.success) {
          setPoll(response.data);
          
          // If it's a blockchain poll, fetch the dynamic vote price from contract
          if (response.data.is_on_chain && response.data.blockchain_id) {
            try {
              const blockchainId = typeof response.data.blockchain_id === 'string' 
                ? parseInt(response.data.blockchain_id) 
                : Number(response.data.blockchain_id);
              
              if (!isNaN(blockchainId)) {
                const dynamicVotePrice = await getDynamicVotePrice(blockchainId);
                setPollEntryFee(dynamicVotePrice);
                console.log('Dynamic vote price for poll:', blockchainId, 'is:', dynamicVotePrice, 'BNB');
              }
            } catch (error) {
              console.error('Error fetching dynamic vote price:', error);
              // Fallback to default entry fee
              setPollEntryFee(entryFee);
            }
          }
        } else {
          setError('Failed to fetch poll data');
        }
      } catch (err) {
        console.error('Error fetching poll:', err);
        setError('Failed to load poll details');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();

    // Cleanup function to reset fetch flag when pollId changes
    return () => {
      hasFetchedRef.current = false;
    };
  }, [pollId]); // Only depend on pollId

  // Animation effect
  useEffect(() => {
    if (detailRef.current && poll) {
      gsap.fromTo(
        detailRef.current,
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
  }, [poll]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-300">Loading poll details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !poll) {
    return (
      <div className="min-h-screen bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Poll</h2>
          <p className="text-secondary-300 mb-4">{error || 'Poll not found'}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check if user has voted on this poll
  const userHasVoted = poll?.userVote !== null && poll?.userVote !== undefined;

  // Check if poll has ended
  const pollHasEnded = poll && poll.end_time && 
    new Date() > new Date(poll.end_time);

  const isSettled = poll?.settled || false;

  // Process options from API response
  const options = Array.isArray(poll.options)
    ? poll.options.map((option) => {
        const voteCount = option.votes?.length || 0;
        const percentage = poll.total_votes > 0 ? (voteCount / poll.total_votes) * 100 : 0;
        return {
          id: `${poll.id}-${option.optionIndex}`,
          text: option.optionText,
          votes: voteCount,
          percentage: percentage
        };
      })
    : [];

  const totalVotes = poll.total_votes || 0;

  const handleVoteClick = (optionIndex: number) => {
    if (!poll || !address || isVoting || isBlockchainVoting) {
      return;
    }
    
    // Check if user has already voted
    if (userHasVoted) {
      alert('You have already voted on this poll!');
      return;
    }
    
    if (poll.is_on_chain) {
      // Show confirmation modal for blockchain polls
      setPendingVote(optionIndex);
      setShowVoteConfirmation(true);
    } else {
      // Direct vote for API polls
      handleVote(optionIndex);
    }
  };
  
  const handleVote = async (optionIndex: number) => {
    if (!poll) {
      return;
    }
    
    setIsVoting(true);
    try {
      await onVote(poll, optionIndex);
      setSelectedOption(optionIndex);
      setShowVoteConfirmation(false);
      setPendingVote(null);
    } catch (error) {
      console.error('Failed to vote:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to vote: ${errorMessage}`);
    } finally {
      setIsVoting(false);
    }
  };
  
  const confirmVote = () => {
    if (pendingVote !== null) {
      handleVote(pendingVote);
    }
  };
  
  const cancelVote = () => {
    setShowVoteConfirmation(false);
    setPendingVote(null);
  };

  return (
    <div ref={detailRef} className="min-h-screen bg-secondary-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(240,185,11,0.1),transparent_50%)]" />
      
      <div className="relative z-10">
        {/* Header */}
        <section className="pt-20 pb-8">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-8">
              <motion.button
                onClick={onBack}
                className="flex items-center space-x-2 text-secondary-300 hover:text-primary-400 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Dashboard</span>
              </motion.button>
              
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium">
                  {poll.category}
                </span>
                              {poll.is_on_chain && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                  Blockchain
                </span>
              )}
              </div>
            </div>

            {/* Poll Header */}
            <div className="text-center mb-12">
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {poll.title}
              </motion.h1>
              <motion.p 
                className="text-xl text-secondary-300 max-w-3xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {poll.description}
              </motion.p>
            </div>

            {/* Poll Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-3xl font-bold text-primary-400 mb-2">{totalVotes}</div>
                <div className="text-secondary-300">Total Votes</div>
              </motion.div>
              
              <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-3xl font-bold text-primary-400 mb-2">{options.length}</div>
                <div className="text-secondary-300">Options</div>
              </motion.div>
              
              <motion.div
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-3xl font-bold text-primary-400 mb-2">
                  {poll.is_active ? 'Active' : 'Closed'}
                </div>
                <div className="text-secondary-300">Status</div>
              </motion.div>
            </div>

            {/* Reward System Info */}
            {poll.is_on_chain && poll.max_voters && (
              <motion.div
                className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-xl font-bold text-white mb-4 text-center">Reward System Details</h3>
                <div className="text-center mb-4">
                  <span className="inline-flex items-center px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Dynamic Pricing Active
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-purple-400">
                      {poll.current_voter_count || 0} / {poll.max_voters}
                    </div>
                    <div className="text-sm text-secondary-300">Votes Cast</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-400">
                      {poll.min_credibility_required || 10}
                    </div>
                    <div className="text-sm text-secondary-300">Required Credibility</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-green-400">
                      {poll.is_credibility_gated ? 'Yes' : 'No'}
                    </div>
                    <div className="text-sm text-secondary-300">Credibility Gated</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-yellow-400">
                      {poll.max_voters && poll.current_voter_count ? 
                        Math.round(((poll.current_voter_count / poll.max_voters) * 100)) : 0}%
                    </div>
                    <div className="text-sm text-secondary-300">Vote Progress</div>
                  </div>
                </div>
                {poll.max_voters && poll.current_voter_count && poll.current_voter_count >= poll.max_voters && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Poll has reached maximum voters! No more votes accepted.
                    </div>
                  </div>
                )}
                
                {/* Dynamic Pricing Explanation */}
                <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium mb-2">How Dynamic Pricing Works:</h4>
                  <div className="space-y-1 text-sm text-blue-300">
                    <div>• First vote: Base price ({pollEntryFee} BNB)</div>
                    <div>• Last vote: Up to 5x base price</div>
                    <div>• Price increases as more people vote</div>
                    <div>• Early voters get better rates!</div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Voting Options */}
        <section className="pb-20">
          <div className="container-custom">
            <div className="max-w-4xl mx-auto">
              <motion.h2 
                className="text-2xl font-bold text-white mb-4 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {userHasVoted ? 'Your Vote' : 'Cast Your Vote'}
              </motion.h2>
              
              {userHasVoted && (
                <motion.div
                  className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex items-center justify-center space-x-2 text-green-400 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">You have already voted on this poll</span>
                  </div>
                  <p className="text-green-300 text-sm">
                    Your vote has been recorded and cannot be changed.
                  </p>
                </motion.div>
              )}

              {/* Automatic Settlement Status */}
              {pollHasEnded && poll?.is_on_chain && (
                <motion.div
                  className={`rounded-xl p-6 mb-6 text-center ${
                    isSettled 
                      ? 'bg-blue-500/10 border border-blue-500/20' 
                      : 'bg-orange-500/10 border border-orange-500/20'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  {isSettled ? (
                    <>
                      <div className="flex items-center justify-center space-x-2 text-blue-400 mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xl font-bold">Poll Settled & Rewards Distributed! 🎉</span>
                      </div>
                      <p className="text-blue-300 mb-4">
                        This poll has been automatically settled. The most voted option won and rewards have been distributed to voters who chose correctly.
                      </p>
                                             {poll.winning_option !== null && poll.winning_option !== undefined && (
                         <div className="bg-blue-500/20 rounded-lg p-4">
                           <h4 className="text-blue-400 font-medium mb-2">Winning Option:</h4>
                           <p className="text-blue-300 font-bold">
                             {poll.options[poll.winning_option].optionText}
                           </p>
                         </div>
                       )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center space-x-2 text-orange-400 mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span className="text-xl font-bold">Poll Ended - Settlement in Progress</span>
                      </div>
                      <p className="text-orange-300 mb-4">
                        This poll has ended and is being automatically settled. The most voted option will win and rewards will be distributed shortly.
                      </p>
                      <div className="bg-orange-500/20 rounded-lg p-4">
                        <h4 className="text-orange-400 font-medium mb-2">What happens next:</h4>
                        <div className="space-y-1 text-sm text-orange-300">
                          <div>• The option with the most votes automatically wins</div>
                          <div>• 85% of the pool goes to winning voters</div>
                          <div>• 10% platform fee, 5% creator fee</div>
                          <div>• No manual action needed!</div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Poll Full Message */}
              {poll?.max_voters && poll?.current_voter_count && poll.current_voter_count >= poll.max_voters && (
                <motion.div
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-6 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="flex items-center justify-center space-x-2 text-red-400 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-xl font-bold">Poll is Full!</span>
                  </div>
                  <p className="text-red-300 mb-4">
                    This poll has reached its maximum voter limit of {poll.max_voters}. No more votes can be cast.
                  </p>
                  <div className="bg-red-500/20 rounded-lg p-4">
                    <h4 className="text-red-400 font-medium mb-2">Current Status:</h4>
                    <div className="space-y-1 text-sm text-red-300">
                      <div>• Total votes cast: {poll.current_voter_count}</div>
                      <div>• Maximum allowed: {poll.max_voters}</div>
                      <div>• Poll will be automatically settled when it ends</div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="space-y-4">
                {options.map((option, index) => (
                  <motion.div
                    key={option.id}
                    className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 ${
                      userHasVoted || isVoting || isBlockchainVoting || (poll?.max_voters && poll?.current_voter_count && poll.current_voter_count >= poll.max_voters)
                        ? 'opacity-60 cursor-not-allowed' 
                        : 'hover:bg-white/10 cursor-pointer'
                    } ${
                      poll?.userVote === index ? 'ring-2 ring-primary-500' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    onClick={() => {
                      if (!userHasVoted && !isVoting && !isBlockchainVoting && !(poll?.max_voters && poll?.current_voter_count && poll.current_voter_count >= poll.max_voters)) {
                        handleVoteClick(index);
                      }
                    }}
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white">{option.text}</h3>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {poll.is_on_chain && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                            {pollEntryFee} BNB (Dynamic)
                          </span>
                        )}
                        {(selectedOption === index || poll?.userVote === index) && (
                          <span className="text-primary-400 text-sm font-medium">
                            ✓ Your vote
                          </span>
                        )}
                        {userHasVoted && poll?.userVote !== index && (
                          <span className="text-secondary-500 text-sm">
                            Voting closed
                          </span>
                        )}
                        {(isVoting || isBlockchainVoting) && (
                          <span className="text-yellow-400 text-sm">
                            Processing...
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Blockchain Transaction Loading Overlay */}
              {poll.is_on_chain && (isVoting || isBlockchainVoting) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                >
                  <div className="bg-secondary-800 border border-white/10 rounded-2xl p-8 max-w-md mx-4 text-center">
                    {/* Spinning loader */}
                    <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-6"></div>
                    
                    <h3 className="text-xl font-bold text-white mb-4">
                      Processing Your Vote
                    </h3>
                    
                    <div className="space-y-3 text-secondary-300">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                        <span>Confirming transaction in MetaMask...</span>
                      </div>
                      
                      {voteTxHash && (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Transaction submitted to blockchain</span>
                        </div>
                      )}
                      
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
                        <div className="text-blue-400 text-sm">
                          <div className="flex items-center justify-center space-x-2 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            <span>Paying {pollEntryFee} BNB (Dynamic Price)</span>
                          </div>
                          <p className="text-xs text-blue-300">
                            Please wait while your transaction is processed on the blockchain...
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-secondary-400 mt-6">
                      ⚠️ Do not close this window or refresh the page
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Creator Info */}
              <motion.div
                className="mt-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
              >
                <h3 className="text-lg font-semibold text-white mb-4">Poll Creator</h3>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <span className="text-primary-400 font-semibold">
                      {poll.creator?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{poll.creator?.username || 'Unknown'}</div>
                    <div className="text-secondary-300 text-sm">
                      Created on {new Date(poll.created_at || '').toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
      

      
      {/* Vote Confirmation Modal */}
      <AnimatePresence>
        {showVoteConfirmation && pendingVote !== null && (
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
              <h3 className="text-xl font-bold text-white mb-4">Confirm Your Vote</h3>
              <div className="mb-6">
                <p className="text-secondary-300 mb-4">
                  You are about to vote for:
                </p>
                <div className="bg-white/5 rounded-lg p-3 mb-4">
                  <span className="text-white font-medium">
                    {options[pendingVote]?.text}
                  </span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="font-medium">Cost: {pollEntryFee} BNB (Dynamic)</span>
                  </div>
                  <p className="text-blue-300 text-sm mt-2">
                    This will deduct {pollEntryFee} BNB from your wallet
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={cancelVote}
                  disabled={isVoting || isBlockchainVoting}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-secondary-300 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmVote}
                  disabled={isVoting || isBlockchainVoting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-secondary-900 font-semibold rounded-lg hover:shadow-xl hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
                >
                  {(isVoting || isBlockchainVoting) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-secondary-900/20 border-t-secondary-900 rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Pay {pollEntryFee} BNB & Vote</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PollDetail;
