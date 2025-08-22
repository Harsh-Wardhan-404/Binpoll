import React from 'react';
import { motion } from 'motion/react';
import type { Poll } from '../types';

interface PollCardSmallProps {
  poll: Poll;
  onClick: () => void;
  index: number;
}

const PollCardSmall: React.FC<PollCardSmallProps> = ({ poll, onClick, index }) => {
  const totalVotes = poll.totalVotes || 0;
  const options = (poll.isBlockchain || poll.is_on_chain)
    ? poll.options.map((option, index) => ({
        text: typeof option === 'string' ? option : option.text,
        votes: poll.optionVotes?.[index] || 0,
        percentage: totalVotes > 0 ? ((poll.optionVotes?.[index] || 0) / totalVotes) * 100 : 0
      }))
    : poll.options.map((option, index) => ({
        text: typeof option === 'string' ? option : option.text,
        votes: poll.optionVotes?.[index] || 0,
        percentage: totalVotes > 0 ? ((poll.optionVotes?.[index] || 0) / totalVotes) * 100 : 0
      }));

  return (
    <motion.div
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(240, 185, 11, 0.1)"
      }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors duration-300">
            {poll.title}
          </h3>
          <p className="text-secondary-300 text-sm line-clamp-2">
            {poll.description}
          </p>
        </div>
        
        {/* Category Badge */}
        <div className="flex flex-col items-end space-y-2">
          <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs font-medium">
            {poll.category}
          </span>
          {(poll.isBlockchain || poll.is_on_chain) && (
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
              Blockchain
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-primary-400">{totalVotes}</div>
          <div className="text-xs text-secondary-300">Votes</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-primary-400">{options.length}</div>
          <div className="text-xs text-secondary-300">Options</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-primary-400">
            {(poll.isActive || poll.is_active) ? 'Active' : 'Closed'}
          </div>
          <div className="text-xs text-secondary-300">Status</div>
        </div>
      </div>

      {/* Credibility Requirements */}
      {(poll.min_credibility_required && poll.min_credibility_required > 0) && (
        <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-yellow-400">Min Credibility</span>
            <span className="text-lg font-bold text-yellow-400">
              {poll.min_credibility_required}
            </span>
          </div>
        </div>
      )}

      {/* Pool Amount for Blockchain Polls */}
      {poll.is_on_chain && poll.total_pool && (
        <div className="mb-4 p-3 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-xl border border-primary-500/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-400">Total Pool</span>
            <span className="text-lg font-bold text-primary-400">
              {poll.total_pool} BNB
            </span>
          </div>
        </div>
      )}

      {/* Credibility & Knowledge Section */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-white">Knowledge Required</span>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-yellow-400 font-medium">Expert</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary-300">Voter Credibility</span>
            <span className="text-xs text-primary-400 font-medium">
              {poll.min_credibility_required || 0}+ Required
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-secondary-300">Voting Weight</span>
            <span className="text-xs text-primary-400 font-medium">
              {poll.voting_weight_multiplier || 1}x Multiplier
            </span>
          </div>
          {poll.is_credibility_gated && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-secondary-300">Credibility Gated</span>
              <span className="text-xs text-green-400 font-medium">✓ Enabled</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center">
            <span className="text-primary-400 text-xs font-semibold">
              {poll.users?.username?.charAt(0) || poll.creator?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-secondary-300">
              {poll.users?.username || poll.creator?.name || 'Unknown'}
            </span>
            {poll.users?.credibility_score && (
              <span className="text-xs text-yellow-400 font-medium">
                Credibility: {poll.users.credibility_score}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-secondary-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs">
            {new Date(poll.endDate || poll.end_time || '').toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default PollCardSmall;
