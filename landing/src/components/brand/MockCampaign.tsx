import { motion } from "framer-motion";

interface MockCampaignProps {
  isMobile: boolean;
}

export function MockCampaign({ isMobile }: MockCampaignProps) {
  const progress = 68; // 68% progress
  const participants = 127;
  const target = 200;
  const daysLeft = 5;

  return (
    <motion.div
      initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={
        isMobile
          ? { duration: 0.3 }
          : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      }
      className="max-w-2xl mx-auto"
    >
      {/* "Example" badge */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-alpmera-accent/30 bg-alpmera-secondary px-3 py-1 text-xs font-medium text-alpmera-text">
          <svg className="w-3 h-3 text-alpmera-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Example Campaign
        </span>
      </div>

      {/* Campaign Card */}
      <div className="bg-white rounded-xl border-2 border-alpmera-border p-6 md:p-8 card-texture card-elevated shadow-xl">
        {/* Product info */}
        <div className="flex items-start gap-4 mb-6">
          {/* Mock product image placeholder */}
          <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg bg-gradient-to-br from-alpmera-secondary to-alpmera-accent/10 flex items-center justify-center border-2 border-alpmera-border">
            <svg className="w-10 h-10 md:w-12 md:h-12 text-alpmera-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>

          {/* Product details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl md:text-2xl font-bold font-display text-alpmera-text mb-2">
              KitchenAid Stand Mixer
            </h3>
            <p className="text-sm text-alpmera-text-light font-body mb-2">
              Professional 5-Quart, Multiple Colors
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-alpmera-success/10 text-alpmera-success text-xs font-semibold">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AGGREGATION
              </span>
              <span className="text-xs text-alpmera-text-light font-body">
                Seattle Metro
              </span>
            </div>
          </div>
        </div>

        {/* Progress section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-alpmera-text font-body">
              Campaign Progress
            </span>
            <span className="text-sm font-bold text-alpmera-accent font-display">
              {progress}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 bg-alpmera-secondary rounded-full overflow-hidden border border-alpmera-border">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-alpmera-success to-alpmera-accent rounded-full"
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-alpmera-text-light font-body">
              <strong className="text-alpmera-text">{participants}</strong> participants
            </span>
            <span className="text-xs text-alpmera-text-light font-body">
              Target: <strong className="text-alpmera-text">{target}</strong>
            </span>
          </div>
        </div>

        {/* Key details grid */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-alpmera-secondary/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold font-display text-alpmera-primary mb-1">
              {daysLeft}
            </div>
            <div className="text-xs text-alpmera-text-light font-body">
              Days Left
            </div>
          </div>
          <div className="text-center border-x border-alpmera-border">
            <div className="text-2xl font-bold font-display text-alpmera-primary mb-1">
              $289
            </div>
            <div className="text-xs text-alpmera-text-light font-body">
              Per Unit
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-display gradient-text-success mb-1">
              100%
            </div>
            <div className="text-xs text-alpmera-text-light font-body">
              Escrow
            </div>
          </div>
        </div>

        {/* Status message */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-alpmera-success/5 border border-alpmera-success/20">
          <svg className="w-5 h-5 text-alpmera-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-alpmera-success mb-1 font-body">
              On track for success
            </p>
            <p className="text-xs text-alpmera-text-light font-body leading-relaxed">
              If 200 participants join by deadline, campaign moves to procurement. Otherwise, all funds are refunded.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
