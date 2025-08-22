import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { useAccount } from 'wagmi';
import PollCard from './PollCard';
import { usePolls } from '../hooks/usePolls';
import type { Poll } from '../types';

interface PollDetailProps {
  poll: Poll | null;
  onBack: () => void;
  onVote: (pollId: string, optionIndex: number) => Promise<void>;
}

const PollDetail: React.FC<PollDetailProps> = ({ poll, onBack, onVote }) => {
  const detailRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

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

  const handleVote = async (optionIndex: number) => {
    if (!poll || !address || isVoting) return;

    setIsVoting(true);
    try {
      await onVote(poll.id, optionIndex);
      setSelectedOption(optionIndex);
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
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
                className="text-2xl font-bold text-white mb-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                Cast Your Vote
              </motion.h2>

              <div className="space-y-4">
                {options.map((option, index) => (
                  <motion.div
                    key={option.id}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    onClick={() => handleVote(index)}
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
                      <span className="text-sm text-secondary-300">
                        {option.percentage.toFixed(1)}% of total votes
                      </span>
                      {selectedOption === index && (
                        <span className="text-primary-400 text-sm font-medium">
                          ✓ Your vote
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

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
    </div>
  );
};

export default PollDetail;
