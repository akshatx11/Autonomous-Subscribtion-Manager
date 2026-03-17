-- ============================================================================
-- Autonomous Subscription Manager - Database Schema
-- PostgreSQL with UUID primary keys, soft deletes, and timestamps
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_subscription_id ON users(subscription_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL CHECK (price_monthly >= 0),
  price_yearly DECIMAL(10, 2) NOT NULL CHECK (price_yearly >= 0),
  features JSONB DEFAULT '{}' NOT NULL,
  max_usage_limit JSONB DEFAULT '{}' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_subscription_plans_name ON subscription_plans(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active) WHERE deleted_at IS NULL;

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'paused', 'canceled')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  billing_cycle VARCHAR(10) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_cycle_usage JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscriptions_status ON subscriptions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscriptions_start_date ON subscriptions(start_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_subscriptions_auto_renew ON subscriptions(auto_renew) WHERE deleted_at IS NULL;

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'disputed')),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'bank_transfer')),
  transaction_id VARCHAR(255) UNIQUE,
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_subscription_id ON payments(subscription_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_status ON payments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_payment_method ON payments(payment_method) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_paid_at ON payments(paid_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- USAGE LOGS TABLE
-- ============================================================================
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  metric_type VARCHAR(100) NOT NULL CHECK (metric_type IN ('api_calls', 'storage', 'bandwidth', 'compute_hours', 'concurrent_users')),
  quantity DECIMAL(15, 4) NOT NULL CHECK (quantity >= 0),
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_usage_logs_subscription_id ON usage_logs(subscription_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_usage_logs_metric_type ON usage_logs(metric_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_usage_logs_logged_at ON usage_logs(logged_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_usage_logs_subscription_metric ON usage_logs(subscription_id, metric_type) WHERE deleted_at IS NULL;

-- ============================================================================
-- WEBHOOKS TABLE
-- ============================================================================
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL CHECK (event_type IN ('renewal_failed', 'new_subscription', 'subscription_canceled', 'payment_received', 'payment_failed', 'usage_limit_reached')),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed', 'retrying')),
  processed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_webhooks_event_type ON webhooks(event_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_webhooks_subscription_id ON webhooks(subscription_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_webhooks_status ON webhooks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_webhooks_processed_at ON webhooks(processed_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active subscriptions with user and plan details
CREATE VIEW active_subscriptions_view AS
SELECT
  s.id,
  s.user_id,
  u.email,
  u.name,
  s.plan_id,
  sp.name AS plan_name,
  sp.price_monthly,
  sp.price_yearly,
  s.status,
  s.start_date,
  s.end_date,
  s.auto_renew,
  s.billing_cycle,
  s.current_cycle_usage,
  s.created_at,
  s.updated_at
FROM subscriptions s
JOIN users u ON s.user_id = u.id
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.deleted_at IS NULL
  AND s.status IN ('active', 'trialing')
  AND u.deleted_at IS NULL;

-- Revenue view for analytics
CREATE VIEW revenue_view AS
SELECT
  DATE_TRUNC('month', p.paid_at)::DATE AS payment_month,
  sp.name AS plan_name,
  COUNT(*) AS payment_count,
  SUM(p.amount) AS total_revenue,
  AVG(p.amount) AS average_payment
FROM payments p
JOIN subscriptions s ON p.subscription_id = s.id
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE p.status = 'paid'
  AND p.deleted_at IS NULL
  AND s.deleted_at IS NULL
GROUP BY DATE_TRUNC('month', p.paid_at), sp.name;

-- User subscription summary
CREATE VIEW user_subscription_summary AS
SELECT
  u.id,
  u.email,
  u.name,
  COALESCE(s.id, NULL) AS subscription_id,
  COALESCE(sp.name, 'None') AS plan_name,
  COALESCE(s.status, 'no_subscription') AS subscription_status,
  COALESCE(s.end_date, NULL) AS subscription_ends,
  COALESCE(s.auto_renew, false) AS auto_renew
FROM users u
LEFT JOIN subscriptions s ON u.subscription_id = s.id AND s.deleted_at IS NULL
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id AND sp.deleted_at IS NULL
WHERE u.deleted_at IS NULL;

-- ============================================================================
-- TRIGGER FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp on users
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Auto-update updated_at timestamp on subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at_trigger
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriptions_updated_at();

-- Auto-update updated_at timestamp on payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at_trigger
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_payments_updated_at();

-- Auto-update updated_at timestamp on subscription_plans
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_plans_updated_at_trigger
BEFORE UPDATE ON subscription_plans
FOR EACH ROW
EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Auto-update updated_at timestamp on webhooks
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER webhooks_updated_at_trigger
BEFORE UPDATE ON webhooks
FOR EACH ROW
EXECUTE FUNCTION update_webhooks_updated_at();

-- Auto-update subscription end_date on renewal
CREATE OR REPLACE FUNCTION auto_update_subscription_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.end_date IS NOT NULL THEN
    -- If subscription is active and has an end_date, extend it based on billing cycle
    IF NEW.billing_cycle = 'monthly' THEN
      NEW.end_date = NEW.start_date + INTERVAL '1 month';
    ELSIF NEW.billing_cycle = 'yearly' THEN
      NEW.end_date = NEW.start_date + INTERVAL '1 year';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_auto_renew_trigger
BEFORE UPDATE ON subscriptions
FOR EACH ROW
WHEN (NEW.status = 'active' AND OLD.status IN ('trialing', 'paused'))
EXECUTE FUNCTION auto_update_subscription_end_date();

-- Automatically set subscription for user when created
CREATE OR REPLACE FUNCTION set_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's subscription_id if this is their first active subscription
  UPDATE users
  SET subscription_id = NEW.id
  WHERE id = NEW.user_id AND subscription_id IS NULL AND deleted_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_set_user_trigger
AFTER INSERT ON subscriptions
FOR EACH ROW
WHEN (NEW.status IN ('active', 'trialing'))
EXECUTE FUNCTION set_user_subscription();

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure payment dates are logical
ALTER TABLE payments
ADD CONSTRAINT valid_payment_dates CHECK (
  (status = 'paid' AND paid_at IS NOT NULL) OR
  (status IN ('pending', 'failed', 'disputed') AND paid_at IS NULL) OR
  (status = 'refunded' AND refunded_at IS NOT NULL)
);

-- Ensure subscription dates are logical
ALTER TABLE subscriptions
ADD CONSTRAINT valid_subscription_dates CHECK (
  end_date IS NULL OR end_date > start_date
);

-- Ensure yearly price is greater than or equal to monthly price * 12
ALTER TABLE subscription_plans
ADD CONSTRAINT yearly_price_minimum CHECK (
  price_yearly >= (price_monthly * 12 * 0.8)
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Core user accounts with subscription reference';
COMMENT ON TABLE subscription_plans IS 'Available subscription plan tiers with pricing and features';
COMMENT ON TABLE subscriptions IS 'User subscriptions to plans with usage tracking';
COMMENT ON TABLE payments IS 'Payment transactions for subscription renewals';
COMMENT ON TABLE usage_logs IS 'Detailed usage metrics tracked per subscription';
COMMENT ON TABLE webhooks IS 'System events triggered by subscription state changes';

COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password, never stored in plain text';
COMMENT ON COLUMN subscription_plans.features IS 'JSON array of feature strings, e.g., ["api_access", "analytics"]';
COMMENT ON COLUMN subscription_plans.max_usage_limit IS 'JSON object with usage limits, e.g., {"api_calls": 10000, "storage_gb": 100}';
COMMENT ON COLUMN subscriptions.current_cycle_usage IS 'JSON object tracking usage within current billing cycle';
COMMENT ON COLUMN payments.metadata IS 'Provider-specific metadata (Stripe invoice ID, PayPal transaction ID, etc.)';
COMMENT ON COLUMN usage_logs.metadata IS 'Additional context about the usage event (e.g., endpoint, user_agent)';
COMMENT ON COLUMN webhooks.payload IS 'Complete webhook event payload for audit trail';
