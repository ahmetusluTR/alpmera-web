import { useState } from "react";
import { submitDemandSuggestion } from "./lib/googleSheets";
import { checkRateLimit, formatRemainingTime } from "./lib/rateLimit";
import { HoneypotField } from "./components/forms/HoneypotField";
import { US_STATES } from "./data/usStates";

export default function Demand() {
  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [reason, setReason] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [notify, setNotify] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showSkuTooltip, setShowSkuTooltip] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) return;

    // Check rate limit
    const rateLimitCheck = checkRateLimit('demand-suggestion');
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
      const result = await submitDemandSuggestion({
        product_name: productName,
        sku,
        reference_url: referenceUrl,
        reason,
        city,
        state,
        email,
        notify,
        website: honeypot,
      });

      if (result.success) {
        setSubmitted(true);
        // Reset form
        setProductName("");
        setSku("");
        setReferenceUrl("");
        setReason("");
        setCity("");
        setState("");
        setEmail("");
        setNotify(false);
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

      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="/" className="text-lg font-semibold tracking-tight text-alpmera-primary font-display">
            Alpmera
          </a>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/" className="text-alpmera-text-light hover:text-alpmera-primary transition-colors">
              Back to Home
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold font-display text-alpmera-primary leading-tight">
            Suggest a Product
          </h1>
          <p className="mt-4 text-alpmera-text-light">
            Help us decide what campaigns to run. Your suggestions directly shape our roadmap.
          </p>

          <div className="mt-4 border-t border-alpmera-border" />

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <HoneypotField value={honeypot} onChange={setHoneypot} />

            {/* Product name */}
            <div>
              <label htmlFor="product-name" className="block text-sm font-semibold text-alpmera-text">
                Product name or description <span className="text-alpmera-danger">*</span>
              </label>
              <input
                type="text"
                id="product-name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder='e.g., "Sony WH-1000XM5 headphones" or "Premium cast iron cookware"'
                className="mt-2 w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
                required
              />
            </div>

            {/* SKU */}
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="sku" className="block text-sm font-semibold text-alpmera-text">
                  SKU or model number (optional)
                </label>
                <button
                  type="button"
                  className="text-alpmera-text-light hover:text-alpmera-primary"
                  onClick={() => setShowSkuTooltip(!showSkuTooltip)}
                  aria-label="What is SKU?"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              {showSkuTooltip && (
                <div className="mt-2 rounded-md bg-alpmera-secondary p-3 text-xs text-alpmera-text-light">
                  SKU (Stock Keeping Unit) is a unique product identifier. You can usually find it on the product page near the price or in the product details section. It helps us identify the exact product you're suggesting.
                </div>
              )}
              <input
                type="text"
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g., WH1000XM5/B"
                className="mt-2 w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
              />
            </div>

            {/* Reference URL */}
            <div>
              <label htmlFor="reference-url" className="block text-sm font-semibold text-alpmera-text">
                Reference URL (optional)
              </label>
              <input
                type="url"
                id="reference-url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                placeholder="Amazon, Walmart, manufacturer website, etc."
                className="mt-2 w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
              />
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-semibold text-alpmera-text">
                Why do you want this? (optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Tell us why this product would be a good fit for collective buying"
                className="mt-2 w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary resize-none"
              />
              <div className="mt-1 text-xs text-alpmera-text-light">
                Maximum 500 characters. {reason.length}/500
              </div>
            </div>

            <div className="border-t border-alpmera-border" />

            {/* Location */}
            <div>
              <div className="text-sm font-semibold text-alpmera-text mb-3">
                Your location (optional — helps us prioritize by region)
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="city" className="block text-sm text-alpmera-text-light mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Seattle"
                    className="w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm text-alpmera-text-light mb-2">
                    State
                  </label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
                  >
                    <option value="">Select state</option>
                    {US_STATES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-alpmera-text">
                Email (optional — to notify when available)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-2 w-full rounded-md border border-alpmera-border bg-white px-4 py-3 text-sm focus:border-alpmera-primary focus:outline-none focus:ring-1 focus:ring-alpmera-primary"
              />
            </div>

            {/* Notify checkbox */}
            <label className="flex items-start gap-3 text-sm text-alpmera-text">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-alpmera-border text-alpmera-primary focus:ring-alpmera-primary"
              />
              <span>Notify me if this product becomes a campaign</span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !productName}
              className="w-full rounded-lg bg-alpmera-primary px-6 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-alpmera-primary focus:ring-offset-2"
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
                "Submit Suggestion"
              )}
            </button>

            {/* Success message */}
            {submitted && (
              <div className="flex items-start gap-3 rounded-lg border border-alpmera-success bg-alpmera-success/5 p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-alpmera-success text-white text-xs font-bold">
                  ✓
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-alpmera-success">
                    Thank you. Your suggestion has been recorded.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setProductName("");
                      setSku("");
                      setReferenceUrl("");
                      setReason("");
                      setCity("");
                      setState("");
                      setEmail("");
                      setNotify(false);
                    }}
                    className="mt-2 text-xs text-alpmera-primary hover:underline"
                  >
                    Suggest another product
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-alpmera-danger bg-alpmera-danger/5 p-4">
                <span className="text-alpmera-danger text-sm font-semibold shrink-0">⚠</span>
                <p className="text-sm text-alpmera-danger">{error}</p>
              </div>
            )}

            {/* Privacy note */}
            <p className="text-xs text-alpmera-text-light">
              Your suggestion is anonymous unless you provide an email. We review all submissions but cannot guarantee every product will become a campaign.
            </p>
          </form>
        </div>
      </main>

      <footer className="border-t border-border bg-background px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm text-alpmera-text-light md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
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
