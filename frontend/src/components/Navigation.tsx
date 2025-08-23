import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX } from 'react-icons/hi';
import { FaWallet, FaUser } from 'react-icons/fa';
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
          : 'bg-black/20 backdrop-blur-sm border-b border-white/10'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-20 sm:h-22 lg:h-24">
          {/* Logo - Left Section */}
          <motion.div 
            className="flex items-center space-x-2 sm:space-x-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer' }}
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-golden-gradient rounded-xl flex items-center justify-center shadow-lg">
              <FiTrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-secondary-900" />
            </div>
            <span className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-gradient">
              Binpoll
            </span>
          </motion.div>

          {/* Desktop Navigation - Center Section */}
          {(currentPage === 'home' || currentPage === 'profile') && (
            <div className="hidden lg:flex items-center space-x-12">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="text-secondary-200 hover:text-primary-400 transition-colors duration-300 font-medium text-lg"
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

          {/* Desktop Action Buttons - Right Section */}
          <div className="hidden lg:flex items-center navbar-spacing">
            {/* Navigation Buttons */}
            <motion.button
              onClick={() => navigate('/dashboard')}
              className={`navbar-button flex items-center space-x-3 ${
                currentPage === 'dashboard'
                  ? 'navbar-button-primary'
                  : 'navbar-button-secondary'
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiBarChart2 className="w-5 h-5" />
              <span>Dashboard</span>
            </motion.button>

            <motion.button
              onClick={() => navigate('/profile')}
              className={`navbar-button flex items-center space-x-3 ${
                currentPage === 'profile'
                  ? 'navbar-button-primary'
                  : 'navbar-button-secondary'
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaUser className="w-5 h-5" />
              <span>Profile</span>
            </motion.button>

            {/* Wallet Connect with better spacing */}
            <div className="ml-6">
              <WalletConnectAuth />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden p-2 sm:p-3 text-secondary-300 hover:text-primary-400 transition-colors rounded-lg hover:bg-white/10"
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
                  <HiX className="w-6 h-6 sm:w-7 sm:h-7" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiMenu className="w-6 h-6 sm:w-7 sm:h-7" />
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
              className="lg:hidden overflow-hidden"
            >
              <div className="py-8 space-y-6">
                {/* Mobile Navigation Items */}
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    className="block text-secondary-200 hover:text-primary-400 transition-colors duration-300 font-medium text-lg py-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}

                {/* Mobile Action Buttons */}
                <div className="pt-6 space-y-4 border-t border-secondary-800">
                  <motion.button
                    onClick={() => {
                      navigate('/dashboard');
                      setIsOpen(false);
                    }}
                    className={`w-full navbar-button flex items-center justify-center space-x-3 ${
                      currentPage === 'dashboard'
                        ? 'navbar-button-primary'
                        : 'navbar-button-secondary'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiBarChart2 className="w-5 h-5" />
                    <span>Dashboard</span>
                  </motion.button>

                  <motion.button
                    onClick={() => {
                      navigate('/profile');
                      setIsOpen(false);
                    }}
                    className={`w-full navbar-button flex items-center justify-center space-x-3 ${
                      currentPage === 'profile'
                        ? 'navbar-button-primary'
                        : 'navbar-button-secondary'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaUser className="w-5 h-5" />
                    <span>Profile</span>
                  </motion.button>

                  {/* Mobile Wallet Connect */}
                  <div className="pt-4">
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
