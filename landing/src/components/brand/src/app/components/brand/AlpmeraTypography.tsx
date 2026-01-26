import React from 'react';

interface HeadingProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'condensed' | 'caps';
}

export function AlpmeraH1({ children, className = '', variant = 'default' }: HeadingProps) {
  return (
    <h1
      className={`
        ${variant === 'condensed' ? 'tracking-tighter' : 'tracking-tight'}
        ${variant === 'caps' ? 'uppercase' : ''}
        ${className}
      `}
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: variant === 'condensed' ? '4.5rem' : '3.5rem',
        fontWeight: 400,
        lineHeight: variant === 'condensed' ? 1.1 : 1.2,
        color: '#0F2043',
        letterSpacing: variant === 'condensed' ? '-0.04em' : '-0.02em'
      }}
    >
      {children}
    </h1>
  );
}

export function AlpmeraH2({ children, className = '', variant = 'default' }: HeadingProps) {
  return (
    <h2
      className={`
        ${variant === 'condensed' ? 'tracking-tighter' : 'tracking-tight'}
        ${variant === 'caps' ? 'uppercase' : ''}
        ${className}
      `}
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: variant === 'condensed' ? '3rem' : '2.5rem',
        fontWeight: 400,
        lineHeight: 1.3,
        color: '#0F2043',
        letterSpacing: variant === 'condensed' ? '-0.03em' : '-0.02em'
      }}
    >
      {children}
    </h2>
  );
}

export function AlpmeraH3({ children, className = '', variant = 'default' }: HeadingProps) {
  return (
    <h3
      className={`
        ${variant === 'condensed' ? 'tracking-tighter' : 'tracking-tight'}
        ${variant === 'caps' ? 'uppercase' : ''}
        ${className}
      `}
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '2rem',
        fontWeight: 400,
        lineHeight: 1.4,
        color: '#0F2043',
        letterSpacing: '-0.01em'
      }}
    >
      {children}
    </h3>
  );
}

interface BodyTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'base' | 'lg';
}

export function AlpmeraBodyText({ children, className = '', size = 'base' }: BodyTextProps) {
  const sizeMap = {
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem'
  };

  return (
    <p
      className={className}
      style={{
        fontFamily: 'var(--font-sans)',
        fontSize: sizeMap[size],
        fontWeight: 400,
        lineHeight: 1.7,
        color: '#0F2043',
        opacity: 0.9
      }}
    >
      {children}
    </p>
  );
}

interface DataLabelProps {
  label: string;
  value: string | number;
  className?: string;
}

export function AlpmeraDataLabel({ label, value, className = '' }: DataLabelProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#0F2043',
          opacity: 0.6
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#0F2043',
          marginTop: '0.25rem',
          letterSpacing: '-0.01em'
        }}
      >
        {value}
      </span>
    </div>
  );
}

interface MetricDisplayProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function AlpmeraMetricDisplay({ 
  value, 
  label, 
  trend,
  trendValue 
}: MetricDisplayProps) {
  const trendColors = {
    up: '#4A5D4E',
    down: '#8B3A3A',
    neutral: '#0F2043'
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#0F2043',
            lineHeight: 1,
            letterSpacing: '-0.02em'
          }}
        >
          {value}
        </span>
        {trend && trendValue && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: trendColors[trend]
            }}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#0F2043',
          opacity: 0.6,
          marginTop: '0.25rem'
        }}
      >
        {label}
      </span>
    </div>
  );
}
