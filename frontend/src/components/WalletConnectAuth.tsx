import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { bscTestnet, hardhat } from 'wagmi/chains';
import { FaWallet, FaCheck, FaExclamationTriangle, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { HiX, HiExternalLink } from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';

interface WalletConnectAuthProps {
  className?: string;
}

const WalletConnectAuth: React.FC<WalletConnectAuthProps> = ({ className = '' }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const { isAuthenticated, user, authenticate, logout, isLoading } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const currentNetwork = chainId === hardhat.id ? 'Hardhat Local' : 
                         chainId === bscTestnet.id ? 'BSC Testnet' : 'Unknown';

  const isCorrectNetwork = chainId === bscTestnet.id || chainId === hardhat.id;

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = (connector: any) => {
    connect({ connector });
    setShowModal(false);
  };

  const handleNetworkSwitch = (targetChain: typeof bscTestnet | typeof hardhat) => {
    switchChain({ chainId: targetChain.id });
  };

  const handleAuthenticate = async () => {
    if (!isConnected) return;
    
    try {
      setIsAuthenticating(true);
      await authenticate();
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    logout();
    disconnect();
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  // Auto-authenticate when wallet connects (if not already authenticated)
  useEffect(() => {
    if (isConnected && !isAuthenticated && !isLoading && !isAuthenticating) {
      // Auto-authenticate after a short delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        handleAuthenticate();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, isAuthenticated, isLoading, isAuthenticating]);

  // Show authenticated state
  if (isConnected && isAuthenticated && user) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {/* Network Status */}
        {!isCorrectNetwork && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg"
          >
            <FaExclamationTriangle className="text-red-400 text-sm" />
            <span className="text-red-300 text-sm font-medium">Wrong Network</span>
          </motion.div>
        )}

        {/* Network Switcher */}
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          <motion.button
            onClick={() => handleNetworkSwitch(bscTestnet)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
              chainId === bscTestnet.id
                ? 'bg-primary-500 text-secondary-900'
                : 'text-secondary-300 hover:text-white hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            BSC Testnet
          </motion.button>
          <motion.button
            onClick={() => handleNetworkSwitch(hardhat)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
              chainId === hardhat.id
                ? 'bg-primary-500 text-secondary-900'
                : 'text-secondary-300 hover:text-white hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Hardhat Local
          </motion.button>
        </div>

        {/* User Info */}
        <motion.div
          className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2"
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center space-x-2">
            <img 
              src={user.avatarUrl} 
              alt={user.username}
              className="w-6 h-6 rounded-full"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{user.username}</span>
              <span className="text-xs text-secondary-400">{truncateAddress(user.walletAddress)}</span>
            </div>
          </div>
          <button
            onClick={copyAddress}
            className="text-secondary-300 hover:text-primary-400 transition-colors"
          >
            <FaUser className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="text-secondary-400 hover:text-red-400 transition-colors"
          >
            <FaSignOutAlt className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  // Show connected but not authenticated state
  if (isConnected && !isAuthenticated) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <motion.button
          onClick={handleAuthenticate}
          disabled={isAuthenticating}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaUser className="w-4 h-4" />
          <span>{isAuthenticating ? 'Authenticating...' : 'Sign Message'}</span>
        </motion.button>
        
        <motion.div
          className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-lg px-4 py-2"
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-sm text-secondary-300">Connected to {currentNetwork}</span>
          </div>
          <button
            onClick={copyAddress}
            className="text-white font-mono text-sm hover:text-primary-400 transition-colors"
          >
            {truncateAddress(address || '')}
          </button>
          <button
            onClick={() => disconnect()}
            className="text-secondary-400 hover:text-red-400 transition-colors"
          >
            <HiX className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  // Show not connected state
  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-secondary-900 font-semibold rounded-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/25 ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isPending}
      >
        <FaWallet className="w-5 h-5" />
        <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
      </motion.button>

      {/* Connection Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-secondary-800 border border-white/10 rounded-2xl p-8 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-secondary-400 hover:text-white transition-colors"
              >
                <HiX className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaWallet className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Connect & Authenticate</h3>
                <p className="text-secondary-300">
                  Connect your wallet and sign a message to access BinPoll
                </p>
              </div>

              {/* Connector List */}
              <div className="space-y-3">
                {connectors.map((connector) => (
                  <motion.button
                    key={connector.uid}
                    onClick={() => handleConnect(connector)}
                    disabled={!connector.name || isPending}
                    className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-primary-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <FaWallet className="w-5 h-5 text-primary-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-white">{connector.name}</div>
                        <div className="text-sm text-secondary-400">
                          {connector.name === 'MetaMask' ? 'Connect using MetaMask' : 'Web3 Browser Wallet'}
                        </div>
                      </div>
                    </div>
                    <HiExternalLink className="w-5 h-5 text-secondary-400" />
                  </motion.button>
                ))}
              </div>

              {/* Authentication Info */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FaUser className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">Authentication Process</span>
                </div>
                <div className="text-sm text-secondary-300 space-y-1">
                  <div>1. Connect your wallet</div>
                  <div>2. Sign a message to authenticate</div>
                  <div>3. Access your personalized dashboard</div>
                  <div className="text-xs text-secondary-400 mt-2">
                    * No gas fees required for authentication
                  </div>
                </div>
              </div>

              {/* Network Info */}
              <div className="mt-4 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FaCheck className="w-4 h-4 text-primary-400" />
                  <span className="text-sm font-medium text-primary-300">Supported Networks</span>
                </div>
                <div className="text-sm text-secondary-300 space-y-1">
                  <div>• BSC Testnet (Recommended)</div>
                  <div>• Hardhat Local (Development)</div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-secondary-400">
                  By connecting, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WalletConnectAuth;
