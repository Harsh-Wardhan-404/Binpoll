import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  strength = 0.3,
  className = '',
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const text = textRef.current;
    
    if (!button || !text) return;

    let bounds: DOMRect;

    const handleMouseMove = (e: MouseEvent) => {
      bounds = button.getBoundingClientRect();
      const x = e.clientX - bounds.left - bounds.width / 2;
      const y = e.clientY - bounds.top - bounds.height / 2;

      gsap.to(button, {
        duration: 0.3,
        x: x * strength,
        y: y * strength,
        ease: 'power2.out'
      });

      gsap.to(text, {
        duration: 0.3,
        x: x * strength * 0.5,
        y: y * strength * 0.5,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      gsap.to([button, text], {
        duration: 0.6,
        x: 0,
        y: 0,
        ease: 'elastic.out(1, 0.3)'
      });
    };

    const handleMouseEnter = () => {
      bounds = button.getBoundingClientRect();
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      <span ref={textRef} className="relative z-10 block">
        {children}
      </span>
    </button>
  );
};
