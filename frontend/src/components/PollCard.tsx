import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { gsap } from 'gsap';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface PollCardProps {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  totalVotes: number;
  endDate: string;
  isActive: boolean;
  category: string;
  creator: {
    name: string;
    avatar: string;
  };
  onVote?: (pollId: string, optionId: string) => void;
}

const PollCard: React.FC<PollCardProps> = ({
  id,
  title,
  description,
  options,
  totalVotes,
  endDate,
  isActive,
  category,
  creator,
  onVote
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const progressRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 50,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          delay: Math.random() * 0.3,
        }
      );
    }
  }, []);

  useEffect(() => {
    // Animate progress bars
    progressRefs.current.forEach((ref, index) => {
      if (ref) {
        gsap.fromTo(
          ref,
          { width: 0 },
          {
            width: `${options[index]?.percentage || 0}%`,
            duration: 1.5,
            ease: "power2.out",
            delay: 0.5 + index * 0.1,
          }
        );
      }
    });
  }, [options]);

  const handleVote = (optionId: string) => {
    if (onVote && isActive) {
      onVote(id, optionId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends today';
    if (diffDays === 1) return 'Ends tomorrow';
    return `Ends in ${diffDays} days`;
  };

  return (
    <motion.div
      ref={cardRef}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary-800/50 to-secondary-700/30 backdrop-blur-xl border border-white/10 hover:border-primary-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10"
      whileHover={{ 
        y: -8,
        scale: 1.02,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                isActive 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {isActive ? 'Active' : 'Ended'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30">
                {category}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-400 transition-colors duration-300">
              {title}
            </h3>
            
            <p className="text-secondary-300 text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Creator info */}
        <div className="flex items-center gap-3 py-3 border-t border-white/10">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-500/30">
            <img 
              src={creator.avatar} 
              alt={creator.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/32/6366f1/ffffff?text=' + creator.name.charAt(0);
              }}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{creator.name}</p>
            <p className="text-xs text-secondary-400">{formatDate(endDate)}</p>
          </div>
        </div>

        {/* Poll options */}
        <div className="space-y-3">
          {options.map((option, index) => (
            <motion.div
              key={option.id}
              className={`relative cursor-pointer rounded-xl p-4 transition-all duration-300 ${
                isActive 
                  ? 'bg-white/5 hover:bg-white/10 hover:border-primary-500/50' 
                  : 'bg-white/5'
              } border border-white/10`}
              onClick={() => handleVote(option.id)}
              whileHover={isActive ? { scale: 1.02 } : {}}
              whileTap={isActive ? { scale: 0.98 } : {}}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  {option.text}
                </span>
                <span className="text-sm text-secondary-300">
                  {option.votes} votes
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  ref={(el) => (progressRefs.current[index] = el)}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300"
                  style={{ width: `${option.percentage}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div className="mt-1 text-right">
                <span className="text-xs font-medium text-primary-400">
                  {option.percentage.toFixed(1)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-sm text-secondary-400">
              {totalVotes.toLocaleString()} total votes
            </span>
          </div>
          
          {isActive && (
            <motion.button
              className="px-4 py-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Vote Now
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PollCard;
