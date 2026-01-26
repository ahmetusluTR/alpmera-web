// Rate limiting for form submissions

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'early-access': { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  'demand-suggestion': { maxAttempts: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
};

export function checkRateLimit(formId: string): { allowed: boolean; remainingTime?: number } {
  const key = `alpmera_rate_${formId}`;
  const config = RATE_LIMITS[formId];

  if (!config) return { allowed: true };

  const stored = localStorage.getItem(key);
  const now = Date.now();

  if (!stored) {
    localStorage.setItem(key, JSON.stringify({ attempts: 1, firstAttempt: now }));
    return { allowed: true };
  }

  const data = JSON.parse(stored);

  // Reset if window expired
  if (now - data.firstAttempt > config.windowMs) {
    localStorage.setItem(key, JSON.stringify({ attempts: 1, firstAttempt: now }));
    return { allowed: true };
  }

  // Check if limit exceeded
  if (data.attempts >= config.maxAttempts) {
    const remainingTime = config.windowMs - (now - data.firstAttempt);
    return { allowed: false, remainingTime };
  }

  // Increment attempts
  data.attempts += 1;
  localStorage.setItem(key, JSON.stringify(data));
  return { allowed: true };
}

export function formatRemainingTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''}`;
}
