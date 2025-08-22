import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FiShield, FiZap, FiTrendingUp, FiUsers, FiLock, FiBarChart2, FiGlobe, FiAward } from 'react-icons/fi';
import { DotGrid } from './DotGrid';

gsap.registerPlugin(ScrollTrigger);

export const Features = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title text splitting animation
      const titleText = document.querySelector('.feature-title')?.textContent;
      const titleEl = document.querySelector('.feature-title');
      if (titleEl && titleText) {
        titleEl.innerHTML = '';
        titleText.split(' ').forEach((word, wordIndex) => {
          const wordSpan = document.createElement('span');
          wordSpan.className = 'word inline-block mr-4';
          wordSpan.style.overflow = 'hidden';
          
          word.split('').forEach((char, charIndex) => {
            const charSpan = document.createElement('span');
            charSpan.textContent = char;
            charSpan.className = 'char inline-block';
            charSpan.style.transform = 'translateY(100%)';
            wordSpan.appendChild(charSpan);
          });
          
          titleEl.appendChild(wordSpan);
        });

        gsap.to('.feature-title .char', {
          y: 0,
          duration: 0.8,
          stagger: {
            amount: 0.8,
            from: 'start'
          },
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: '.feature-title',
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        });
      }

      // Advanced feature cards animation
      gsap.fromTo('.feature-card', 
        { 
          opacity: 0, 
          y: 100,
          scale: 0.8,
          rotationY: 45,
          z: -100
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          rotationY: 0,
          z: 0,
          duration: 1,
          stagger: {
            amount: 0.6,
            grid: [2, 4],
            from: 'center'
          },
          ease: 'elastic.out(1, 0.3)',
          scrollTrigger: {
            trigger: '.features-grid',
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Parallax effect for feature icons
      gsap.to('.feature-icon', {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1
        }
      });

      // Continuous floating animation
      gsap.to('.feature-card', {
        y: '+=10',
        duration: 2,
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

  const features = [
    {
      icon: FiShield,
      title: "Credibility Based",
      description: "Your expertise and track record determine your voting weight and influence.",
      color: "text-blue-400",
      bg: "from-blue-400/10 to-blue-600/5"
    },
    {
      icon: FiZap,
      title: "Instant Recognition",
      description: "Get immediate feedback and rewards for your valuable insights and decisions.",
      color: "text-primary-400",
      bg: "from-primary-400/10 to-primary-600/5"
    },
    {
      icon: FiTrendingUp,
      title: "Knowledge Analytics",
      description: "Track your expertise growth and see how your insights impact outcomes.",
      color: "text-green-400",
      bg: "from-green-400/10 to-green-600/5"
    },
    {
      icon: FiUsers,
      title: "Expert Community",
      description: "Connect with knowledgeable individuals who value informed decision-making.",
      color: "text-purple-400",
      bg: "from-purple-400/10 to-purple-600/5"
    },
    {
      icon: FiLock,
      title: "Privacy Protected",
      description: "Your personal insights and voting patterns remain confidential and secure.",
      color: "text-orange-400",
      bg: "from-orange-400/10 to-orange-600/5"
    },
    {
      icon: FiBarChart2,
      title: "Insight Analytics",
      description: "Detailed analytics to help you understand and improve your decision-making skills.",
      color: "text-cyan-400",
      bg: "from-cyan-400/10 to-cyan-600/5"
    },
    {
      icon: FiGlobe,
      title: "Diverse Topics",
      description: "Share your expertise across technology, politics, sports, and more categories.",
      color: "text-pink-400",
      bg: "from-pink-400/10 to-pink-600/5"
    },
    {
      icon: FiAward,
      title: "Recognition System",
      description: "Build your reputation and earn recognition for your valuable insights.",
      color: "text-primary-400",
      bg: "from-primary-400/10 to-primary-600/5"
    }
  ];

  return (
    <>
      {/* Interactive Background Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <DotGrid
            dotSize={12}
            gap={25}
            baseColor="#f0b90b"
            activeColor="#ffe57a"
            proximity={150}
            shockRadius={300}
            shockStrength={12}
          />
        </div>
        
        <div className="relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8">
            <span className="text-gradient">Share Your Knowledge</span>
          </h2>
          <p className="text-xl text-secondary-300 max-w-2xl mx-auto">
            Turn your expertise into rewards through informed community decisions
          </p>
        </div>
      </section>

      <section ref={sectionRef} id="features" className="section-padding bg-gradient-to-b from-secondary-900 to-secondary-800 relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container-custom relative z-10">
          <div className="text-center mb-20">
            <h2 className="feature-title text-5xl md:text-6xl font-display font-bold mb-6 overflow-hidden">
              <span className="text-gradient">Knowledge-Based Platform</span>
            </h2>
            <p className="text-xl text-secondary-300 max-w-3xl mx-auto leading-relaxed">
              A platform where your expertise and informed decisions are valued and rewarded.
            </p>
          </div>

          <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16" style={{ perspective: '1000px' }}>
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="feature-card glass-effect p-8 rounded-3xl hover:bg-white/10 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}></div>
                
                <div className={`feature-icon w-20 h-20 bg-gradient-to-br ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative z-10`}>
                  <feature.icon className={`w-10 h-10 ${feature.color} group-hover:drop-shadow-lg transition-all duration-300`} />
                </div>
                
                <h3 className="text-xl font-bold mb-4 text-secondary-50 group-hover:text-primary-300 transition-colors duration-300 relative z-10">
                  {feature.title}
                </h3>
                
                <p className="text-secondary-400 leading-relaxed group-hover:text-secondary-200 transition-colors duration-300 relative z-10">
                  {feature.description}
                </p>

                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
                
                {/* Border glow */}
                <div className="absolute inset-0 rounded-3xl border border-transparent group-hover:border-primary-500/30 transition-colors duration-500"></div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button className="btn-primary text-lg px-12 py-6 relative group overflow-hidden">
              <span className="relative z-10">Explore All Features</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </section>
    </>
  );
};