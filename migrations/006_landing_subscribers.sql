-- 006_landing_subscribers.sql
CREATE TABLE IF NOT EXISTS landing_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'alpmera.com',
  interest_tags text[] NULL,
  notes text NULL,
  recommendation_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz NULL,
  last_submitted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT landing_subscribers_status_check CHECK (status IN ('active', 'unsubscribed'))
);
