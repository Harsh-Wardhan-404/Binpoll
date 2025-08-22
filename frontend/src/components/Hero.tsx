import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiArrowRight, FiLock, FiShield } from 'react-icons/fi';
import Threads from './Threads';
import DecryptedText from './DecryptedText';

gsap.registerPlugin(ScrollTrigger);

export const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Simple fade in animation for content
      gsap.fromTo('.hero-content', 
        { 
          opacity: 0, 
          y: 50
        },
        { 
          opacity: 1, 
          y: 0,
          duration: 1.5,
          delay: 0.5,
          ease: "power3.out"
        }
      );

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dark gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-secondary-900 to-secondary-800"></div>
      
      {/* Interactive Threads WebGL Background */}
      <div className="absolute inset-0">
        <Threads
          amplitude={1.2}
          distance={0.3}
          enableMouseInteraction={true}
        />
      </div>

      {/* Subtle overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="container-custom relative z-20 text-center max-w-4xl mx-auto">
        <div className="hero-content space-y-12">
          
          {/* Security Badge */}



          {/* Minimal Main Title */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
              Next-Gen <span className="text-gradient">Prediction Markets</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-secondary-300 max-w-2xl mx-auto leading-relaxed">
              <DecryptedText
                text="Decentralized • Transparent • Immutable"
                speed={80}
                maxIterations={12}
                characters="DECENTRALIZED•░▒▓█"
                className="font-mono font-bold text-primary-300"
                animateOn="view"
                revealDirection="center"
              />
            </p>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { title: "Protected", desc: "Smart contract security" },
              { title: "Private", desc: "Your data stays yours" },
              { title: "Proven", desc: "Battle-tested technology" }
            ].map((item, index) => (
              <motion.div 
                key={item.title}
                className="glass-effect p-6 rounded-2xl border border-primary-500/20 group cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.2, duration: 0.8 }}
                whileHover={{ scale: 1.05, borderColor: "rgba(240, 185, 11, 0.4)" }}
              >
                <FiShield className="w-8 h-8 text-primary-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-lg font-bold text-white mb-2">
                  <DecryptedText
                    text={item.title}
                    speed={100}
                    maxIterations={8}
                    characters="PROTECTED01"
                    className="font-bold"
                    animateOn="hover"
                  />
                </div>
                <p className="text-sm text-secondary-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div 
            className="pt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.8 }}
          >

          </motion.div>
        </div>
      </div>

      {/* Enhanced scroll indicator */}
      <motion.div 
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 cursor-pointer z-20"
        initial={{ opacity: 0 }}
        animate={{ 
          y: [0, 10, 0],
          opacity: 1 
        }}
        transition={{ 
          y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          opacity: { delay: 2.5, duration: 1 }
        }}
        onClick={() => {
          const featuresSection = document.getElementById('features');
          featuresSection?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <div className="relative group">
          <div className="w-8 h-12 border-2 border-primary-500 rounded-full flex justify-center group-hover:border-primary-300 transition-colors bg-black/20 backdrop-blur-sm">
            <div className="w-1.5 h-4 bg-primary-500 rounded-full mt-3 group-hover:bg-primary-300 transition-colors"></div>
          </div>
          <div className="absolute inset-0 bg-primary-500/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Scroll hint */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            <DecryptedText
              text="EXPLORE FEATURES"
              speed={120}
              maxIterations={6}
              characters="↓EXPLORE░▒▓█"
              className="text-xs text-primary-400/70 font-mono font-bold tracking-widest"
              animateOn="view"
              revealDirection="center"
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
};
