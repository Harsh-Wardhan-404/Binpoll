import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiPlus, HiMinus } from 'react-icons/hi';
import { FiClock, FiEdit3, FiUsers } from 'react-icons/fi';
import { useSimplePoll } from '../hooks/useSimplePoll';
import { useChainId, useAccount } from 'wagmi';
import { usePolls } from '../hooks/usePolls';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(60); // Default 1 hour in minutes
  const [creatorDeposit, setCreatorDeposit] = useState('0.002'); // Default minimum deposit
  const [requiredCredibility, setRequiredCredibility] = useState(10); // Default credibility requirement
  const [pollPrice, setPollPrice] = useState('0.01'); // Default poll price
  const [maxVotes, setMaxVotes] = useState(100); // Default max votes
  const [useBlockchain, setUseBlockchain] = useState(true);
  const processedTxHashes = useRef(new Set<string>());

  // Dynamic per-vote pricing calculation functions
  const calculateBaseVotePrice = (maxVotes: number): number => {
    // Base vote price: 0.001 BNB minimum, scales slightly with poll size
    const basePrice = Math.max(0.001, (maxVotes / 1000) * 0.001);
    return Math.round(basePrice * 1000000) / 1000000; // Round to 6 decimal places
  };

  const calculateMaxVotePrice = (maxVotes: number): number => {
    // Maximum vote price: 5x the base price (anti-spam protection)
    const maxPrice = calculateBaseVotePrice(maxVotes) * 5;
    return Math.round(maxPrice * 1000000) / 1000000;
  };

  const calculateRecommendedVotePrice = (maxVotes: number): number => {
    // Recommended vote price: 2x the base price (balanced approach)
    const recommended = calculateBaseVotePrice(maxVotes) * 2;
    return Math.round(recommended * 1000000) / 1000000;
  };

  const calculateVotePriceAtPosition = (basePrice: number, currentVotes: number, maxVotes: number): number => {
    // Dynamic pricing: price increases as more people vote
    // Formula: basePrice * (1 + (currentVotes / maxVotes) * 4)
    // This means: first vote = basePrice, last vote = 5x basePrice
    const multiplier = 1 + (currentVotes / maxVotes) * 4;
    const dynamicPrice = basePrice * multiplier;
    return Math.round(dynamicPrice * 1000000) / 1000000;
  };

  const calculateTotalPollValue = (baseVotePrice: number, maxVotes: number): number => {
    // Total poll value = sum of all vote prices from first to last
    // This creates a curve where early votes are cheaper
    let total = 0;
    for (let i = 0; i < maxVotes; i++) {
      total += calculateVotePriceAtPosition(baseVotePrice, i, maxVotes);
    }
    return Math.round(total * 1000000) / 1000000;
  };

  // Auto-update poll price when maxVotes changes
  useEffect(() => {
    if (useBlockchain) {
      const newBaseVotePrice = calculateBaseVotePrice(maxVotes);
      setPollPrice(newBaseVotePrice.toString());
    }
  }, [maxVotes, useBlockchain]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  const chainId = useChainId();
  const { isConnected, address } = useAccount();
  const { 
    createNewPoll, 
    isCreatingPoll, 
    entryFee, 
    minCreatorDeposit, 
    createPollError,
    createPollTxHash
  } = useSimplePoll(chainId);
  const { createPoll, createBlockchainPoll, loading: isCreatingApiPoll } = usePolls();

  // Save blockchain poll to database when transaction is confirmed
  useEffect(() => {
    if (createPollTxHash && address && !processedTxHashes.current.has(createPollTxHash)) {
      // Check if we have valid form data before processing
      const hasValidData = title.trim() && description.trim() && options.some(opt => opt.trim() !== '');
      
      if (!hasValidData) {
        console.log('⚠️ Skipping blockchain poll save - form data is empty (likely after reset)');
        return;
      }
      
      // Mark this transaction as processed to prevent duplicate calls
      processedTxHashes.current.add(createPollTxHash);
      
      // Save the blockchain poll to the database
      const saveBlockchainPoll = async () => {
        try {
          console.log('💾 Saving blockchain poll to database after transaction confirmation');

          console.log('💰 Creator deposit:', creatorDeposit);
          console.log('💰 Total pool:', creatorDeposit);
          console.log('Duration:', duration);

          
          const result = await createBlockchainPoll({
            title: title.trim(),
            description: description.trim(),
            options: options.filter(opt => opt.trim() !== ''),
            durationMinutes: duration,
            category: 'Blockchain',
            blockchainId: '1', // Will be updated with actual poll ID from events
            transactionHash: createPollTxHash,
            creatorAddress: address,
            totalPool: creatorDeposit,
            requiredCredibility,
            pollPrice,
            maxVotes
          });
          
          if (result) {
            // Dispatch custom event to notify dashboard to refresh
            window.dispatchEvent(new CustomEvent('poll-created'));
            handleClose();
            alert('Poll created successfully on the blockchain and saved to database!');
          } else {
            handleClose();
            alert('Poll created on blockchain but failed to save to database. Other users might not see it immediately.');
          }
        } catch (error) {
          console.error('❌ Error saving blockchain poll to database:', error);
          handleClose();
          alert('Poll created on blockchain but failed to save to database. Other users might not see it immediately.');
        }
      };
      
      saveBlockchainPoll();
    }
  }, [createPollTxHash, address, title, description, options, duration, creatorDeposit, createBlockchainPoll]);

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description');
      return;
    }

    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      alert('Please provide at least 2 options');
      return;
    }

    // Validate creator deposit
    const depositAmount = parseFloat(creatorDeposit);
    const minDeposit = parseFloat(minCreatorDeposit);
    if (useBlockchain && depositAmount < minDeposit) {
      alert(`Creator deposit must be at least ${minCreatorDeposit} BNB`);
      return;
    }

    try {
      if (useBlockchain) {
        // Create poll on blockchain with creator deposit
        try {
          console.log('🚀 Creating new poll:', { title, description, options, duration, creatorDeposit });
          createNewPoll(
            title.trim(),
            description.trim(),
            validOptions,
            duration,
            creatorDeposit,
            requiredCredibility,
            pollPrice,
            maxVotes
          );
          
          // Don't close modal immediately - wait for transaction to be initiated
          alert('Please check your wallet and confirm the transaction to create your poll.');
        } catch (contractError: any) {
          console.error('Contract error:', contractError);
          alert(`Failed to create blockchain poll: ${contractError.message || contractError}`);
          return;
        }
      } else {
        // Create poll using API only
        const newPoll = await createPoll({
          title: title.trim(),
          description: description.trim(),
          options: validOptions,
          durationMinutes: duration,
          category: 'General'
        });

        if (newPoll) {
          // Dispatch custom event to notify dashboard to refresh
          window.dispatchEvent(new CustomEvent('poll-created'));
          // Close modal and reset form
          handleClose();
          
          // Show success message
          alert('Poll created successfully! It will appear in the dashboard.');
        } else {
          alert('Failed to create poll. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll. Please try again.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOptions(['', '']);
    setDuration(60);
    setCreatorDeposit('0.002');
    setRequiredCredibility(10);
    setMaxVotes(100);
    setPollPrice(calculateBaseVotePrice(100).toString()); // Use calculated base vote price
    setUseBlockchain(true);
    // Clear processed transaction hashes
    processedTxHashes.current.clear();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-secondary-800 border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative modal-scrollbar"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
            }}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-secondary-400 hover:text-white transition-colors"
            >
              <HiX className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiEdit3 className="w-8 h-8 text-primary-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Create New Poll</h3>
              <p className="text-secondary-300">
                Create a prediction poll stored in the database
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" onWheel={(e) => e.stopPropagation()}>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Poll Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you want people to predict?"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  maxLength={100}
                />
                <div className="text-xs text-secondary-400 mt-1">
                  {title.length}/100 characters
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more details about your poll..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-secondary-400 mt-1">
                  {description.length}/500 characters
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Poll Options (2-5 options) *
                </label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          maxLength={50}
                        />
                      </div>
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <HiMinus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-3 flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <HiPlus className="w-4 h-4" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-2">
                  Poll Duration
                </label>
                
                {/* Quick preset buttons for development */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setDuration(0.5)} // 30 seconds
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      duration === 0.5 
                        ? 'bg-primary-500 text-secondary-900' 
                        : 'bg-white/10 text-secondary-300 hover:bg-white/20'
                    }`}
                  >
                    30 sec
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration(1)} // 1 minute
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      duration === 1 
                        ? 'bg-primary-500 text-secondary-900' 
                        : 'bg-white/10 text-secondary-300 hover:bg-white/20'
                    }`}
                  >
                    1 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration(5)} // 5 minutes
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      duration === 5 
                        ? 'bg-primary-500 text-secondary-900' 
                        : 'bg-white/10 text-secondary-300 hover:bg-white/20'
                    }`}
                  >
                    5 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration(60)} // 1 hour
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      duration === 60 
                        ? 'bg-primary-500 text-secondary-900' 
                        : 'bg-white/10 text-secondary-300 hover:bg-white/20'
                    }`}
                  >
                    1 hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration(1440)} // 24 hours
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      duration === 1440 
                        ? 'bg-primary-500 text-secondary-900' 
                        : 'bg-white/10 text-secondary-300 hover:bg-white/20'
                    }`}
                  >
                    1 day
                  </button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <FiClock className="w-5 h-5 text-secondary-400" />
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0.5"
                      max="43200"
                      step="0.5"
                      value={duration}
                      onChange={(e) => setDuration(parseFloat(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-secondary-400 mt-1">
                      <span>30 sec</span>
                      <span>
                        {duration < 1 
                          ? `${duration * 60} seconds` 
                          : duration < 60 
                            ? `${duration} minutes` 
                            : duration < 1440
                              ? `${Math.round(duration / 60 * 10) / 10} hours`
                              : `${Math.round(duration / 1440 * 10) / 10} days`
                        }
                      </span>
                      <span>30 days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockchain Toggle */}
              <div>
                <label className="block text-sm font-medium text-secondary-300 mb-4">
                  Poll Type
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setUseBlockchain(true)}
                    className={`flex-1 p-4 border rounded-lg transition-all ${
                      useBlockchain
                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                        : 'border-white/10 bg-white/5 text-secondary-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium mb-1">🚀 Blockchain Poll</div>
                      <div className="text-xs opacity-80">
                        With rewards & creator deposit
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseBlockchain(false)}
                    className={`flex-1 p-4 border rounded-lg transition-all ${
                      !useBlockchain
                        ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                        : 'border-white/10 bg-white/5 text-secondary-300 hover:border-white/20'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium mb-1">📊 Simple Poll</div>
                      <div className="text-xs opacity-80">
                        Database only, no deposits
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Creator Deposit (only for blockchain polls) */}
              {useBlockchain && (
                <div>
                  <label className="block text-sm font-medium text-secondary-300 mb-2">
                    Creator Deposit
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={creatorDeposit}
                          onChange={(e) => setCreatorDeposit(e.target.value)}
                          min={minCreatorDeposit}
                          step="0.001"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="0.002"
                        />
                      </div>
                      <div className="text-secondary-300 font-medium">BNB</div>
                    </div>
                    <div className="text-xs text-secondary-400">
                      Minimum: {minCreatorDeposit} BNB. This amount will be added to the reward pool.
                    </div>
                    
                    {/* Quick Deposit Buttons */}
                    <div className="flex space-x-2">
                      {['0.002', '0.005', '0.01', '0.02'].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setCreatorDeposit(amount)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            creatorDeposit === amount
                              ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                              : 'border-white/20 text-secondary-300 hover:border-white/40'
                          }`}
                        >
                          {amount} BNB
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* New Reward System Fields (only for blockchain polls) */}
              {useBlockchain && (
                <div className="space-y-4">
                  {/* Required Credibility */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Required Credibility
                    </label>
                    <input
                      type="number"
                      value={requiredCredibility}
                      onChange={(e) => setRequiredCredibility(parseInt(e.target.value))}
                      min={10}
                      max={1000}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="10"
                    />
                    <div className="text-xs text-secondary-400 mt-1">
                      Minimum credibility users need to vote on this poll
                    </div>
                  </div>

                  {/* Max Votes */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Maximum Votes
                    </label>
                    <input
                      type="number"
                      value={maxVotes}
                      onChange={(e) => setMaxVotes(parseInt(e.target.value))}
                      min={10}
                      max={1000}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="100"
                    />
                    <div className="text-xs text-secondary-400 mt-1">
                      Maximum number of votes allowed for this poll
                    </div>
                  </div>

                  {/* Dynamic Poll Price (calculated based on max votes) */}
                  <div>
                    <label className="block text-sm font-medium text-secondary-300 mb-2">
                      Poll Price (Total Bet Amount)
                    </label>
                    <div className="space-y-3">
                      {/* Base Vote Price Display */}
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-secondary-300">Base Vote Price:</span>
                          <span className="text-primary-400 font-medium">
                            {calculateBaseVotePrice(maxVotes)} BNB
                          </span>
                        </div>
                        <div className="text-xs text-secondary-400 mt-1">
                          First voter pays this amount
                        </div>
                      </div>
                      
                      {/* Dynamic Pricing Preview */}
                      {/*<div className="bg-gradient-to-r from-green-500/10 to-red-500/10 border border-white/10 rounded-lg p-3">
                        <div className="text-sm font-medium text-white mb-2">Dynamic Pricing Preview</div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="text-green-400 font-medium">First Vote</div>
                            <div className="text-secondary-300">{calculateBaseVotePrice(maxVotes)} BNB</div>
                          </div>
                          <div className="text-center">
                            <div className="text-yellow-400 font-medium">Middle Vote</div>
                            <div className="text-secondary-300">{calculateVotePriceAtPosition(calculateBaseVotePrice(maxVotes), Math.floor(maxVotes/2), maxVotes)} BNB</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 font-medium">Last Vote</div>
                            <div className="text-secondary-300">{calculateVotePriceAtPosition(calculateBaseVotePrice(maxVotes), maxVotes - 1, maxVotes)} BNB</div>
                          </div>
                        </div>
                      </div>*/}
                      
                      {/* Base Vote Price Input */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <input
                            type="number"
                            value={pollPrice}
                            onChange={(e) => setPollPrice(e.target.value)}
                            min={calculateBaseVotePrice(maxVotes)}
                            step="0.000001"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder={calculateBaseVotePrice(maxVotes).toString()}
                          />
                        </div>
                        <div className="text-secondary-300 font-medium">BNB</div>
                      </div>
                      
                      {/* Quick Price Adjustment Buttons */}
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setPollPrice(calculateBaseVotePrice(maxVotes).toString())}
                          className="px-3 py-1 text-xs rounded-full border border-white/20 text-secondary-300 hover:border-white/40 hover:bg-white/5 transition-colors"
                        >
                          Base Price
                        </button>
                        <button
                          type="button"
                          onClick={() => setPollPrice(calculateRecommendedVotePrice(maxVotes).toString())}
                          className="px-3 py-1 text-xs rounded-full border border-primary-500/30 text-primary-400 hover:border-primary-500/50 hover:bg-primary-500/10 transition-colors"
                        >
                          Recommended
                        </button>
                        <button
                          type="button"
                          onClick={() => setPollPrice(calculateMaxVotePrice(maxVotes).toString())}
                          className="px-3 py-1 text-xs rounded-full border border-white/20 text-secondary-300 hover:border-white/40 hover:bg-white/5 transition-colors"
                        >
                          Max Price
                        </button>
                      </div>
                      
                      {/* Price Range Info */}
                      <div className="text-xs text-secondary-400">
                        <div>• Base vote price: {calculateBaseVotePrice(maxVotes)} BNB</div>
                        <div>• Recommended: {calculateRecommendedVotePrice(maxVotes)} BNB</div>
                        <div>• Maximum: {calculateMaxVotePrice(maxVotes)} BNB</div>
                        <div>• Total poll value: {calculateTotalPollValue(parseFloat(pollPrice) || calculateBaseVotePrice(maxVotes), maxVotes)} BNB</div>
                        <div>• Early voters get better prices!</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Poll Info */}
              {useBlockchain ? (
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🚀</span>
                    <span className="text-primary-300 font-medium">Blockchain Prediction Market</span>
                  </div>
                  <div className="text-sm text-secondary-300 space-y-1">
                    <div>• Required credibility: {requiredCredibility}</div>
                    <div>• Max votes: {maxVotes}</div>
                    <div>• Base vote price: {calculateBaseVotePrice(maxVotes)} BNB</div>
                    <div>• First vote: {calculateBaseVotePrice(maxVotes)} BNB</div>
                    <div>• Last vote: {calculateVotePriceAtPosition(calculateBaseVotePrice(maxVotes), maxVotes - 1, maxVotes)} BNB</div>
                    <div>• Total poll value: {calculateTotalPollValue(calculateBaseVotePrice(maxVotes), maxVotes)} BNB</div>
                    <div>• Creator deposit: {creatorDeposit} BNB</div>
                    <div>• Dynamic pricing rewards early voters</div>
                    <div>• Immutable and transparent on BSC</div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">📊</span>
                    <span className="text-blue-300 font-medium">Simple Database Poll</span>
                  </div>
                  <div className="text-sm text-secondary-300 space-y-1">
                    <div>• Free to create and vote</div>
                    <div>• Stored in secure database</div>
                    <div>• Real-time results</div>
                    <div>• Perfect for opinion surveys</div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {createPollError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="text-red-400 text-sm">
                    Error: {createPollError.message}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-secondary-300 font-medium rounded-lg hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(useBlockchain ? isCreatingPoll : isCreatingApiPoll) || !isConnected}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-secondary-900 font-semibold rounded-lg hover:shadow-xl hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {useBlockchain ? (
                    isCreatingPoll ? 'Creating Blockchain Poll...' : `Create Poll (${creatorDeposit} BNB)`
                  ) : (
                    isCreatingApiPoll ? 'Creating Poll...' : 'Create Simple Poll'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePollModal;
