import { useEffect, useState } from "react";

export default function SubscriberCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/landing/subscriber-count')
      .then(r => r.json())
      .then(data => setCount(data.count))
      .catch(() => setCount(null));
  }, []);

  if (!count || count < 10) return null; // Only show if we have at least 10 subscribers

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex -space-x-2">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-alpmera-primary border-2 border-background"
          />
        ))}
      </div>
      <span className="text-alpmera-text-light">
        <strong className="text-alpmera-primary font-semibold">{count}</strong> people on the early list
      </span>
    </div>
  );
}
