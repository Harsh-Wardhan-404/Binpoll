import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiMousePointer, FiMove, FiZap } from 'react-icons/fi';

gsap.registerPlugin(ScrollTrigger);

export const InteractiveSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Text morphing animation
      gsap.fromTo('.morph-word', 
        { 
          opacity: 0,
          y: 50,
          rotationX: -90
        },
        { 
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: textRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Floating icons animation
      gsap.to('.floating-icon', {
        y: '+=20',
        rotation: '+=10',
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: {
          amount: 1,
          from: 'random'
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const interactiveElements = [
    {
      icon: FiMousePointer,
      title: "Hover Effects",
      description: "Experience responsive interactions"
    },
    {
      icon: FiMove,
      title: "Smooth Animations",
      description: "Fluid motion throughout the interface"
    },
    {
      icon: FiZap,
      title: "Real-time Updates",
      description: "Live data and instant feedback"
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-br from-secondary-900 via-black to-secondary-800 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(240,185,11,0.1),transparent)] animate-pulse-slow"></div>
      </div>

      <div className="container-custom relative z-10">
        <div ref={textRef} className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-8 leading-tight">
            {["Interactive", "Design", "Meets", "Blockchain"].map((word, index) => (
              <span key={index} className="morph-word inline-block mr-4">
                <span className="text-gradient">{word}</span>
              </span>
            ))}
          </h2>
          <p className="text-xl text-secondary-300 max-w-3xl mx-auto">
            Every element responds to your interaction, creating an immersive experience 
            that brings prediction markets to life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {interactiveElements.map((element, index) => (
            <motion.div
              key={element.title}
              className="text-center p-8 rounded-2xl glass-effect group hover:bg-white/10 transition-all duration-500 cursor-pointer relative"
              whileHover={{ 
                scale: 1.05,
                rotateY: 5,
                boxShadow: "0 25px 50px rgba(240, 185, 11, 0.2)"
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="floating-icon relative z-10 mb-6">
                <div className="w-16 h-16 bg-primary-400/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary-400/20 transition-colors duration-300">
                  <element.icon className="w-8 h-8 text-primary-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-4 text-secondary-50 group-hover:text-primary-400 transition-colors duration-300">
                {element.title}
              </h3>
              
              <p className="text-secondary-400 group-hover:text-secondary-300 transition-colors duration-300">
                {element.description}
              </p>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
