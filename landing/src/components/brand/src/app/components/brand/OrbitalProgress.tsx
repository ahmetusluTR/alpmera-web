import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface OrbitalProgressProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showParticles?: boolean;
  children?: React.ReactNode;
}

export function OrbitalProgress({
  progress,
  size = 'md',
  label,
  showParticles = true,
  children
}: OrbitalProgressProps) {
  const [particles, setParticles] = useState<Array<{ id: number; angle: number }>>([]);

  const sizeConfig = {
    sm: { diameter: 120, strokeWidth: 3, particleCount: 4 },
    md: { diameter: 200, strokeWidth: 4, particleCount: 6 },
    lg: { diameter: 320, strokeWidth: 6, particleCount: 8 }
  };

  const config = sizeConfig[size];
  const radius = (config.diameter - config.strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  // Generate orbital particles
  useEffect(() => {
    if (showParticles) {
      const newParticles = Array.from({ length: config.particleCount }, (_, i) => ({
        id: i,
        angle: (360 / config.particleCount) * i
      }));
      setParticles(newParticles);
    }
  }, [config.particleCount, showParticles]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={config.diameter}
        height={config.diameter}
        className="transform -rotate-90"
      >
        <defs>
          {/* Glow filters */}
          <filter id={`glow-sapphire-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id={`glow-copper-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for progress ring */}
          <linearGradient id={`progress-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1B4D3E" />
            <stop offset="50%" stopColor="#C9A962" />
            <stop offset="100%" stopColor="#3A6B5A" />
          </linearGradient>
        </defs>

        {/* Background ring - Deep Sapphire */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          fill="none"
          stroke="#1B4D3E"
          strokeWidth={config.strokeWidth}
          opacity="0.15"
        />

        {/* Progress ring with glow */}
        <motion.circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          fill="none"
          stroke={`url(#progress-gradient-${size})`}
          strokeWidth={config.strokeWidth * (1 + progress / 100)}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          filter={`url(#glow-sapphire-${size})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progressOffset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Outer eucalyptus success ring - appears as progress increases */}
        {progress > 50 && (
          <motion.circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius + config.strokeWidth + 4}
            fill="none"
            stroke="#3A6B5A"
            strokeWidth={2}
            strokeDasharray="4 6"
            opacity={0.3 + (progress - 50) / 100}
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.3 + (progress - 50) / 100, rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        )}

        {/* Matte copper accent ring */}
        {progress > 25 && (
          <motion.circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius - config.strokeWidth - 4}
            fill="none"
            stroke="#C9A962"
            strokeWidth={1.5}
            strokeDasharray="2 8"
            opacity={0.4}
            filter={`url(#glow-copper-${size})`}
            initial={{ rotate: 0 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
        )}
      </svg>

      {/* Orbital particles */}
      {showParticles && particles.map((particle) => {
        const angle = (particle.angle + (progress * 3.6)) * (Math.PI / 180);
        const x = config.diameter / 2 + Math.cos(angle) * radius;
        const y = config.diameter / 2 + Math.sin(angle) * radius;
        
        return (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: progress > 70 ? '#3A6B5A' : '#C9A962',
              boxShadow: progress > 70 
                ? '0 0 8px rgba(58, 107, 90, 0.6)' 
                : '0 0 8px rgba(201, 169, 98, 0.6)',
              left: x - 4,
              top: y - 4,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: particle.id * 0.2,
            }}
          />
        );
      })}

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
        {label && (
          <div className="text-center mt-2">
            <p className="text-sm opacity-60" style={{ fontFamily: 'var(--font-sans)' }}>
              {label}
            </p>
            <p className="text-2xl" style={{ fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}