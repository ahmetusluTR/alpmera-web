import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function AlpmeraBatchFlow() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const steps = [
    {
      number: "1",
      title: "A Campaign Is Defined",
      description: "Alpmera creates a campaign with clear rules, timelines, and outcomes — nothing implied.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      number: "2",
      title: "People Join Together",
      description: "Individuals join the campaign at their own pace and see real participation as it builds.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      number: "3",
      title: "Funds Stay Protected",
      description: "When you join, your funds are committed to escrow-style protection and are not released early.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      number: "4",
      title: "The Campaign Resolves",
      description: "The campaign either succeeds and moves forward, or fails and closes — clearly and explicitly.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      number: "5",
      title: "Fulfillment or Refund",
      description: "Successful campaigns are fulfilled by Alpmera, and failed campaigns result in refunds.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Mobile/Tablet: Horizontal scroll */}
      <div className="lg:hidden relative px-4 sm:px-6">
        {/* Scroll hint */}
        <div className="text-center mb-6">
          <p className="text-sm text-alpmera-text-light font-body flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            Scroll to see the full journey
          </p>
        </div>

        {/* Horizontal scroll container */}
        <div className="overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
          <div className="flex gap-6 min-w-max pb-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative flex-shrink-0 w-[280px] snap-center"
              >
                {/* Connector arrow (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="absolute top-12 -right-6 z-0">
                    <svg className="w-6 h-6 text-alpmera-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}

                {/* Step card */}
                <div className="relative bg-white rounded-xl border-2 border-alpmera-border p-6 card-texture card-elevated h-full">
                  {/* Step number badge */}
                  <div className="absolute -top-4 left-4 w-10 h-10 rounded-full bg-alpmera-accent text-white font-bold flex items-center justify-center text-lg shadow-lg border-2 border-white">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="flex items-center justify-center bg-alpmera-secondary/30 -mx-6 -mt-6 pt-10 pb-6 rounded-t-xl mb-4">
                    <div className="text-alpmera-primary">
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-alpmera-text font-display">
                      {step.title}
                    </h3>
                    <p className="text-sm text-alpmera-text-light font-body leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Timeline runway */}
      <div className="hidden lg:block px-6 relative">
        {/* Timeline runway line */}
        <div className="absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-alpmera-primary via-alpmera-accent to-alpmera-success mx-auto" style={{ width: "calc(100% - 12rem)" }} />

        {/* Steps */}
        <div className="relative flex justify-between items-start max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="relative flex flex-col items-center"
              style={{ width: "18%" }}
            >
              {/* Timeline dot */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-alpmera-accent to-alpmera-primary shadow-lg border-4 border-white mb-4 z-10 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{step.number}</span>
              </div>

              {/* Step card */}
              <div className="bg-white rounded-xl border-2 border-alpmera-border p-5 card-texture card-elevated w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
                {/* Icon */}
                <div className="flex items-center justify-center bg-alpmera-secondary/30 -mx-5 -mt-5 pt-6 pb-5 rounded-t-xl mb-4">
                  <div className="text-alpmera-primary">
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2 text-center">
                  <h3 className="font-bold text-sm text-alpmera-text font-display leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-xs text-alpmera-text-light font-body leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Progress arrow (except for last step) */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: 0.8 + index * 0.15
                  }}
                  className="absolute -right-10 top-14 text-alpmera-accent"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
