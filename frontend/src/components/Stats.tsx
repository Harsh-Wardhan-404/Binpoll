import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { FiTrendingUp, FiUsers, FiShield, FiZap } from 'react-icons/fi';

export const Stats = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Simple animations
    gsap.fromTo('.stats-title', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, delay: 0.3 }
    );

    gsap.fromTo('.stats-card', 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, delay: 0.5 }
    );
  }, []);

  const stats = [
    {
      icon: FiTrendingUp,
      value: '$2.5M+',
      label: 'Total Volume Locked',
      description: 'Secured in smart contracts'
    },
    {
      icon: FiUsers,
      value: '150K+',
      label: 'Active Predictions',
      description: 'Across all markets'
    },
    {
      icon: FiShield,
      value: '89%',
      label: 'Accuracy Rate',
      description: 'Community prediction success'
    },
    {
      icon: FiZap,
      value: '50K+',
      label: 'Global Users',
      description: 'From 100+ countries'
    }
  ];

  return (
    <section ref={sectionRef} className="section-padding bg-gradient-to-r from-secondary-800 via-secondary-900 to-secondary-800">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="stats-title text-5xl md:text-6xl font-display font-bold mb-6">
            <span className="text-gradient">Proven Results</span>
          </h2>
          <p className="text-xl text-secondary-300 max-w-3xl mx-auto">
            Join thousands of users who trust Binpoll with their predictions and investments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="stats-card text-center glass-effect p-8 rounded-3xl hover:bg-white/10 transition-all duration-300"
            >
              <stat.icon className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              
              <div className="text-4xl font-bold text-gradient mb-2">
                {stat.value}
              </div>

              <h3 className="text-xl font-bold mb-2 text-secondary-50">
                {stat.label}
              </h3>

              <p className="text-secondary-400">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};