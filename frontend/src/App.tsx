import { useEffect, useState } from 'react';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { InteractiveSection } from './components/InteractiveSection';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { Stats } from './components/Stats';
import { CTA } from './components/CTA';
import { Footer } from './components/Footer';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';



function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'profile'>('home');
  
  // Initialize smooth scroll
  useSmoothScroll();

  useEffect(() => {
    // Add a loading screen fade out effect
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add('fade-out');
      }, 500);
    }

    // Prevent flash of unstyled content
    document.body.style.visibility = 'visible';
    
    // Add cursor glow effect
    const cursor = document.querySelector('.cursor-glow');
    if (!cursor) {
      const cursorElement = document.createElement('div');
      cursorElement.className = 'cursor-glow';
      document.body.appendChild(cursorElement);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const cursorGlow = document.querySelector('.cursor-glow') as HTMLElement;
      if (cursorGlow) {
        cursorGlow.style.left = e.clientX + 'px';
        cursorGlow.style.top = e.clientY + 'px';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="App">
      {/* Cursor glow effect */}
      <style>{`
        .cursor-glow {
          position: fixed;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(240, 185, 11, 0.3) 0%, transparent 70%);
          pointer-events: none;
          transform: translate(-50%, -50%);
          z-index: 9999;
          transition: all 0.1s ease;
        }
        
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #0a0a0b;
          z-index: 10000;
          transition: opacity 0.5s ease;
        }
        
        .loading-screen.fade-out {
          opacity: 0;
          pointer-events: none;
        }
        
        body {
          visibility: hidden;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1a1a1b;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #f0b90b 0%, #ffe57a 100%);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #e6a000 0%, #ffd844 100%);
        }

        /* Selection styles */
        ::selection {
          background: rgba(240, 185, 11, 0.2);
          color: #fff;
        }
        
        ::-moz-selection {
          background: rgba(240, 185, 11, 0.2);
          color: #fff;
        }
      `}</style>

      <Navigation onNavigate={setCurrentPage} currentPage={currentPage} />
      
      {currentPage === 'home' ? (
        <main>
          <Hero />
          <InteractiveSection />
          <Features />
          <HowItWorks />
          <Stats />
          <CTA />
        </main>
      ) : currentPage === 'dashboard' ? (
        <Dashboard />
      ) : (
        <Profile />
      )}
      
      {currentPage === 'home' && <Footer />}
    </div>
  );
}

export default App;
