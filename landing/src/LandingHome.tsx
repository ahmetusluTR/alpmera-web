import { useState } from "react";
import { submitEarlyAccess } from "./lib/googleSheets";
import { checkRateLimit, formatRemainingTime } from "./lib/rateLimit";
import { HoneypotField } from "./components/forms/HoneypotField";

const VIDEO_ID = "PLACEHOLDER"; // Replace with actual YouTube ID when ready

const INTEREST_TAGS = [
  "Electronics",
  "Home",
  "Kitchen",
  "Outdoors",
  "Fitness",
  "Kids",
  "Office",
  "Tools",
  "Pets",
  "Other",
];

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Safety", href: "#safety" },
  { label: "FAQ", href: "#faq" },
  { label: "Suggest a Product", href: "/demand" },
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

const HOW_IT_WORKS_STEPS = [
  "A campaign opens with clear rules and participation requirements.",
  "Participants join and commit funds to escrow.",
  "Progress is visible as the campaign fills.",
  "If the campaign completes, Alpmera coordinates procurement and fulfillment.",
  "If it doesn't complete, participants receive a full refund from escrow.",
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
    q: "Who holds the funds?",
    a: "Committed funds are held in escrow under each campaign's rules. Alpmera coordinates the escrow process but does not access funds until conditions are met.",
  },
  {
    q: "What happens if a campaign doesn't complete?",
    a: "Participants receive a full refund from escrow. No penalties, no fees deducted.",
  },
  {
    q: "Is there urgency or limited-time pressure?",
    a: "No. Campaigns have explicit timelines, but Alpmera does not use countdown timers, artificial scarcity, or pressure tactics.",
  },
  {
    q: "Is Alpmera a store?",
    a: "No. Alpmera operates campaigns where participants pool demand. We coordinate fulfillment but do not hold inventory or function as a retailer.",
  },
  {
    q: "When will the web app open?",
    a: "We're launching in phases. Early participants will be notified as campaigns become available in their area.",
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
      const result = await submitEarlyAccess({
        email,
        interests,
        notes,
        notify,
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip to content for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-alpmera-accent focus:text-alpmera-text focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold tracking-tight text-alpmera-primary font-display">
            ALPMERA
          </div>
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
              className="rounded-md bg-alpmera-primary px-4 py-2 text-white hover:bg-opacity-90 transition-all"
            >
              Join Early List
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        {/* Hero Section */}
        <section className="px-6 py-16 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.25em] text-alpmera-text-light font-body">
                ALPMERA
              </p>
              <h1 className="text-4xl md:text-5xl font-normal leading-tight font-display text-alpmera-primary">
                Collective buying, built for people—not pressure.
              </h1>
              <p className="text-lg text-alpmera-text-light font-body">
                Join campaigns, commit funds to escrow, and move forward together only when it's fair for everyone.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#early-access"
                  className="inline-flex items-center justify-center rounded-md bg-alpmera-primary px-6 py-3 text-sm font-semibold text-white hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-primary focus:ring-offset-2"
                >
                  Join Early List
                </a>
                <a
                  href="/demand"
                  className="inline-flex items-center justify-center rounded-md border border-alpmera-primary px-6 py-3 text-sm font-semibold text-alpmera-primary hover:bg-alpmera-primary hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-primary focus:ring-offset-2"
                >
                  Suggest a Product
                </a>
              </div>
            </div>

            {/* Video + Trust Model */}
            <div className="space-y-6">
              {/* Video Placeholder */}
              <div className="aspect-video bg-alpmera-secondary rounded-lg flex items-center justify-center border border-alpmera-border">
                {VIDEO_ID === "PLACEHOLDER" ? (
                  <div className="text-center px-6">
                    <svg
                      className="w-16 h-16 text-alpmera-primary mx-auto mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-alpmera-text-light font-body">Video coming soon</p>
                  </div>
                ) : (
                  <iframe
                    src={`https://www.youtube.com/embed/${VIDEO_ID}`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                    title="Alpmera Introduction"
                  />
                )}
              </div>

              {/* Trust Model Card */}
              <div className="rounded-lg border border-alpmera-border bg-alpmera-secondary p-6">
                <p className="text-sm font-semibold text-alpmera-primary mb-4 font-body">
                  Trust-First Model
                </p>
                <div className="space-y-3">
                  <div className="rounded-md bg-white p-4 border border-alpmera-border">
                    <p className="text-sm font-semibold text-alpmera-text font-body">
                      Escrow-protected commitments
                    </p>
                    <p className="text-sm text-alpmera-text-light mt-1 font-body">
                      Funds remain held until the campaign resolves.
                    </p>
                  </div>
                  <div className="rounded-md bg-white p-4 border border-alpmera-border">
                    <p className="text-sm font-semibold text-alpmera-text font-body">
                      Rules-first participation
                    </p>
                    <p className="text-sm text-alpmera-text-light mt-1 font-body">
                      Explicit conditions before funds are committed.
                    </p>
                  </div>
                  <div className="rounded-md bg-white p-4 border border-alpmera-border">
                    <p className="text-sm font-semibold text-alpmera-text font-body">
                      Clear outcomes
                    </p>
                    <p className="text-sm text-alpmera-text-light mt-1 font-body">
                      Campaigns complete or refunds follow the rules.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What Alpmera Is/Not */}
        <section className="px-6 py-20 bg-alpmera-background">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-normal font-display text-alpmera-primary">
              What Alpmera is — and what it is not
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-alpmera-border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold font-display text-alpmera-primary">
                  Alpmera is:
                </h3>
                <ul className="mt-4 space-y-3">
                  {ALPMERA_IS.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-alpmera-text font-body">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-alpmera-success shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-alpmera-border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold font-display text-alpmera-primary">
                  Alpmera is not:
                </h3>
                <ul className="mt-4 space-y-3">
                  {ALPMERA_IS_NOT.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-alpmera-text font-body">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-alpmera-danger shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-20" id="how-it-works">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-normal font-display text-alpmera-primary">
              How it works
            </h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <li
                  key={index}
                  className="rounded-lg border border-alpmera-border bg-alpmera-secondary p-6 shadow-sm"
                >
                  <div className="text-xs uppercase tracking-[0.25em] text-alpmera-accent font-semibold mb-3 font-body">
                    Step {index + 1}
                  </div>
                  <p className="text-sm text-alpmera-text font-body leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-alpmera-text-light font-body">
              Timelines are conditional. If anything changes, it's communicated explicitly.
            </p>
          </div>
        </section>

        {/* Safety */}
        <section className="px-6 py-20 bg-alpmera-background" id="safety">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-normal font-display text-alpmera-primary border-b-2 border-alpmera-success pb-2 inline-block">
              Safety is the product
            </h2>
            <p className="mt-3 text-sm text-alpmera-text-light font-body">
              Every campaign operates under explicit protection
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {SAFETY_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="rounded-lg border border-alpmera-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
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
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demand CTA */}
        <section className="px-6 py-16 bg-alpmera-primary text-white">
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
        <section className="px-6 py-20" id="early-access">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-lg border-2 border-alpmera-success/20 bg-alpmera-secondary p-8 md:p-12">
              <h2 className="text-3xl font-normal font-display text-alpmera-primary">
                Join the early list
              </h2>
              <p className="mt-3 text-sm text-alpmera-text-light font-body">
                We're launching campaigns in the Seattle area first. Sign up to receive notifications when campaigns become available.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <HoneypotField />

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-alpmera-text font-body">
                    Email address <span className="text-alpmera-danger">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="mt-2 w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm font-body focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-alpmera-text mb-3 font-body">
                    Interest tags (optional)
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {INTEREST_TAGS.map((tag) => (
                      <label key={tag} className="flex items-center gap-2 text-sm text-alpmera-text font-body cursor-pointer">
                        <input
                          type="checkbox"
                          checked={interests.includes(tag)}
                          onChange={() => toggleInterest(tag)}
                          className="h-4 w-4 rounded border-alpmera-border text-alpmera-primary focus:ring-alpmera-primary"
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
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Optional context or priorities"
                    className="mt-2 w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm font-body focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary resize-none"
                  />
                  <div className="mt-1 text-xs text-alpmera-text-light font-body">
                    Maximum 500 characters.
                  </div>
                </div>

                <label className="flex items-start gap-3 text-sm text-alpmera-text font-body cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-alpmera-border text-alpmera-primary focus:ring-alpmera-primary"
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
                  className="w-full rounded-md bg-alpmera-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-primary focus:ring-offset-2"
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
                  <div className="flex items-center gap-3 rounded-lg border border-alpmera-success bg-alpmera-success/5 p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-alpmera-success text-white text-xs font-bold">
                      ✓
                    </span>
                    <p className="text-sm font-semibold text-alpmera-success font-body">
                      You're on the list. We'll notify you when campaigns launch in your area.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-3 rounded-lg border border-alpmera-danger bg-alpmera-danger/5 p-4">
                    <span className="text-alpmera-danger text-sm font-semibold shrink-0">⚠</span>
                    <p className="text-sm text-alpmera-danger font-body">{error}</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-20 bg-alpmera-background" id="faq">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-normal font-display text-alpmera-primary">FAQ</h2>
            <div className="mt-8 space-y-4">
              {FAQS.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-lg border border-alpmera-border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold font-display text-alpmera-primary">
                    {faq.q}
                  </h3>
                  <p className="mt-3 text-sm text-alpmera-text-light font-body leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background px-6 py-10">
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
  );
}
