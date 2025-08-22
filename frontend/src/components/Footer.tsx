import { motion } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiMail,
  FiExternalLink
} from 'react-icons/fi';
import { FaTwitter, FaGithub, FaDiscord } from 'react-icons/fa';

export const Footer = () => {
  const footerSections = [
    {
      title: 'Platform',
      links: [
        { label: 'Topics', href: '#topics' },
        { label: 'Analytics', href: '#analytics' },
        { label: 'API', href: '#api' },
        { label: 'Roadmap', href: '#roadmap' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '#docs' },
        { label: 'Tutorials', href: '#tutorials' },
        { label: 'Blog', href: '#blog' },
        { label: 'Help Center', href: '#help' }
      ]
    },
    {
      title: 'Community',
      links: [
        { label: 'Discord', href: '#discord' },
        { label: 'Twitter', href: '#twitter' },
        { label: 'GitHub', href: '#github' },
        { label: 'Forum', href: '#forum' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms of Service', href: '#terms' },
        { label: 'Privacy Policy', href: '#privacy' },
        { label: 'Disclaimer', href: '#disclaimer' },
        { label: 'Licenses', href: '#licenses' }
      ]
    }
  ];

  const socialLinks = [
    { icon: FaTwitter, href: '#twitter', label: 'Twitter' },
    { icon: FaDiscord, href: '#discord', label: 'Discord' },
    { icon: FaGithub, href: '#github', label: 'GitHub' },
    { icon: FiMail, href: '#email', label: 'Email' }
  ];

  return (
    <footer className="bg-black border-t border-secondary-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500 rounded-full blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <motion.div 
              className="flex items-center space-x-3 mb-6"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-12 h-12 bg-golden-gradient rounded-xl flex items-center justify-center">
                <FiTrendingUp className="w-7 h-7 text-secondary-900" />
              </div>
              <span className="text-3xl font-display font-bold text-gradient">
                Binpoll
              </span>
            </motion.div>

            <p className="text-secondary-400 mb-8 leading-relaxed max-w-md">
              Empowering knowledge sharing and expertise recognition through blockchain technology. 
              Join our community of experts and earn recognition for your insights.
            </p>

            {/* Social links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-12 h-12 glass-effect rounded-lg flex items-center justify-center text-secondary-400 hover:text-primary-400 transition-colors duration-300"
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: "0 10px 20px rgba(240, 185, 11, 0.2)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Footer sections */}
          {footerSections.map((section, index) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold text-secondary-50 mb-6">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className="text-secondary-400 hover:text-primary-400 transition-colors duration-300 flex items-center space-x-2 group"
                      whileHover={{ x: 5 }}
                    >
                      <span>{link.label}</span>
                      <FiExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="border-t border-secondary-800 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-secondary-500 text-sm">
            © 2024 Binpoll. Built with ❤️ for knowledge sharing and expertise recognition.
          </div>

          <div className="flex items-center space-x-6 text-sm text-secondary-500">
            <span>Powered by BNB Chain</span>
            <div className="w-1 h-1 bg-secondary-500 rounded-full"></div>
            <span>Credibility Based</span>
            <div className="w-1 h-1 bg-secondary-500 rounded-full"></div>
            <span>Expert Community</span>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>
    </footer>
  );
};
