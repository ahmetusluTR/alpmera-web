-- 007_product_requests.sql
-- Product Requests feature: Community-submitted product ideas with voting

-- Create enums
CREATE TYPE product_request_status AS ENUM (
  'not_reviewed',
  'in_review',
  'rejected',
  'accepted',
  'failed_in_campaign',
  'successful_in_campaign'
);

CREATE TYPE sku_verification_status AS ENUM (
  'pending',
  'verified',
  'unverified',
  'error'
);

-- Product Requests table
CREATE TABLE IF NOT EXISTS product_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submission data
  product_name text NOT NULL,
  category text,
  input_sku text,
  reference_url text NOT NULL,
  reason text,

  -- Submitter info (optional, for notifications)
  submitter_email text,
  submitter_city text,
  submitter_state text,
  notify_on_campaign boolean DEFAULT false,

  -- SKU verification
  derived_sku text,
  canonical_product_id text,
  verification_status sku_verification_status DEFAULT 'pending',
  verification_reason text,
  verification_attempted_at timestamptz,
  verification_retry_count integer DEFAULT 0,

  -- Status & lifecycle
  status product_request_status DEFAULT 'not_reviewed',
  status_changed_at timestamptz,
  status_changed_by text,
  status_change_reason text,

  -- Voting
  vote_count integer DEFAULT 0,

  -- Anti-abuse
  submitter_ip text,
  submitter_anon_id text,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for product_requests
CREATE INDEX product_requests_status_idx ON product_requests(status);
CREATE INDEX product_requests_vote_count_idx ON product_requests(vote_count);
CREATE INDEX product_requests_created_at_idx ON product_requests(created_at);
CREATE INDEX product_requests_email_idx ON product_requests(submitter_email);
CREATE INDEX product_requests_verification_status_idx ON product_requests(verification_status);

-- Product Request Votes table
CREATE TABLE IF NOT EXISTS product_request_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_request_id uuid NOT NULL REFERENCES product_requests(id) ON DELETE CASCADE,

  -- Voter identity (one of these must be present)
  anon_id text,
  ip_hash text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique indexes for vote uniqueness (partial indexes for nullable columns)
CREATE UNIQUE INDEX product_request_votes_anon_unique
  ON product_request_votes(product_request_id, anon_id)
  WHERE anon_id IS NOT NULL;

CREATE UNIQUE INDEX product_request_votes_ip_unique
  ON product_request_votes(product_request_id, ip_hash)
  WHERE ip_hash IS NOT NULL;

CREATE UNIQUE INDEX product_request_votes_user_unique
  ON product_request_votes(product_request_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX product_request_votes_request_idx ON product_request_votes(product_request_id);

-- Product Request Events table (audit log)
CREATE TABLE IF NOT EXISTS product_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_request_id uuid NOT NULL REFERENCES product_requests(id) ON DELETE CASCADE,

  event_type text NOT NULL,
  actor text,
  previous_value text,
  new_value text,
  metadata text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_request_events_request_idx ON product_request_events(product_request_id);
CREATE INDEX product_request_events_type_idx ON product_request_events(event_type);

-- SKU Verification Jobs table
CREATE TABLE IF NOT EXISTS sku_verification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_request_id uuid NOT NULL REFERENCES product_requests(id) ON DELETE CASCADE UNIQUE,

  status text NOT NULL DEFAULT 'pending',
  attempt_count integer DEFAULT 0,
  max_attempts integer DEFAULT 2,

  -- Results cache
  fetched_content text,
  extracted_data text,

  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  completed_at timestamptz,
  error_message text,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sku_verification_jobs_status_idx ON sku_verification_jobs(status);
CREATE INDEX sku_verification_jobs_next_attempt_idx ON sku_verification_jobs(next_attempt_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER product_requests_updated_at_trigger
  BEFORE UPDATE ON product_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_product_requests_updated_at();
