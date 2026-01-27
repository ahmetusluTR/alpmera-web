import { useRef, useState, MouseEvent, ReactNode } from "react";
import { motion } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
}

export function MagneticButton({
  children,
  href,
  variant = "primary",
  className = ""
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance from center
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    // Apply magnetic effect (move button towards cursor, but not too much)
    const magnetStrength = 0.3;
    setPosition({
      x: distanceX * magnetStrength,
      y: distanceY * magnetStrength
    });
  };

  const handleMouseLeave = () => {
    // Reset position with spring animation
    setPosition({ x: 0, y: 0 });
  };

  const baseClasses = "inline-flex items-center justify-center rounded-md px-8 py-4 text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    primary: "bg-alpmera-primary text-white hover:bg-opacity-90 focus:ring-alpmera-primary btn-depth shadow-lg",
    secondary: "border-2 border-alpmera-primary text-alpmera-primary hover:bg-alpmera-primary hover:text-white focus:ring-alpmera-primary"
  };

  return (
    <motion.a
      ref={buttonRef}
      href={href}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: position.x,
        y: position.y
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        mass: 0.5
      }}
    >
      {children}
    </motion.a>
  );
}
