import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "highlight" | "subtle";
  hover?: boolean;
}

export default function Card({
  children,
  className = "",
  variant = "default",
  hover = false
}: CardProps) {
  const baseClasses = "rounded-lg border p-6 shadow-soft card-texture transition-all duration-[var(--motion-standard)]";

  const variantClasses = {
    default: "border-card-border bg-card",
    highlight: "border-alpmera-success bg-card ring-1 ring-alpmera-success/10",
    subtle: "border-border bg-background"
  };

  const hoverClass = hover ? "hover:-translate-y-1 hover:shadow-calm cursor-pointer" : "";

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}
