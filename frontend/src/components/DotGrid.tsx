import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  shockRadius?: number;
  shockStrength?: number;
  resistance?: number;
  returnDuration?: number;
}

export const DotGrid: React.FC<DotGridProps> = ({
  dotSize = 10,
  gap = 15,
  baseColor = '#f0b90b',
  activeColor = '#ffe57a',
  proximity = 120,
  shockRadius = 250,
  shockStrength = 5,
  resistance = 750,
  returnDuration = 1.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = useState<any[]>([]);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const animationId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      initializeDots();
    };

    const initializeDots = () => {
      const newDots: any[] = [];
      const cols = Math.floor(canvas.width / (dotSize + gap));
      const rows = Math.floor(canvas.height / (dotSize + gap));
      
      const offsetX = (canvas.width - (cols * (dotSize + gap) - gap)) / 2;
      const offsetY = (canvas.height - (rows * (dotSize + gap) - gap)) / 2;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const x = offsetX + j * (dotSize + gap) + dotSize / 2;
          const y = offsetY + i * (dotSize + gap) + dotSize / 2;
          
          newDots.push({
            x,
            y,
            originalX: x,
            originalY: y,
            currentX: x,
            currentY: y,
            scale: 1,
            opacity: 0.3,
            targetScale: 1,
            targetOpacity: 0.3,
          });
        }
      }
      setDots(newDots);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mousePos.current = { x: -1000, y: -1000 };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach((dot) => {
        const distance = Math.sqrt(
          Math.pow(mousePos.current.x - dot.x, 2) + 
          Math.pow(mousePos.current.y - dot.y, 2)
        );

        // Proximity effect
        if (distance < proximity) {
          const effect = 1 - distance / proximity;
          dot.targetScale = 1 + effect * 0.8;
          dot.targetOpacity = 0.3 + effect * 0.7;

          // Displacement effect
          if (distance < shockRadius && distance > 0) {
            const angle = Math.atan2(
              dot.y - mousePos.current.y,
              dot.x - mousePos.current.x
            );
            const force = (1 - distance / shockRadius) * shockStrength;
            dot.currentX = dot.originalX + Math.cos(angle) * force;
            dot.currentY = dot.originalY + Math.sin(angle) * force;
          }
        } else {
          dot.targetScale = 1;
          dot.targetOpacity = 0.3;
          
          // Return to original position
          dot.currentX += (dot.originalX - dot.currentX) * 0.1;
          dot.currentY += (dot.originalY - dot.currentY) * 0.1;
        }

        // Smooth transitions
        dot.scale += (dot.targetScale - dot.scale) * 0.15;
        dot.opacity += (dot.targetOpacity - dot.opacity) * 0.15;

        // Draw dot
        ctx.save();
        ctx.translate(dot.currentX, dot.currentY);
        ctx.scale(dot.scale, dot.scale);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, dotSize / 2);
        gradient.addColorStop(0, `${activeColor}${Math.floor(dot.opacity * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${baseColor}${Math.floor(dot.opacity * 255).toString(16).padStart(2, '0')}`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animationId.current = requestAnimationFrame(animate);
    };

    // Initialize
    updateCanvasSize();
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', updateCanvasSize);
    
    animate();

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', updateCanvasSize);
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [dots.length, dotSize, gap, baseColor, activeColor, proximity, shockRadius, shockStrength]);

  return (
    <div ref={containerRef} className="dot-grid">
      <div className="dot-grid__wrap">
        <canvas ref={canvasRef} className="dot-grid__canvas" />
      </div>
    </div>
  );
};
