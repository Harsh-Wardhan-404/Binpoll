import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiX, HiPlus, HiMinus } from 'react-icons/hi';
import { FiClock, FiEdit3, FiUsers } from 'react-icons/fi';
import { useSimplePoll } from '../hooks/useSimplePoll';
import { useChainId, useAccount } from 'wagmi';
import { createLocalPoll, saveLocalPoll } from '../utils/localStorage';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(24);

  const chainId = useChainId();
  const { isConnected, address } = useAccount();
  const { createNewPoll, isCreatingPoll, entryFee, createPollError } = useSimplePoll(chainId);

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

  const handleSubmit = (e: React.FormEvent) => {
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

    // Create and save poll to localStorage
    const newPoll = createLocalPoll(
      title.trim(),
      description.trim(),
      validOptions,
      duration,
      'You', // Creator name - you can customize this
      address,
      'General' // Default category - you can add category selection later
    );

    saveLocalPoll(newPoll);

    // Dispatch custom event to notify Dashboard
    window.dispatchEvent(new CustomEvent('pollCreated'));

    // Optional: Also create on blockchain (comment out for now)
    // createNewPoll(title.trim(), description.trim(), validOptions, duration);

    // Close modal and reset form
    handleClose();
    
    // Show success message
    alert('Poll created successfully! It will appear in the dashboard.');
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOptions(['', '']);
    setDuration(24);
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-secondary-800 border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
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
                Create a prediction poll (temporarily stored locally)
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="flex items-center space-x-4">
                  <FiClock className="w-5 h-5 text-secondary-400" />
                  <div className="flex-1">
                    <input
                      type="range"
                      min="1"
                      max="720"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-secondary-400 mt-1">
                      <span>1h</span>
                      <span>{duration} hours</span>
                      <span>30 days</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Local Storage Info */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FiUsers className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-300 font-medium">Local Storage Mode</span>
                </div>
                <div className="text-sm text-secondary-300 space-y-1">
                  <div>• Poll stored locally in your browser</div>
                  <div>• No blockchain fees required</div>
                  <div>• Vote counting simulated for testing</div>
                  <div>• Ready for database integration later</div>
                </div>
              </div>

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
                  disabled={isCreatingPoll || !isConnected}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-secondary-900 font-semibold rounded-lg hover:shadow-xl hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isCreatingPoll ? 'Creating Poll...' : 'Create Poll'}
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
