import { useState, useEffect } from "react";
import { motion, MotionConfig } from "framer-motion";
import { subscribeToEarlyList } from "./lib/api";
import { checkRateLimit, formatRemainingTime } from "./lib/rateLimit";
import { HoneypotField } from "./components/forms/HoneypotField";
import { AlpmeraBatchFlow } from "./components/brand/AlpmeraBatchFlow";
import { MobileNav } from "./components/ui/MobileNav";
import { MagneticButton } from "./components/ui/MagneticButton";
import { FAQItem } from "./components/ui/FAQItem";
import { TrustStats } from "./components/brand/TrustStats";
import { MockCampaign } from "./components/brand/MockCampaign";
import { MoneyFlowDiagram } from "./components/brand/MoneyFlowDiagram";

const VIDEO_ID = "PLACEHOLDER"; // Replace with actual YouTube ID when ready

const INTEREST_TAGS = [
  "Electronics",
  "Kitchen Appliances",
  "Home Appliances",
  "Office",
  "Tools",
  "Outdoor",
  "Other",
];

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Safety", href: "#safety" },
  { label: "FAQ", href: "#faq" },
];

const ALPMERA_IS = [
  "A trust-first campaign operator",
  "A way to pool real demand",
  "Escrow-protected commitments",
  "Clear outcomes: completion or refund",
];

const ALPMERA_IS_NOT = [
  "A store",
  "A marketplace",
  "A deal site",
  "A system built on urgency or hype",
];

const SAFETY_CARDS = [
  {
    title: "Escrow protection",
    body: "All committed funds remain in escrow until campaign conditions are met. No exceptions.",
  },
  {
    title: "Explicit state changes",
    body: "Every campaign transition is visible and communicated. No silent changes.",
  },
  {
    title: "Clear exit paths with refunds",
    body: "If a campaign doesn't complete, participants receive their full commitment back. No penalties.",
  },
];

const FAQS = [
  {
    q: "What is Alpmera?",
    a: "Alpmera is a trust-first collective buying platform for consumers. Instead of buying alone, people join campaigns, commit funds to escrow, and move forward together only when the campaign makes sense for everyone. Alpmera is not a store and does not sell products.",
    category: "general" as const,
  },
  {
    q: "How is Alpmera different from online stores or deal sites?",
    a: "Traditional stores sell products immediately. Alpmera works differently: You join a campaign instead of buying instantly. Your funds stay protected in escrow. The campaign moves forward only if enough people participate. If it doesn't work out, you get a refund. There is no fake urgency, no flash sales, and no pressure to act fast.",
  },
  {
    q: "Who is Alpmera for?",
    a: "Alpmera is for individual consumers, including: People willing to wait a bit for a better collective outcome, families, neighborhoods, parent groups, and hobbyist communities. Alpmera is not designed for businesses, wholesale buyers, or corporate procurement groups.",
  },
  {
    q: "What does it mean to \"join a campaign\"?",
    a: "Joining a campaign means you're signaling real interest in a product by committing funds to escrow. You're not placing an order. You're not buying yet. You're saying: \"If enough people join, I'm in.\"",
  },
  {
    q: "Is my money safe?",
    a: "Yes. Your funds are held in escrow-style protection and are not released unless the campaign succeeds under its stated rules. If the campaign fails or is canceled, your funds are refunded according to the campaign terms.",
  },
  {
    q: "When does Alpmera release funds?",
    a: "Funds are released only after: The campaign reaches its target, the supplier accepts the campaign, and all conditions are clearly met. Until then, your funds remain protected.",
  },
  {
    q: "What happens if a campaign doesn't succeed?",
    a: "If a campaign fails: It is clearly closed, no fulfillment happens, and your committed funds are refunded. Failure is treated as a normal outcome, not a problem to hide.",
  },
  {
    q: "Who handles delivery and fulfillment?",
    a: "Alpmera does. During Phase 1 and Phase 2: Alpmera designs the campaign, coordinates with suppliers, manages fulfillment, and handles refunds if needed. You never have to negotiate with suppliers directly.",
  },
  {
    q: "Why does Alpmera take longer than buying online?",
    a: "Because Alpmera prioritizes fairness and protection over speed. Collective buying takes time: People need time to join, campaigns need to reach viability, and suppliers need clear, confirmed demand. If speed matters more than protection, traditional stores may be a better fit.",
  },
  {
    q: "Are there any guarantees?",
    a: "No implicit guarantees. Every campaign clearly states: What needs to happen for success, what happens if it fails, and expected timelines (with uncertainty explained). Alpmera avoids overpromising and always explains the worst-case scenario upfront.",
  },
  {
    q: "Does Alpmera offer discounts?",
    a: "Alpmera does not offer discounts. Better pricing comes from real collective demand, not promotions or coupons. Pricing is the outcome of people joining together — not a marketing trick.",
  },
  {
    q: "Why should I trust Alpmera?",
    a: "Because Alpmera is built around a simple rule: Trust is created by clear rules and honest outcomes — especially when things fail. No hidden steps, no silent changes, no pressure tactics. If something changes, you're informed. If something fails, you're protected.",
  },
  {
    q: "Is Alpmera live yet?",
    a: "Alpmera is currently launching in controlled phases. Early users help shape: Which campaigns run, how the experience improves, and what categories expand next. You're joining early — thoughtfully, not experimentally.",
  },
  {
    q: "What happens after I join a campaign?",
    a: "You'll be able to: Track campaign progress, see clear status updates, and know exactly what happens next. No guessing. No chasing updates.",
  },
  {
    q: "Can I leave a campaign after joining?",
    a: "Each campaign clearly explains: When exits are allowed, what refund options apply, and what happens if timelines change. You always see your options — nothing is hidden.",
  },
  {
    q: "Is Alpmera right for me?",
    a: "Alpmera is a good fit if you: Value transparency, are comfortable waiting, prefer protection over impulse buying, and like the idea of collective power. If you need something immediately, Alpmera may not be the right tool — and that's okay.",
  },
];

