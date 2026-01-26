import React from 'react';

interface AlpmeraStatusTagProps {
  status: 'success' | 'info' | 'warning' | 'error' | 'progress';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export function AlpmeraStatusTag({ 
  status, 
  children,
  size = 'md' 
}: AlpmeraStatusTagProps) {
  const statusConfig = {
    success: {
      bg: '#3A6B5A',
      text: '#E8DED1',
      border: '#4d8170'
    },
    info: {
      bg: '#1B4D3E',
      text: '#E8DED1',
      border: '#2a6350'
    },
    warning: {
      bg: '#C9A962',
      text: '#E8DED1',
      border: '#d4b87d'
    },
    error: {
      bg: '#8B3A3A',
      text: '#E8DED1',
      border: '#a04848'
    },
    progress: {
      bg: '#E8DED1',
      text: '#1B4D3E',
      border: '#1B4D3E'
    }
  };

  const config = statusConfig[status];
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizeClasses[size]}
        rounded-md
        border
      `}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        letterSpacing: '0.02em'
      }}
    >
      {/* Status indicator dot */}
      <span 
        className={`w-1.5 h-1.5 rounded-full ${status === 'progress' ? 'animate-pulse' : ''}`}
        style={{ 
          backgroundColor: status === 'progress' ? config.border : config.text,
          boxShadow: status === 'progress' ? `0 0 4px ${config.border}` : 'none'
        }}
      />
      {children}
    </span>
  );
}

interface AlpmeraBadgeProps {
  variant?: 'default' | 'outline' | 'copper';
  children: React.ReactNode;
  className?: string;
}

export function AlpmeraBadge({ 
  variant = 'default',
  children,
  className = ''
}: AlpmeraBadgeProps) {
  const variantStyles = {
    default: {
      bg: '#1B4D3E',
      text: '#E8DED1',
      border: 'transparent'
    },
    outline: {
      bg: 'transparent',
      text: '#1B4D3E',
      border: '#1B4D3E'
    },
    copper: {
      bg: '#C9A962',
      text: '#E8DED1',
      border: 'transparent'
    }
  };

  const style = variantStyles[variant];

  return (
    <span
      className={`
        inline-block
        px-2.5 py-1
        text-xs
        rounded-full
        border
        ${className}
      `}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
    >
      {children}
    </span>
  );
}