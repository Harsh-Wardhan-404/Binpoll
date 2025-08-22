import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search polls...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          y: -20,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
        }
      );
    }
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <motion.div
      ref={containerRef}
      className={`relative ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 via-transparent to-primary-500/20 rounded-2xl blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative">
        <motion.div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary-800/50 to-secondary-700/30 backdrop-blur-xl border transition-all duration-300 ${
            isFocused 
              ? 'border-primary-500/50 shadow-2xl shadow-primary-500/20' 
              : 'border-white/10 hover:border-primary-500/30'
          }`}
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-primary-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="relative flex items-center px-6 py-4">
            {/* Search icon */}
            <motion.div
              className="mr-4 text-secondary-400"
              animate={{
                scale: isFocused ? 1.1 : 1,
                color: isFocused ? '#f0b90b' : '#8a8a8b',
              }}
              transition={{ duration: 0.2 }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </motion.div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-white placeholder-secondary-400 outline-none text-lg font-medium"
            />

            {/* Clear button */}
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={handleClear}
                  className="ml-4 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    className="w-4 h-4 text-secondary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Animated underline */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-400"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFocused ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          />
        </motion.div>

        {/* Search suggestions (optional) */}
        <AnimatePresence>
          {isFocused && query && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-secondary-800/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
            >
              <div className="p-4">
                <div className="text-sm text-secondary-400 mb-2">Quick filters:</div>
                <div className="flex flex-wrap gap-2">
                  {['Technology', 'Politics', 'Sports', 'Entertainment', 'Science'].map((category) => (
                    <motion.button
                      key={category}
                      className="px-3 py-1 text-xs bg-primary-500/20 text-primary-400 border border-primary-500/30 rounded-full hover:bg-primary-500/30 transition-colors duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSearch(category)}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SearchBar;
