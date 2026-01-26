import React, { useState } from 'react';
import { motion } from 'motion/react';

interface AlpmeraButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AlpmeraButton({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = ''
}: AlpmeraButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantStyles = {
    primary: {
      base: 'bg-[#C9A962] text-[#E8DED1]',
      shadow: 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_4px_12px_rgba(201,169,98,0.3)]',
      pressed: 'shadow-[inset_0_4px_8px_rgba(0,0,0,0.3),0_1px_3px_rgba(201,169,98,0.2)]',
      hover: 'hover:bg-[#d4b87d]'
    },
    secondary: {
      base: 'bg-[#E8DED1] text-[#1B4D3E] border-2 border-[#1B4D3E]',
      shadow: 'shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_2px_8px_rgba(27,77,62,0.2)]',
      pressed: 'shadow-[inset_0_3px_6px_rgba(27,77,62,0.2),0_1px_2px_rgba(27,77,62,0.1)]',
      hover: 'hover:bg-[#ddd0be]'
    },
    ghost: {
      base: 'bg-transparent text-[#1B4D3E] border border-[#1B4D3E]',
      shadow: '',
      pressed: 'shadow-[inset_0_2px_4px_rgba(27,77,62,0.15)]',
      hover: 'hover:bg-[#E8DED1]'
    }
  };

  const style = variantStyles[variant];

  return (
    <motion.button
      className={`
        ${sizeClasses[size]}
        ${style.base}
        ${style.hover}
        ${isPressed ? style.pressed : style.shadow}
        rounded-md
        transition-all
        duration-150
        relative
        overflow-hidden
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        letterSpacing: '0.02em'
      }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98, y: 2 } : {}}
      animate={{
        y: isPressed ? 2 : 0,
      }}
      transition={{ duration: 0.1 }}
    >
      {/* Physical seal effect - subtle highlight */}
      {variant === 'primary' && (
        <div 
          className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"
          style={{ opacity: isPressed ? 0.05 : 0.15 }}
        />
      )}
      
      {/* Matte texture overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px',
          mixBlendMode: 'overlay',
          opacity: 0.3
        }}
      />
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}