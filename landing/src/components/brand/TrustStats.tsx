import { motion } from "framer-motion";

interface TrustStatProps {
  number: string;
  label: string;
  icon: React.ReactNode;
  index: number;
  isMobile: boolean;
}

function TrustStat({ number, label, icon, index, isMobile }: TrustStatProps) {
  return (
    <motion.div
      initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={
        isMobile
          ? { duration: 0.3, delay: index * 0.1 }
          : { duration: 0.5, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }
      }
      className="flex flex-col items-center text-center p-6 bg-white rounded-xl border-2 border-alpmera-border card-texture card-elevated"
    >
      <div className="w-16 h-16 rounded-full bg-alpmera-success/10 flex items-center justify-center mb-4">
        <div className="text-alpmera-success">
          {icon}
        </div>
      </div>
      <div className="text-4xl md:text-5xl font-bold font-display gradient-text-success mb-2">
        {number}
      </div>
      <p className="text-sm text-alpmera-text-light font-body leading-snug">
        {label}
      </p>
    </motion.div>
  );
}

interface TrustStatsProps {
  isMobile: boolean;
}

export function TrustStats({ isMobile }: TrustStatsProps) {
  const stats = [
    {
      number: "100%",
      label: "Escrow Protected",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      number: "0",
      label: "Hidden Fees",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      number: "Full",
      label: "Refund Guarantee",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
    },
    {
      number: "Clear",
      label: "State Changes",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, index) => (
        <TrustStat
          key={stat.label}
          number={stat.number}
          label={stat.label}
          icon={stat.icon}
          index={index}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}
