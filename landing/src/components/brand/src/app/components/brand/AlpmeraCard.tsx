import React from 'react';

interface AlpmeraCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'blueprint' | 'elevated';
  className?: string;
}

export function AlpmeraCard({ 
  children, 
  variant = 'default',
  className = '' 
}: AlpmeraCardProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Blueprint background pattern for data-heavy sections */}
      {variant === 'blueprint' && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(27, 77, 62, 0.05) 25%, rgba(27, 77, 62, 0.05) 26%, transparent 27%, transparent 74%, rgba(27, 77, 62, 0.05) 75%, rgba(27, 77, 62, 0.05) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(27, 77, 62, 0.05) 25%, rgba(27, 77, 62, 0.05) 26%, transparent 27%, transparent 74%, rgba(27, 77, 62, 0.05) 75%, rgba(27, 77, 62, 0.05) 76%, transparent 77%, transparent)
            `,
            backgroundSize: '50px 50px',
            backgroundPosition: '0 0'
          }}
        />
      )}

      {/* Blueprint technical notation lines */}
      {variant === 'blueprint' && (
        <>
          {/* Horizontal margin line */}
          <div 
            className="absolute left-0 top-8 w-full h-px opacity-[0.04]"
            style={{ background: '#1B4D3E' }}
          />
          {/* Vertical margin line */}
          <div 
            className="absolute left-8 top-0 w-px h-full opacity-[0.04]"
            style={{ background: '#1B4D3E' }}
          />
        </>
      )}

      {/* Matte paper texture */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'2\' numOctaves=\'3\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
          backgroundSize: '100px 100px',
          mixBlendMode: 'multiply',
          opacity: 0.4
        }}
      />

      {/* Card content with appropriate styling */}
      <div 
        className={`
          relative z-10 
          ${variant === 'elevated' 
            ? 'bg-white shadow-[0_8px_24px_rgba(27,77,62,0.12)] backdrop-blur-sm' 
            : 'bg-white/80 shadow-[0_2px_8px_rgba(27,77,62,0.08)]'
          }
          rounded-lg
          p-6
        `}
      >
        {children}
      </div>
    </div>
  );
}