import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenu, HiX } from 'react-icons/hi';
import { FaWallet } from 'react-icons/fa';
import { FiTrendingUp, FiHome, FiBarChart2 } from 'react-icons/fi';
import { gsap } from 'gsap';
import WalletConnectAuth from './WalletConnectAuth';

interface NavigationProps {
  onNavigate?: (page: 'home' | 'dashboard' | 'profile') => void;
  currentPage?: 'home' | 'dashboard' | 'profile';
}

export const Navigation = ({ onNavigate, currentPage = 'home' }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
            onClick={() => onNavigate?.('home')}
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

                     {/* Navigation Buttons */}
           <div className="hidden md:flex items-center space-x-4">
                                                 {/* Page Navigation */}
                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={() => onNavigate?.(currentPage === 'dashboard' ? 'home' : 'dashboard')}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                            currentPage === 'dashboard'
                              ? 'bg-primary-500 text-secondary-900 shadow-lg shadow-primary-500/25'
                              : 'bg-white/5 text-secondary-300 hover:text-primary-400 border border-white/10'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {currentPage === 'dashboard' ? (
                            <>
                              <FiHome className="w-4 h-4" />
                              <span>Home</span>
                            </>
                          ) : (
                            <>
                              <FiBarChart2 className="w-4 h-4" />
                              <span>Dashboard</span>
                            </>
                          )}
                        </motion.button>

                        <motion.button
                          onClick={() => onNavigate?.('profile')}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center space-x-2 ${
                            currentPage === 'profile'
                              ? 'bg-primary-500 text-secondary-900 shadow-lg shadow-primary-500/25'
                              : 'bg-white/5 text-secondary-300 hover:text-primary-400 border border-white/10'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Profile</span>
                        </motion.button>
                      </div>

             {/* Wallet Connection */}
             <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.6 }}
             >
               <WalletConnectAuth />
             </motion.div>
           </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden text-secondary-200 hover:text-primary-400 transition-colors duration-300"
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
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
              className="md:hidden bg-secondary-800/95 backdrop-blur-lg border-t border-primary-500/20"
            >
                             <div className="py-6 space-y-4">
                 {(currentPage === 'home' || currentPage === 'profile') && navItems.map((item, index) => (
                   <motion.a
                     key={item.label}
                     href={item.href}
                     className="block px-4 py-2 text-secondary-200 hover:text-primary-400 transition-colors duration-300 font-medium"
                     onClick={() => setIsOpen(false)}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: index * 0.1 }}
                   >
                     {item.label}
                   </motion.a>
                 ))}
                                                                      {/* Mobile Navigation Buttons */}
                   <div className="flex space-x-2 px-4 mb-4">
                     <motion.button
                       onClick={() => {
                         onNavigate?.(currentPage === 'dashboard' ? 'home' : 'dashboard');
                         setIsOpen(false);
                       }}
                       className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                         currentPage === 'dashboard'
                           ? 'bg-primary-500 text-secondary-900'
                           : 'bg-white/5 text-secondary-300 border border-white/10'
                       }`}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.2 }}
                     >
                       {currentPage === 'dashboard' ? (
                         <>
                           <FiHome className="w-4 h-4" />
                           <span>Home</span>
                         </>
                       ) : (
                         <>
                           <FiBarChart2 className="w-4 h-4" />
                           <span>Dashboard</span>
                         </>
                       )}
                     </motion.button>

                     <motion.button
                       onClick={() => {
                         onNavigate?.('profile');
                         setIsOpen(false);
                       }}
                       className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                         currentPage === 'profile'
                           ? 'bg-primary-500 text-secondary-900'
                           : 'bg-white/5 text-secondary-300 border border-white/10'
                       }`}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.3 }}
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                       </svg>
                       <span>Profile</span>
                     </motion.button>
                   </div>

                <motion.div
                  className="w-full mx-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setIsOpen(false)}
                >
                  <WalletConnectAuth className="w-full justify-center" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};
