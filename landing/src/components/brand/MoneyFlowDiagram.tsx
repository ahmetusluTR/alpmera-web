import { motion } from "framer-motion";

interface MoneyFlowDiagramProps {
  isMobile: boolean;
}

export function MoneyFlowDiagram({ isMobile }: MoneyFlowDiagramProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Diagram */}
      <div className="relative">
        {/* Flow path - horizontal line connecting stages */}
        <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-alpmera-primary via-alpmera-accent to-alpmera-success -translate-y-1/2 z-0" />

        {/* Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
          {/* Stage 1: Commit */}
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={
              isMobile
                ? { duration: 0.3 }
                : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
            }
            className="text-center"
          >
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-alpmera-primary to-alpmera-accent flex items-center justify-center shadow-lg border-4 border-white relative">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-alpmera-accent text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                1
              </div>
            </div>

            {/* Label */}
            <h3 className="text-lg font-bold font-display text-alpmera-primary mb-2">
              You Join
            </h3>
            <p className="text-sm text-alpmera-text-light font-body">
              Commit funds to escrow
            </p>
          </motion.div>

          {/* Arrow (mobile only) */}
          <div className="md:hidden flex justify-center -my-4">
            <svg className="w-6 h-6 text-alpmera-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* Stage 2: Escrow */}
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={
              isMobile
                ? { duration: 0.3, delay: 0.1 }
                : { duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
            }
            className="text-center"
          >
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-alpmera-accent to-alpmera-success flex items-center justify-center shadow-lg border-4 border-white relative">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-alpmera-success text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                2
              </div>
            </div>

            {/* Label */}
            <h3 className="text-lg font-bold font-display text-alpmera-primary mb-2">
              Funds Protected
            </h3>
            <p className="text-sm text-alpmera-text-light font-body">
              Held securely until success
            </p>
          </motion.div>

          {/* Arrow (mobile only) */}
          <div className="md:hidden flex justify-center -my-4">
            <svg className="w-6 h-6 text-alpmera-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* Stage 3: Outcome */}
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={
              isMobile
                ? { duration: 0.3, delay: 0.2 }
                : { duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }
            }
            className="text-center"
          >
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-alpmera-success to-alpmera-primary flex items-center justify-center shadow-lg border-4 border-white relative">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-alpmera-primary text-white text-xs font-bold flex items-center justify-center border-2 border-white">
                3
              </div>
            </div>

            {/* Label */}
            <h3 className="text-lg font-bold font-display text-alpmera-primary mb-2">
              Clear Outcome
            </h3>
            <p className="text-sm text-alpmera-text-light font-body">
              Fulfill or full refund
            </p>
          </motion.div>
        </div>
      </div>

      {/* Decision paths */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={
          isMobile
            ? { duration: 0.3, delay: 0.3 }
            : { duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
        className="mt-12 grid md:grid-cols-2 gap-6"
      >
        {/* Success path */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-alpmera-success/10 to-alpmera-success/5 border-2 border-alpmera-success/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-alpmera-success flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="font-bold text-alpmera-success font-display">Success</h4>
          </div>
          <p className="text-sm text-alpmera-text font-body">
            Campaign reaches target → Funds released → Product fulfilled by Alpmera
          </p>
        </div>

        {/* Failure path */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-alpmera-primary/10 to-alpmera-primary/5 border-2 border-alpmera-primary/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-alpmera-primary flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
            <h4 className="font-bold text-alpmera-primary font-display">Doesn't Reach Target</h4>
          </div>
          <p className="text-sm text-alpmera-text font-body">
            Campaign closes → Funds returned → Full refund to all participants
          </p>
        </div>
      </motion.div>
    </div>
  );
}
