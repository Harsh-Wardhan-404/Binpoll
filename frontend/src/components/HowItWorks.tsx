import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { FiSearch, FiTrendingUp, FiAward, FiArrowRight } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';

export const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Simple animations
    gsap.fromTo('.how-title', 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, delay: 0.3 }
    );

    gsap.fromTo('.step-card', 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, delay: 0.5 }
    );
  }, []);

  const steps = [
    {
      number: 1,
      icon: FaWallet,
      title: "Connect Your Wallet",
      description: "Connect your MetaMask wallet to the BNB Testnet and authenticate securely."
    },
    {
      number: 2,
      icon: FiSearch,
      title: "Browse Topics",
      description: "Explore various topics and questions across different categories that interest you."
    },
    {
      number: 3,
      icon: FiTrendingUp,
      title: "Share Your Insights",
      description: "Use your expertise to make informed decisions and share your valuable perspective."
    },
    {
      number: 4,
      icon: FiAward,
      title: "Earn Recognition",
      description: "Build your credibility and earn rewards when your insights prove valuable."
    }
  ];

    return (
    <section ref={sectionRef} id="how-it-works" className="section-padding bg-secondary-900">
      <div className="container-custom">
        <div className="text-center mb-20">
          <h2 className="how-title text-5xl md:text-6xl font-display font-bold mb-6">
            How <span className="text-gradient">Knowledge Rewards</span> Work
          </h2>
          <p className="text-xl text-secondary-300 max-w-3xl mx-auto">
            Start sharing your expertise and earning recognition in just four simple steps.
            Designed for both newcomers and experienced professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="step-card text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 mx-auto rounded-full glass-effect flex items-center justify-center">
                  <step.icon className="w-10 h-10 text-primary-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 text-secondary-900 rounded-full flex items-center justify-center font-bold text-sm">
                  {step.number}
                </div>
              </div>

              <div className="glass-effect p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 text-secondary-50">
                  {step.title}
                </h3>
                <p className="text-secondary-400 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="flex justify-center mt-8 lg:hidden">
                  <FiArrowRight className="w-6 h-6 text-primary-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-20">
          <button className="btn-primary text-lg px-12 py-5 flex items-center space-x-3 mx-auto">
            <span>Start Your Journey</span>
            <FiArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
