import React from 'react';

interface AlpmeraLogoProps {
  variant?: 'primary' | 'tagline' | 'favicon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AlpmeraLogo({ 
  variant = 'primary', 
  size = 'md',
  className = ''
}: AlpmeraLogoProps) {
  const wordmarkSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const faviconSizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  };

  // Primary Wordmark - Clean "ALPMERA" in Libre Baskerville
  const PrimaryWordmark = () => (
    <div 
      className={`${wordmarkSizeClasses[size]} ${className}`}
      style={{ 
        fontFamily: 'Libre Baskerville, serif',
        fontWeight: 400,
        letterSpacing: '0.1em',
        color: '#1B4D3E',
        textTransform: 'uppercase'
      }}
    >
      ALPMERA
    </div>
  );

  // Wordmark with Tagline
  const WordmarkWithTagline = () => (
    <div className={`flex flex-col ${className}`}>
      <div 
        className={wordmarkSizeClasses[size]}
        style={{ 
          fontFamily: 'Libre Baskerville, serif',
          fontWeight: 400,
          letterSpacing: '0.1em',
          color: '#1B4D3E',
          textTransform: 'uppercase'
        }}
      >
        ALPMERA
      </div>
      <div 
        className="mt-1"
        style={{ 
          fontFamily: 'Inter, sans-serif',
          fontSize: size === 'sm' ? '0.5rem' : size === 'md' ? '0.625rem' : size === 'lg' ? '0.75rem' : '0.875rem',
          letterSpacing: '0.05em',
          color: '#5A5A5A',
          textTransform: 'uppercase',
          fontWeight: 500
        }}
      >
        COLLECTIVE BUYING OPERATOR
      </div>
    </div>
  );

  // Favicon - Simple "A" letter
  const Favicon = () => (
    <div 
      className={`${faviconSizeClasses[size]} ${className} flex items-center justify-center`}
      style={{ 
        fontFamily: 'Libre Baskerville, serif',
        fontWeight: 400,
        color: '#1B4D3E'
      }}
    >
      A
    </div>
  );

  switch (variant) {
    case 'primary':
      return <PrimaryWordmark />;
    case 'tagline':
      return <WordmarkWithTagline />;
    case 'favicon':
      return <Favicon />;
    default:
      return <PrimaryWordmark />;
  }
}