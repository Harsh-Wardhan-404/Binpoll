import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiArrowRight, FiTrendingUp } from 'react-icons/fi';
import { MagneticButton } from './MagneticButton';

gsap.registerPlugin(ScrollTrigger);

export const CTA = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Enhanced title animation with character splitting
      const titleText = document.querySelector('.cta-title h2')?.textContent;
      const titleEl = document.querySelector('.cta-title h2');
      if (titleEl && titleText) {
        titleEl.innerHTML = '';
        titleText.split(' ').forEach((word) => {
          const span = document.createElement('span');
          span.textContent = word + ' ';
          span.className = 'inline-block';
          span.style.opacity = '0';
          span.style.transform = 'translateY(80px) rotateX(-90deg)';
          span.style.transformOrigin = 'center bottom';
          titleEl.appendChild(span);
        });

        gsap.to('.cta-title h2 span', {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: '.cta-title',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        });
      }

      // Buttons animation with 3D effect
      gsap.fromTo('.cta-buttons', 
        { 
          opacity: 0, 
          scale: 0.5,
          rotationY: 45,
          z: -100
        },
        { 
          opacity: 1, 
          scale: 1,
          rotationY: 0,
          z: 0,
          duration: 1,
          ease: 'elastic.out(1, 0.3)',
          scrollTrigger: {
            trigger: '.cta-buttons',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Trust indicators reveal
      gsap.fromTo('.trust-item', 
        { 
          opacity: 0, 
          y: 50,
          scale: 0.8
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          scrollTrigger: {
            trigger: '.trust-indicators',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-padding bg-gradient-to-br from-secondary-800 via-secondary-900 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container-custom text-center max-w-4xl mx-auto relative z-10">
        <div className="cta-title mb-12">
          <h2 className="text-5xl md:text-7xl font-display font-bold mb-8 leading-tight">
            Turn Your Knowledge Into{' '}
            <span className="text-gradient">Recognition & Rewards</span>
          </h2>

          <p className="text-xl md:text-2xl text-secondary-300 mb-12 leading-relaxed max-w-3xl mx-auto">
            Join a community of experts who value informed decision-making and share your insights 
            to earn recognition and rewards for your expertise.
          </p>
        </div>

        <div className="cta-buttons flex flex-col sm:flex-row gap-8 justify-center items-center mb-20" style={{ perspective: '1000px' }}>
          <MagneticButton 
            className="btn-primary text-xl px-14 py-7 flex items-center space-x-4 group relative overflow-hidden"
            strength={0.4}
          >
            <FiTrendingUp className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            <span>Launch App</span>
            <FiArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
            
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 via-primary-500/40 to-primary-400/20 rounded-full opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></div>
          </MagneticButton>

          <MagneticButton 
            className="btn-secondary text-xl px-14 py-7 group relative overflow-hidden"
            strength={0.3}
          >
            <span className="group-hover:text-primary-400 transition-colors duration-300">View Documentation</span>
            
            {/* Border glow effect */}
            <div className="absolute inset-0 rounded-full border-2 border-primary-500/30 group-hover:border-primary-400/60 transition-colors duration-300"></div>
          </MagneticButton>
        </div>

        <div className="trust-indicators grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {[
            { value: "100%", label: "Open Source", color: "text-green-400" },
            { value: "24/7", label: "Uptime", color: "text-blue-400" },
            { value: "0%", label: "Platform Fees", color: "text-primary-400" },
            { value: "∞", label: "Possibilities", color: "text-purple-400" }
          ].map((item) => (
            <div key={item.label} className="trust-item text-center group cursor-pointer">
              <div className={`text-3xl md:text-4xl font-bold ${item.color} mb-3 group-hover:scale-110 transition-all duration-300 group-hover:drop-shadow-lg`}>
                {item.value}
              </div>
              <div className="text-sm md:text-base text-secondary-400 group-hover:text-secondary-300 transition-colors duration-300">
                {item.label}
              </div>
              
              {/* Hover glow effect */}
              <div className={`absolute inset-0 ${item.color.replace('text-', 'bg-').replace('-400', '-400/20')} rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-secondary-900/80 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50 animate-pulse-slow"></div>
    </section>
  );
};
