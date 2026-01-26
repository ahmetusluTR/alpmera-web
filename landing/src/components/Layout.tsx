import { useState } from "react";

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Safety", href: "/#safety" },
  { label: "FAQ", href: "/#faq" },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-alpmera-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a
            href="/"
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="text-lg font-semibold tracking-tight text-alpmera-primary font-display cursor-pointer hover:opacity-80 transition-opacity"
          >
            ALPMERA
          </a>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-alpmera-text-light hover:text-alpmera-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/#early-access"
              className="rounded-md bg-alpmera-primary px-4 py-2 text-white font-semibold hover:bg-opacity-90 transition-all"
            >
              Join Early List
            </a>
            <a
              href="/demand"
              className="rounded-md bg-alpmera-accent px-4 py-2 text-white font-semibold hover:bg-opacity-90 transition-all"
            >
              Suggest a Product
            </a>
            <a
              href="/product-requests"
              className="rounded-md border-2 border-alpmera-primary bg-transparent px-4 py-2 text-alpmera-primary font-semibold hover:bg-alpmera-primary hover:text-white transition-all"
            >
              Product Requests
            </a>
          </nav>
          <button
            className="md:hidden text-sm text-alpmera-text-light flex flex-col gap-1 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="h-0.5 w-5 bg-alpmera-text-light transition-all" />
            <span className="h-0.5 w-5 bg-alpmera-text-light transition-all" />
            <span className="h-0.5 w-5 bg-alpmera-text-light transition-all" />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-alpmera-text/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="absolute right-0 top-0 h-full w-64 bg-background border-l border-border p-6 flex flex-col gap-4">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="self-end text-alpmera-text-light text-2xl leading-none"
              aria-label="Close menu"
            >
              ×
            </button>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-alpmera-text-light hover:text-alpmera-primary py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/#early-access"
              className="rounded-md bg-alpmera-primary px-4 py-2 text-white font-semibold text-center hover:bg-opacity-90 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Join Early List
            </a>
            <a
              href="/demand"
              className="rounded-md bg-alpmera-accent px-4 py-2 text-white font-semibold text-center hover:bg-opacity-90 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Suggest a Product
            </a>
            <a
              href="/product-requests"
              className="rounded-md border-2 border-alpmera-primary px-4 py-2 text-alpmera-primary font-semibold text-center hover:bg-alpmera-primary hover:text-white transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Product Requests
            </a>
          </nav>
        </div>
      )}

      <main id="main-content">{children}</main>

      <footer className="border-t border-border bg-background px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-alpmera-text-light md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p>Alpmera operates campaign-based collective participation with explicit rules.</p>
            <p>Seattle metropolitan area (initial focus)</p>
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-alpmera-primary">
              Privacy
            </a>
            <a href="/terms" className="hover:text-alpmera-primary">
              Terms
            </a>
            <a href="mailto:hello@alpmera.com" className="hover:text-alpmera-primary">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
