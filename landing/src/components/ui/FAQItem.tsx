import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItemProps {
  question: string;
  answer: string;
  index: number;
  isMobile: boolean;
  category?: "trust" | "how-it-works" | "refunds" | "general";
}

const categoryConfig = {
  trust: { label: "Trust", color: "text-alpmera-success bg-alpmera-success/10 border-alpmera-success/20" },
  "how-it-works": { label: "How It Works", color: "text-alpmera-accent bg-alpmera-accent/10 border-alpmera-accent/20" },
  refunds: { label: "Refunds", color: "text-alpmera-primary bg-alpmera-primary/10 border-alpmera-primary/20" },
  general: { label: "General", color: "text-alpmera-text-light bg-alpmera-secondary border-alpmera-border" },
};

export function FAQItem({ question, answer, index, isMobile, category = "general" }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const categoryStyle = categoryConfig[category];

  return (
    <motion.div
      initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={
        isMobile
          ? { duration: 0.3 }
          : { duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }
      }
      className="rounded-lg border border-alpmera-border bg-white card-texture card-elevated overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-alpmera-secondary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-alpmera-primary focus:ring-inset"
        aria-expanded={isOpen}
      >
        <div className="flex-1 pr-4">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border mb-2 ${categoryStyle.color}`}>
            {categoryStyle.label}
          </span>
          <h3 className="text-lg font-semibold font-display text-alpmera-primary">
            {question}
          </h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0"
        >
          <svg
            className="w-5 h-5 text-alpmera-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.2 }
            }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-0">
              <p className="text-sm text-alpmera-text-light font-body leading-relaxed">
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
