import { useState } from "react";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Safety", href: "#safety" },
  { label: "FAQ", href: "#faq" },
  { label: "Notify me", href: "#notify" },
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
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-copper focus:text-brand-cloud focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="text-lg font-semibold tracking-tight text-brand-sapphire">
            Alpmera
          </a>
          <nav className="hidden items-center gap-6 text-sm text-brand-slate md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-brand-sapphire">
                {link.label}
              </a>
            ))}
          </nav>
          <button
            className="md:hidden text-sm text-brand-slate flex flex-col gap-1 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="h-0.5 w-5 bg-brand-slate transition-all" />
            <span className="h-0.5 w-5 bg-brand-slate transition-all" />
            <span className="h-0.5 w-5 bg-brand-slate transition-all" />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-brand-ink/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="absolute right-0 top-0 h-full w-64 bg-background border-l border-border p-6 flex flex-col gap-4">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="self-end text-brand-slate text-2xl leading-none"
              aria-label="Close menu"
            >
              ×
            </button>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-brand-slate hover:text-brand-sapphire py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}

      <main id="main-content">{children}</main>

      <footer className="border-t border-border bg-background px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-brand-slate md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p>Alpmera operates campaign-based collective participation with explicit rules.</p>
            <p>Seattle metropolitan area (initial focus)</p>
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-brand-sapphire">
              Privacy
            </a>
            <a href="/terms" className="hover:text-brand-sapphire">
              Terms
            </a>
            <a href="mailto:hello@alpmera.com" className="hover:text-brand-sapphire">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
