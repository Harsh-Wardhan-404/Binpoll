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
  const options = poll.isBlockchain 
    ? poll.options.map((option, index) => ({
        text: option.text,
        votes: option.votes,
        percentage: option.percentage
      }))
    : poll.options.map((option, index) => ({
        text: typeof option === 'string' ? option : option.text,
        votes: poll.optionVotes?.[index] || 0,
        percentage: totalVotes > 0 ? ((poll.optionVotes?.[index] || 0) / totalVotes) * 100 : 0
      }));

  // Get the top option
  const topOption = options.reduce((prev, current) => 
    (current.votes > prev.votes) ? current : prev
  );

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
          {poll.isBlockchain && (
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
            {poll.isActive ? 'Active' : 'Closed'}
          </div>
          <div className="text-xs text-secondary-300">Status</div>
        </div>
      </div>

      {/* Top Option Preview */}
      <div className="bg-white/5 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Leading Option</span>
          <span className="text-sm text-primary-400 font-bold">
            {topOption.percentage.toFixed(1)}%
          </span>
        </div>
        <p className="text-sm text-secondary-300 line-clamp-1 mb-2">
          {topOption.text}
        </p>
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${topOption.percentage}%` }}
            transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-primary-500/20 rounded-full flex items-center justify-center">
            <span className="text-primary-400 text-xs font-semibold">
              {poll.creator?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <span className="text-xs text-secondary-300">
            {poll.creator?.name || 'Unknown'}
          </span>
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