const SKEPTIC_FAQS = [
  {
    q: "Is this just another group-buying site?",
    a: "No. Most group-buying sites: Push urgency, advertise \"deals\", shift risk to users, and disappear when things fail. Alpmera does the opposite. There is no pressure, no fake scarcity, and no obligation to move forward unless the campaign works for everyone.",
  },
  {
    q: "What's the catch?",
    a: "There isn't one. Alpmera is deliberately slower and more structured than typical online shopping. That tradeoff exists to protect participants. If a campaign doesn't make sense, it simply doesn't move forward — and your funds don't either.",
  },
  {
    q: "How do I know you won't run off with the money?",
    a: "Because Alpmera is designed so that running off with money would be visible immediately. Funds are tracked, state changes are explicit, campaign outcomes are binary: success or failure, and refund paths are defined upfront. Silence, ambiguity, and hidden steps are treated as failures — not normal behavior.",
  },
  {
    q: "What happens if something goes wrong?",
    a: "Alpmera treats failure as a first-class outcome. If something goes wrong: The campaign is clearly marked as failed, you are informed, and refunds are issued according to the rules. There's no \"we're looking into it\" limbo and no reframing failure as a delay.",
  },
  {
    q: "Why don't you just guarantee outcomes?",
    a: "Because guarantees that depend on things outside Alpmera's control would be misleading. Instead, Alpmera guarantees: Clear rules, protected funds, honest communication, and defined exit paths. Promises are explicit, not implied.",
  },
  {
    q: "Why should I trust a new platform?",
    a: "You shouldn't trust blindly. That's why Alpmera doesn't ask you to. Instead, it shows you: What happens in success, what happens in failure, when funds move, and when they don't. Trust is earned through predictable behavior, not brand claims.",
  },
  {
    q: "Why can't suppliers deal with users directly?",
    a: "Because direct supplier–user relationships create confusion and risk. Alpmera stays in the middle so that: Rules stay consistent, accountability is clear, and users aren't pressured or negotiated with. You deal with Alpmera. Alpmera deals with suppliers.",
  },
  {
    q: "How is this not just crowdfunding?",
    a: "Crowdfunding typically: Promises future delivery, shifts risk to backers, treats delays as normal, and has weak refund protections. Alpmera: Uses real demand (not speculation), holds funds until conditions are met, treats failure as a valid outcome, and makes refunds part of the system. The goal is coordination, not hope.",
  },
  {
    q: "What if I change my mind after joining?",
    a: "Every campaign explains: When you can exit, what refund rules apply, and what happens if timelines change. There are no hidden penalties or surprise lock-ins.",
  },
  {
    q: "Why not just buy from a store instead?",
    a: "You should — if speed and convenience are your top priorities. Alpmera is for people who value: Transparency, protection, collective leverage, and fair outcomes. It's a different tool for a different mindset.",
  },
  {
    q: "Is Alpmera trying to become a marketplace later?",
    a: "Not in Phase 1 or Phase 2. Right now, Alpmera is intentionally operating as a controlled operator to: Protect users, learn from real campaigns, and build trust before scale. Any future evolution will be explicit and documented — not silently introduced.",
  },
  {
    q: "What would make Alpmera fail as a platform?",
    a: "Losing clarity. The moment Alpmera: Hides outcomes, uses pressure tactics, blurs responsibilities, or assumes user forgiveness… it would stop being Alpmera. That's why these rules exist in the first place.",
  },
];

