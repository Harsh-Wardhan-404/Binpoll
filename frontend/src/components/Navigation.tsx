import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX } from 'react-icons/hi';
import { FaWallet } from 'react-icons/fa';
import { FiTrendingUp, FiHome, FiBarChart2 } from 'react-icons/fi';
import { gsap } from 'gsap';
import { useLocation, useNavigate } from 'react-router-dom';
import WalletConnectAuth from './WalletConnectAuth';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current page based on pathname
  const currentPage = location.pathname === '/' ? 'home' : 
                     location.pathname === '/dashboard' ? 'dashboard' : 
                     location.pathname === '/profile' ? 'profile' : 'home';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = currentPage === 'home' ? [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
  ] : currentPage === 'profile' ? [
    { label: 'My Stats', href: '#stats' },
    { label: 'Activity', href: '#activity' },
  ] : [];

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    open: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'glass-effect border-b border-primary-500/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <div className="w-10 h-10 bg-golden-gradient rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-6 h-6 text-secondary-900" />
            </div>
            <span className="text-2xl font-display font-bold text-gradient">
              Binpoll
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          {(currentPage === 'home' || currentPage === 'profile') && (
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="text-secondary-200 hover:text-primary-400 transition-colors duration-300 font-medium"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {item.label}
                </motion.a>
              ))}
            </div>
          )}

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Navigation Buttons */}
            <motion.button
              onClick={() => navigate('/')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                currentPage === 'home'
                  ? 'bg-primary-500 text-secondary-900'
                  : 'text-secondary-300 hover:text-primary-400 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiHome className="w-4 h-4" />
              <span>Home</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/dashboard')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                currentPage === 'dashboard'
                  ? 'bg-primary-500 text-secondary-900'
                  : 'text-secondary-300 hover:text-primary-400 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiBarChart2 className="w-4 h-4" />
              <span>Dashboard</span>
            </motion.button>

            {/* Wallet Connect */}
            <WalletConnectAuth />
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 text-secondary-300 hover:text-primary-400 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiX className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiMenu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="md:hidden overflow-hidden"
            >
              <div className="py-6 space-y-4">
                {/* Mobile Navigation Items */}
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    className="block text-secondary-200 hover:text-primary-400 transition-colors duration-300 font-medium"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}

                {/* Mobile Action Buttons */}
                <div className="pt-4 space-y-3 border-t border-secondary-800">
                  <motion.button
                    onClick={() => {
                      navigate('/');
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                      currentPage === 'home'
                        ? 'bg-primary-500 text-secondary-900'
                        : 'text-secondary-300 hover:text-primary-400 hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiHome className="w-4 h-4" />
                    <span>Home</span>
                  </motion.button>

                  <motion.button
                    onClick={() => {
                      navigate('/dashboard');
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
                      currentPage === 'dashboard'
                        ? 'bg-primary-500 text-secondary-900'
                        : 'text-secondary-300 hover:text-primary-400 hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiBarChart2 className="w-4 h-4" />
                    <span>Dashboard</span>
                  </motion.button>

                  {/* Mobile Wallet Connect */}
                  <div className="pt-2">
                    <WalletConnectAuth />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};
