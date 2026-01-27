import { ButtonHTMLAttributes, ReactNode, useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if screen is mobile-sized (less than 768px)
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const baseClasses = "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-alpmera-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-alpmera-accent text-white btn-depth",
    secondary: "text-alpmera-primary hover:text-alpmera-accent"
  };

  // Reduce animation complexity on mobile for better performance
  const animationProps = isMobile
    ? {
        whileTap: { scale: 0.98 },
        transition: { duration: 0.1 }
      }
    : {
        whileHover: { scale: 1.02, y: -2 },
        whileTap: { scale: 0.98, y: 0 },
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 17
        }
      };

  return (
    <motion.button
      {...animationProps}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {typeof children === "string" ? "Submitting..." : children}
        </span>
      ) : children}
    </motion.button>
  );
}
