import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useAccount, useChainId } from 'wagmi';
import { useSimplePoll } from '../hooks/useSimplePoll';
import type { Poll } from '../types';

interface PollDetailProps {
  poll: Poll | null;
  onBack: () => void;
  onVote: (pollId: string, optionIndex: number) => Promise<void>;
}

const PollDetail: React.FC<PollDetailProps> = ({ poll, onBack, onVote }) => {
  const detailRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const chainId = useChainId();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showVoteConfirmation, setShowVoteConfirmation] = useState(false);
  const [pendingVote, setPendingVote] = useState<number | null>(null);
  
  // Get blockchain voting info if it's a blockchain poll
  const { entryFee, isVoting: isBlockchainVoting, voteTxHash } = useSimplePoll(chainId);
  
  // Check if user has voted on this poll
  const userHasVoted = poll?.userVote !== null && poll?.userVote !== undefined;
  
  console.log('🗿 User vote status for poll:', poll?.id);
  console.log('🗿 Poll userVote field:', poll?.userVote);
  console.log('🗿 User has voted:', userHasVoted);

  useEffect(() => {
    if (detailRef.current) {
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

  const handleVoteClick = (optionIndex: number) => {
    if (!poll || !address || isVoting || isBlockchainVoting) return;
    
    // Check if user has already voted
    if (userHasVoted) {
      alert('You have already voted on this poll!');
      return;
    }
    
    if (poll.isBlockchain) {
      // Show confirmation modal for blockchain polls
      setPendingVote(optionIndex);
      setShowVoteConfirmation(true);
    } else {
      // Direct vote for API polls
      handleVote(optionIndex);
    }
  };
  
  const handleVote = async (optionIndex: number) => {
    if (!poll) return;
    
    setIsVoting(true);
    try {
      await onVote(poll.id, optionIndex);
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

  if (!poll) {
    return null;
  }

  const totalVotes = poll.totalVotes || 0;
  const options = poll.isBlockchain 
    ? poll.options.map((option, index) => ({
        id: `${poll.id}-${index}`,
        text: option.text,
        votes: option.votes,
        percentage: option.percentage
      }))
    : poll.options.map((option, index) => ({
        id: `${poll.id}-${index}`,
        text: typeof option === 'string' ? option : option.text,
        votes: poll.optionVotes?.[index] || 0,
        percentage: totalVotes > 0 ? ((poll.optionVotes?.[index] || 0) / totalVotes) * 100 : 0
      }));

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
                {poll.isBlockchain && (
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
                  {poll.isActive ? 'Active' : 'Closed'}
                </div>
                <div className="text-secondary-300">Status</div>
              </motion.div>
            </div>
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

              <div className="space-y-4">
                {options.map((option, index) => (
                  <motion.div
                    key={option.id}
                    className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 ${
                      userHasVoted || isVoting || isBlockchainVoting
                        ? 'opacity-60 cursor-not-allowed' 
                        : 'hover:bg-white/10 cursor-pointer'
                    } ${
                      poll?.userVote === index ? 'ring-2 ring-primary-500' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    onClick={() => !userHasVoted && !isVoting && !isBlockchainVoting && handleVoteClick(index)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{option.text}</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-400">{option.votes}</div>
                        <div className="text-sm text-secondary-300">votes</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-3 mb-4">
                      <motion.div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${option.percentage}%` }}
                        transition={{ delay: 1 + index * 0.1, duration: 1 }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm text-secondary-300">
                          {option.percentage.toFixed(1)}% of total votes
                        </span>
                        <div className="flex items-center space-x-2">
                          {poll.isBlockchain && (
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                              {entryFee} BNB
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
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Blockchain Transaction Loading Overlay */}
              {poll.isBlockchain && (isVoting || isBlockchainVoting) && (
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
                            <span>Paying {entryFee} BNB</span>
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
                      {poll.creator?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{poll.creator?.name || 'Unknown'}</div>
                    <div className="text-secondary-300 text-sm">
                      Created on {new Date(poll.endDate || poll.end_time || '').toLocaleDateString()}
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
                    <span className="font-medium">Cost: {entryFee} BNB</span>
                  </div>
                  <p className="text-blue-300 text-sm mt-2">
                    This will deduct {entryFee} BNB from your wallet
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
                    <span>Pay {entryFee} BNB & Vote</span>
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