export default function LandingHome() {
  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [notify, setNotify] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for performance optimization
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleInterest = (tag: string) => {
    setInterests((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    // Check rate limit
    const rateLimitCheck = checkRateLimit('early-access');
    if (!rateLimitCheck.allowed) {
      const timeRemaining = rateLimitCheck.remainingTime
        ? formatRemainingTime(rateLimitCheck.remainingTime)
        : 'a while';
      setError(`Rate limit exceeded. Please try again in ${timeRemaining}.`);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await subscribeToEarlyList({
        email,
        interestTags: interests,
        notes,
        recommendationOptIn: notify,
        website: honeypot,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || "Unable to submit. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Please check your internet and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background text-foreground">
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-alpmera-accent focus:text-alpmera-text focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <header className="sticky top-0 z-20 glass-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-lg font-semibold tracking-tight text-alpmera-primary font-display cursor-pointer hover:opacity-80 transition-opacity"
          >
            ALPMERA
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-alpmera-text-light hover:text-alpmera-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#early-access"
              className="rounded-md bg-alpmera-primary px-4 py-3 min-h-[44px] inline-flex items-center text-white font-semibold hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-primary"
            >
              Join Early List
            </a>
            <a
              href="/demand"
              className="rounded-md bg-alpmera-accent px-4 py-3 min-h-[44px] inline-flex items-center text-white font-semibold hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-accent"
            >
              Suggest a Product
            </a>
            <a
              href="/product-requests"
              className="rounded-md border-2 border-alpmera-primary bg-transparent px-4 py-3 min-h-[44px] inline-flex items-center text-alpmera-primary font-semibold hover:bg-alpmera-primary hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-primary"
            >
              Product Requests
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex md:hidden items-center justify-center w-11 h-11 rounded-md hover:bg-alpmera-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-alpmera-primary"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main id="main-content">
        {/* Hero Section - Centered Narrative Layout */}
        <section className="relative px-4 py-12 sm:px-6 md:py-20 overflow-hidden">
          {/* Background accent - subtle visual interest */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-alpmera-accent/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-alpmera-primary/5 rounded-full blur-3xl -z-10" />

          <div className="mx-auto max-w-6xl">
            {/* Main headline and status - centered */}
            <motion.div
              initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                isMobile
                  ? { duration: 0.3 }
                  : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
              }
              className="text-center max-w-4xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <p className="text-sm uppercase tracking-[0.25em] text-alpmera-text-light font-body">
                  ALPMERA
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-alpmera-accent/30 bg-alpmera-secondary px-3 py-1 text-xs font-medium text-alpmera-text">
                  <svg className="w-3 h-3 text-alpmera-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Platform launching soon
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal leading-tight font-display text-alpmera-primary">
                {/* Kinetic typography - word-by-word reveal */}
                {[
                  { text: "Collective", color: "gradient-text-primary" },
                  { text: "buying,", color: "text-alpmera-primary" },
                  { text: "built", color: "text-alpmera-primary" },
                  { text: "for", color: "text-alpmera-text-light" },
                  { text: "people", color: "gradient-text-accent" },
                  { text: "—not", color: "text-alpmera-text-light" },
                  { text: "pressure.", color: "text-alpmera-primary" }
                ].map((word, index) => (
                  <motion.span
                    key={index}
                    initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      isMobile
                        ? { duration: 0.3, delay: 0.3 + index * 0.05 }
                        : { duration: 0.5, delay: 0.7 + index * 0.1, ease: [0.22, 1, 0.36, 1] }
                    }
                    className={`inline-block ${word.color} ${word.text === "people" ? "font-semibold" : ""}`}
                    style={{ marginRight: word.text === "people" || word.text === "buying," ? "0.3em" : "0.25em" }}
                  >
                    {word.text}
                  </motion.span>
                ))}
              </h1>

              <p className="text-lg sm:text-xl text-alpmera-text-light font-body max-w-3xl mx-auto">
                Join campaigns, commit funds to <span className="gradient-text-success font-semibold">escrow</span>, and move forward together only when it's fair for everyone.
              </p>

              {/* CTAs - prominently centered with magnetic effect */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <MagneticButton href="#early-access" variant="primary">
                  Join Early List
                </MagneticButton>
                <MagneticButton href="/demand" variant="secondary">
                  Suggest a Product
                </MagneticButton>
              </div>
            </motion.div>

            {/* Trust Principles - Asymmetric floating cards layout */}
            <div className="mt-16 md:mt-24 relative">
              {/* Central anchor card */}
              <motion.div
                initial={isMobile ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={
                  isMobile
                    ? { duration: 0.3, delay: 0.1 }
                    : { duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }
                }
                className="max-w-md mx-auto bg-alpmera-primary text-white rounded-xl p-8 shadow-2xl card-elevated relative z-10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-alpmera-accent/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-alpmera-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-normal font-display gradient-text-animated">Trust-First Model</h2>
                </div>
                <div className="space-y-3">
                  <p className="text-white font-semibold font-body text-lg">
                    Launching Seattle 2026
                  </p>
                  <p className="text-white/80 font-body text-sm">
                    Join the early list for campaign notifications
                  </p>
                </div>
              </motion.div>

              {/* Orbiting trust principle cards - asymmetric positioning */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 md:mt-12">
                <motion.div
                  initial={isMobile ? { opacity: 0 } : { opacity: 0, x: -30, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={
                    isMobile
                      ? { duration: 0.3, delay: 0.2 }
                      : { duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="bg-white rounded-lg border-2 border-alpmera-border p-6 card-texture card-elevated md:mt-8"
                >
                  <div className="h-12 w-12 rounded-full bg-alpmera-success/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-alpmera-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-alpmera-text font-display">
                    Escrow-protected
                  </h3>
                  <p className="text-sm text-alpmera-text-light font-body">
                    Funds held until success
                  </p>
                </motion.div>

                <motion.div
                  initial={isMobile ? { opacity: 0 } : { opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    isMobile
                      ? { duration: 0.3, delay: 0.25 }
                      : { duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="bg-white rounded-lg border-2 border-alpmera-border p-6 card-texture card-elevated"
                >
                  <div className="h-12 w-12 rounded-full bg-alpmera-accent/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-alpmera-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-alpmera-text font-display">
                    Rules-first
                  </h3>
                  <p className="text-sm text-alpmera-text-light font-body">
                    Explicit conditions upfront
                  </p>
                </motion.div>

                <motion.div
                  initial={isMobile ? { opacity: 0 } : { opacity: 0, x: 30, y: 20 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={
                    isMobile
                      ? { duration: 0.3, delay: 0.3 }
                      : { duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="bg-white rounded-lg border-2 border-alpmera-border p-6 card-texture card-elevated md:mt-8"
                >
                  <div className="h-12 w-12 rounded-full bg-alpmera-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-alpmera-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-alpmera-text font-display">
                    Clear outcomes
                  </h3>
                  <p className="text-sm text-alpmera-text-light font-body">
                    Success or full refund
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust by Numbers - Visual Stats */}
        <section className="px-4 py-12 sm:px-6 md:py-16 bg-gradient-to-b from-white to-alpmera-background">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={
                isMobile
                  ? { duration: 0.3 }
                  : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              }
              className="text-center mb-10"
            >
              <h2 className="text-3xl font-normal font-display text-alpmera-primary mb-3">
                Trust by the Numbers
              </h2>
              <p className="text-alpmera-text-light font-body">
                No ambiguity. No surprises. Just clear protection.
              </p>
            </motion.div>
            <TrustStats isMobile={isMobile} />
          </div>
        </section>

        {/* What Alpmera Is/Not - Visual Comparison */}
        <section className="px-4 py-8 sm:px-6 sm:py-12 bg-alpmera-background">
          <div className="mx-auto max-w-6xl">
            <motion.h2
              initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={
                isMobile
                  ? { duration: 0.3 }
                  : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              }
              className="text-3xl font-normal font-display text-alpmera-primary text-center mb-12"
            >
              What Alpmera is — and what it is not
            </motion.h2>

            {/* Visual grid comparison */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* IS cards */}
              <motion.div
                initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={
                  isMobile
                    ? { duration: 0.3, delay: 0.1 }
                    : { duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }
                }
                className="bg-white rounded-xl border-2 border-alpmera-success/20 p-6 card-texture card-elevated text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-alpmera-success/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-alpmera-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base font-bold font-display text-alpmera-primary mb-2">
                  Campaign Operator
                </h3>
                <p className="text-sm text-alpmera-text-light font-body">
                  We design & manage campaigns
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={
                  isMobile
                    ? { duration: 0.3, delay: 0.15 }
                    : { duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }
                }
                className="bg-white rounded-xl border-2 border-alpmera-success/20 p-6 card-texture card-elevated text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-alpmera-success/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-alpmera-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-base font-bold font-display text-alpmera-primary mb-2">
                  Escrow Protected
                </h3>
                <p className="text-sm text-alpmera-text-light font-body">
                  Funds safe until success
                </p>
              </motion.div>

              {/* IS NOT cards */}
              <motion.div
                initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={
                  isMobile
                    ? { duration: 0.3, delay: 0.2 }
                    : { duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
                }
                className="bg-white rounded-xl border-2 border-alpmera-danger/20 p-6 card-texture card-elevated text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-alpmera-danger/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-alpmera-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-base font-bold font-display text-alpmera-primary mb-2">
                  Not a Store
                </h3>
                <p className="text-sm text-alpmera-text-light font-body">
                  No instant checkout
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={
                  isMobile
                    ? { duration: 0.3, delay: 0.25 }
                    : { duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }
                }
                className="bg-white rounded-xl border-2 border-alpmera-danger/20 p-6 card-texture card-elevated text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-alpmera-danger/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-alpmera-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-base font-bold font-display text-alpmera-primary mb-2">
                  Not a Deal Site
                </h3>
                <p className="text-sm text-alpmera-text-light font-body">
                  No fake urgency
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* See It In Action - Mock Campaign Example */}
        <section className="px-4 py-12 sm:px-6 md:py-16 bg-gradient-to-b from-alpmera-background to-white">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={
                isMobile
                  ? { duration: 0.3 }
                  : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              }
              className="text-center mb-10"
            >
              <h2 className="text-3xl font-normal font-display text-alpmera-primary mb-3">
                See It In Action
              </h2>
              <p className="text-alpmera-text-light font-body max-w-2xl mx-auto">
                Here's what a real campaign looks like. Transparent progress, clear rules, protected funds.
              </p>
            </motion.div>
            <MockCampaign isMobile={isMobile} />
          </div>
        </section>

        {/* How It Works */}
        <section className="py-8 md:py-14" id="how-it-works">
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={
              isMobile
                ? { duration: 0.3 }
                : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
            }
            className="text-center space-y-4 mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-normal font-display text-alpmera-primary">
              How It Works
            </h2>
            <p className="max-w-2xl mx-auto text-alpmera-text-light font-body">
              See how a campaign moves forward — clearly, safely, and step by step.
            </p>
          </motion.div>

          <AlpmeraBatchFlow />
        </section>

        {/* Money Flow - Visual Lifecycle */}
        <section className="px-4 py-12 sm:px-6 md:py-16 bg-gradient-to-b from-white to-alpmera-background">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={
                isMobile
                  ? { duration: 0.3 }
                  : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              }
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-normal font-display text-alpmera-primary mb-3">
                Your Money's Journey
              </h2>
              <p className="text-alpmera-text-light font-body max-w-2xl mx-auto">
                See exactly where your funds go and what happens at each stage
              </p>
            </motion.div>
            <MoneyFlowDiagram isMobile={isMobile} />
          </div>
        </section>

        {/* Safety */}
        <section className="px-4 py-8 sm:px-6 sm:py-12 bg-alpmera-background" id="safety">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={
                isMobile
                  ? { duration: 0.3 }
                  : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <h2 className="text-3xl font-normal font-display text-alpmera-primary border-b-2 border-alpmera-success pb-2 inline-block">
                Safety is the product
              </h2>
              <p className="mt-3 text-sm text-alpmera-text-light font-body">
                Every campaign operates under explicit protection
              </p>
            </motion.div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {SAFETY_CARDS.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: isMobile ? 0 : 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={
                    isMobile
                      ? { duration: 0.3 }
                      : { duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="rounded-lg border border-alpmera-border bg-white p-6 card-texture card-elevated"
                >
                  <div className="mb-4 h-10 w-10 rounded-full bg-alpmera-success/10 flex items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-alpmera-success" />
                  </div>
                  <h3 className="text-lg font-semibold font-display text-alpmera-primary">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm text-alpmera-text-light font-body leading-relaxed">
                    {card.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Demand CTA */}
        <section className="px-4 py-8 sm:px-6 sm:py-10 bg-alpmera-primary text-white">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="text-2xl md:text-3xl font-normal font-display">
              What should we unlock next?
            </h2>
            <p className="mt-4 text-sm text-white/90 font-body max-w-2xl mx-auto">
              Tell us what products you'd like to see on Alpmera. Your suggestions shape our first campaigns.
            </p>
            <a
              href="/demand"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-alpmera-accent px-6 py-3 text-sm font-semibold text-alpmera-text hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-alpmera-primary"
            >
              Suggest a Product
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </section>

        {/* Early Access Form */}
        <section className="px-4 py-8 sm:px-6 sm:py-12" id="early-access">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-lg border-2 border-alpmera-success/20 bg-alpmera-secondary p-6 md:p-12">
              <h2 className="text-3xl font-normal font-display text-alpmera-primary">
                Join the early list
              </h2>
              <p className="mt-3 text-sm text-alpmera-text-light font-body">
                We're launching campaigns in the Seattle area first. Sign up to receive notifications when campaigns become available.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <HoneypotField value={honeypot} onChange={setHoneypot} />

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-alpmera-text font-body">
                    Email address <span className="text-alpmera-danger">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    className="mt-2 w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm font-body focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
                    required
                    aria-required="true"
                    aria-describedby="email-hint"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-alpmera-text mb-3 font-body">
                    Interest tags (optional)
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {INTEREST_TAGS.map((tag) => (
                      <label key={tag} className="flex items-center gap-3 text-sm text-alpmera-text font-body cursor-pointer py-2">
                        <input
                          type="checkbox"
                          checked={interests.includes(tag)}
                          onChange={() => toggleInterest(tag)}
                          className="h-5 w-5 rounded border-alpmera-border text-alpmera-primary focus:ring-alpmera-primary shrink-0"
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-semibold text-alpmera-text font-body">
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Optional context or priorities"
                    autoComplete="off"
                    className="mt-2 w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm font-body focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary resize-none"
                    aria-describedby="notes-hint"
                  />
                  <div className="mt-1 text-xs text-alpmera-text-light font-body">
                    Maximum 500 characters.
                  </div>
                </div>

                <label className="flex items-start gap-3 text-sm text-alpmera-text font-body cursor-pointer py-2">
                  <input
                    type="checkbox"
                    name="notify"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-alpmera-border text-alpmera-primary focus:ring-alpmera-primary shrink-0"
                    aria-label="Send me campaign notifications"
                  />
                  <span>Send me campaign notifications when they become available</span>
                </label>

                <p className="text-xs text-alpmera-text-light font-body">
                  We'll only send notifications about campaigns. No spam, no marketing emails.{" "}
                  <a href="/privacy" className="underline hover:text-alpmera-primary">
                    Privacy Policy
                  </a>
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-md bg-alpmera-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-primary focus:ring-offset-2 btn-depth"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    "Notify me"
                  )}
                </button>

                {submitted && (
                  <div
                    className="flex items-center gap-3 rounded-lg border border-alpmera-success bg-alpmera-success/5 p-4"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-alpmera-success text-white text-xs font-bold">
                      ✓
                    </span>
                    <p className="text-sm font-semibold text-alpmera-success font-body">
                      You're on the list. We'll notify you when campaigns launch in your area.
                    </p>
                  </div>
                )}

                {error && (
                  <div
                    className="flex items-start gap-3 rounded-lg border border-alpmera-danger bg-alpmera-danger/5 p-4"
                    role="alert"
                    aria-live="assertive"
                  >
                    <span className="text-alpmera-danger text-sm font-semibold shrink-0">⚠</span>
                    <p className="text-sm text-alpmera-danger font-body">{error}</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-8 sm:px-6 sm:py-12 bg-alpmera-background" id="faq">
          <div className="mx-auto max-w-6xl">
            <motion.h2
              initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={
                isMobile
                  ? { duration: 0.3 }
                  : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
              }
              className="text-3xl font-normal font-display text-alpmera-primary mb-8"
            >
              FAQ
            </motion.h2>

            {/* Main FAQ */}
            <div className="space-y-4">
              {FAQS.map((faq, index) => {
                // Auto-categorize based on keywords
                let category: "trust" | "how-it-works" | "refunds" | "general" = "general";
                if (faq.q.includes("money") || faq.q.includes("safe") || faq.q.includes("trust") || faq.q.includes("funds")) category = "trust";
                if (faq.q.includes("join") || faq.q.includes("works") || faq.q.includes("handles")) category = "how-it-works";
                if (faq.q.includes("refund") || faq.q.includes("fail") || faq.q.includes("doesn't succeed")) category = "refunds";

                return (
                  <FAQItem
                    key={faq.q}
                    question={faq.q}
                    answer={faq.a}
                    index={index}
                    isMobile={isMobile}
                    category={category}
                  />
                );
              })}
            </div>

            {/* Skeptic FAQ */}
            <div className="mt-16">
              <h3 className="text-2xl font-normal font-display text-alpmera-primary mb-6">
                Skeptic FAQ
              </h3>
              <div className="space-y-4">
                {SKEPTIC_FAQS.map((faq, index) => {
                  // Auto-categorize skeptic FAQs
                  let category: "trust" | "how-it-works" | "refunds" | "general" = "trust";
                  if (faq.q.includes("refund") || faq.q.includes("wrong") || faq.q.includes("mind")) category = "refunds";

                  return (
                    <FAQItem
                      key={faq.q}
                      question={faq.q}
                      answer={faq.a}
                      index={index}
                      isMobile={isMobile}
                      category={category}
                    />
                  );
                })}
              </div>

              {/* Closing line */}
              <p className="mt-8 text-center text-sm text-alpmera-text-light font-body italic">
                If you're skeptical, that's a good sign.<br />
                Alpmera was built for people who ask hard questions.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-alpmera-text-light md:flex-row md:items-center md:justify-between font-body">
          <div className="space-y-2">
            <div className="text-lg font-semibold text-alpmera-primary font-display mb-3">
              ALPMERA
            </div>
            <p>Alpmera operates campaign-based collective participation with explicit rules.</p>
            <p>Seattle metropolitan area (initial focus)</p>
          </div>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-alpmera-primary transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-alpmera-primary transition-colors">
              Terms
            </a>
            <a href="mailto:hello@alpmera.com" className="hover:text-alpmera-primary transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
    </MotionConfig>
  );
}
