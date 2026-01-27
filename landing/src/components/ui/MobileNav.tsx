import { useEffect } from "react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Safety", href: "#safety" },
  { label: "FAQ", href: "#faq" },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Trap focus within menu when open
  useEffect(() => {
    if (!isOpen) return;

    const menu = document.getElementById("mobile-menu");
    if (!menu) return;

    const focusableElements = menu.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-alpmera-primary/40 backdrop-blur-sm z-40 mobile-nav-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <nav
        id="mobile-menu"
        className="fixed top-0 right-0 bottom-0 w-[280px] bg-white z-50 shadow-2xl mobile-nav-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between p-6 border-b border-alpmera-border">
          <span className="text-lg font-semibold text-alpmera-primary font-display">
            Menu
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-alpmera-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-alpmera-primary"
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6 text-alpmera-text"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col p-6 space-y-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className="flex items-center min-h-[44px] px-4 py-3 rounded-md text-alpmera-text hover:bg-alpmera-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-alpmera-primary font-body"
            >
              {link.label}
            </a>
          ))}

          {/* Divider */}
          <div className="h-px bg-alpmera-border my-4" />

          {/* Action Buttons */}
          <a
            href="#early-access"
            onClick={handleLinkClick}
            className="flex items-center justify-center min-h-[44px] px-4 py-3 rounded-md bg-alpmera-primary text-white font-semibold hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-primary focus:ring-offset-2"
          >
            Join Early List
          </a>

          <a
            href="/demand"
            onClick={handleLinkClick}
            className="flex items-center justify-center min-h-[44px] px-4 py-3 rounded-md bg-alpmera-accent text-white font-semibold hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-accent focus:ring-offset-2"
          >
            Suggest a Product
          </a>

          <a
            href="/product-requests"
            onClick={handleLinkClick}
            className="flex items-center justify-center min-h-[44px] px-4 py-3 rounded-md border-2 border-alpmera-primary text-alpmera-primary font-semibold hover:bg-alpmera-primary hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-primary focus:ring-offset-2"
          >
            Product Requests
          </a>
        </div>
      </nav>
    </>
  );
}
