-- ============================================================================
-- Autonomous Subscription Manager - Sample Data
-- Insert 5 users with complete subscription data
-- ============================================================================

-- Disable foreign key checks temporarily (if needed for data loading)
-- PostgreSQL will still enforce constraints, so we ensure proper order

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, max_usage_limit, is_active)
VALUES
  (
    'Basic',
    'Perfect for individuals and small projects',
    9.99,
    99.90,
    '["up_to_5_projects", "1000_api_calls_monthly", "100gb_storage", "email_support"]'::JSONB,
    '{"api_calls": 1000, "storage_gb": 100, "concurrent_users": 5}'::JSONB,
    true
  ),
  (
    'Pro',
    'For growing teams and enterprises',
    29.99,
    299.90,
    '["unlimited_projects", "100000_api_calls_monthly", "1tb_storage", "priority_support", "advanced_analytics", "webhooks"]'::JSONB,
    '{"api_calls": 100000, "storage_gb": 1000, "concurrent_users": 50}'::JSONB,
    true
  ),
  (
    'Enterprise',
    'Custom solutions for large organizations',
    99.99,
    999.90,
    '["unlimited_everything", "dedicated_account_manager", "sso", "advanced_security", "custom_integrations", "99.99_uptime_sla"]'::JSONB,
    '{"api_calls": 10000000, "storage_gb": 10000, "concurrent_users": 500}'::JSONB,
    true
  );

-- ============================================================================
-- USER 1: Alice Johnson
-- ============================================================================

INSERT INTO users (email, name, password_hash, status)
VALUES ('alice.johnson@example.com', 'Alice Johnson', '$2b$12$hash_example_alice_1234567890abcd', 'active');

INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew, billing_cycle, current_cycle_usage)
SELECT
  u.id,
  p.id,
  'active',
  '2025-11-15'::DATE,
  '2026-02-15'::DATE,
  true,
  'monthly',
  '{"api_calls": 245, "storage_gb": 12.5, "concurrent_users": 3}'::JSONB
FROM users u, subscription_plans p
WHERE u.email = 'alice.johnson@example.com' AND p.name = 'Basic';

-- Add subscription_id to user
UPDATE users SET subscription_id = (
  SELECT id FROM subscriptions WHERE user_id = (
    SELECT id FROM users WHERE email = 'alice.johnson@example.com'
  ) LIMIT 1
) WHERE email = 'alice.johnson@example.com';

-- Payment for Alice
INSERT INTO payments (subscription_id, amount, currency, status, payment_method, transaction_id, paid_at, metadata)
SELECT
  s.id,
  9.99,
  'USD',
  'paid',
  'stripe',
  'pi_stripe_alice_001',
  '2025-11-15 10:30:00 UTC',
  '{"invoice_id": "in_alice_001", "card_last_4": "4242"}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'alice.johnson@example.com') LIMIT 1;

-- Usage logs for Alice
INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'api_calls',
  125.00,
  '2025-12-10 14:22:00 UTC',
  '{"endpoint": "/api/data/fetch", "response_time_ms": 245}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'alice.johnson@example.com') LIMIT 1;

INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'storage',
  12.5,
  '2025-12-15 09:15:00 UTC',
  '{"storage_type": "documents"}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'alice.johnson@example.com') LIMIT 1;

-- ============================================================================
-- USER 2: Bob Smith
-- ============================================================================

INSERT INTO users (email, name, password_hash, status)
VALUES ('bob.smith@example.com', 'Bob Smith', '$2b$12$hash_example_bob_1234567890abcde', 'active');

INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew, billing_cycle, current_cycle_usage)
SELECT
  u.id,
  p.id,
  'active',
  '2025-10-01'::DATE,
  '2026-01-01'::DATE,
  true,
  'yearly',
  '{"api_calls": 45230, "storage_gb": 235.8, "concurrent_users": 28}'::JSONB
FROM users u, subscription_plans p
WHERE u.email = 'bob.smith@example.com' AND p.name = 'Pro';

UPDATE users SET subscription_id = (
  SELECT id FROM subscriptions WHERE user_id = (
    SELECT id FROM users WHERE email = 'bob.smith@example.com'
  ) LIMIT 1
) WHERE email = 'bob.smith@example.com';

INSERT INTO payments (subscription_id, amount, currency, status, payment_method, transaction_id, paid_at, metadata)
SELECT
  s.id,
  299.90,
  'USD',
  'paid',
  'stripe',
  'pi_stripe_bob_001',
  '2025-10-01 08:00:00 UTC',
  '{"invoice_id": "in_bob_001", "card_last_4": "5555"}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'bob.smith@example.com') LIMIT 1;

INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'api_calls',
  15000.00,
  '2025-12-20 16:45:00 UTC',
  '{"endpoint": "/api/analytics", "response_time_ms": 312}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'bob.smith@example.com') LIMIT 1;

INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'api_calls',
  30230.00,
  '2025-12-15 11:20:00 UTC',
  '{"endpoint": "/api/batch/process", "response_time_ms": 1205}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'bob.smith@example.com') LIMIT 1;

INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'storage',
  235.8,
  '2025-12-18 13:10:00 UTC',
  '{"storage_type": "archives"}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'bob.smith@example.com') LIMIT 1;

-- Webhook event for Bob's active subscription
INSERT INTO webhooks (event_type, subscription_id, payload, status, processed_at)
SELECT
  'new_subscription',
  s.id,
  '{
    "event_id": "evt_bob_001",
    "user_email": "bob.smith@example.com",
    "plan_name": "Pro",
    "billing_cycle": "yearly"
  }'::JSONB,
  'processed',
  '2025-10-01 08:15:00 UTC'
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'bob.smith@example.com') LIMIT 1;

-- ============================================================================
-- USER 3: Carol Davis
-- ============================================================================

INSERT INTO users (email, name, password_hash, status)
VALUES ('carol.davis@example.com', 'Carol Davis', '$2b$12$hash_example_carol_12345678901234', 'active');

INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew, billing_cycle, current_cycle_usage)
SELECT
  u.id,
  p.id,
  'trialing',
  '2025-12-20'::DATE,
  '2026-01-20'::DATE,
  true,
  'monthly',
  '{"api_calls": 850, "storage_gb": 45.2, "concurrent_users": 12}'::JSONB
FROM users u, subscription_plans p
WHERE u.email = 'carol.davis@example.com' AND p.name = 'Enterprise';

UPDATE users SET subscription_id = (
  SELECT id FROM subscriptions WHERE user_id = (
    SELECT id FROM users WHERE email = 'carol.davis@example.com'
  ) LIMIT 1
) WHERE email = 'carol.davis@example.com';

-- No payment yet for Carol (trialing)
-- Usage logs during trial
INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'api_calls',
  500.00,
  '2025-12-22 10:30:00 UTC',
  '{"endpoint": "/api/enterprise/custom", "response_time_ms": 450}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'carol.davis@example.com') LIMIT 1;

INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'api_calls',
  350.00,
  '2025-12-23 14:15:00 UTC',
  '{"endpoint": "/api/enterprise/query", "response_time_ms": 280}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'carol.davis@example.com') LIMIT 1;

INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'concurrent_users',
  12.00,
  '2025-12-24 09:00:00 UTC',
  '{"peak_time": true}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'carol.davis@example.com') LIMIT 1;

-- Webhook for trial start
INSERT INTO webhooks (event_type, subscription_id, payload, status, processed_at)
SELECT
  'new_subscription',
  s.id,
  '{
    "event_id": "evt_carol_001",
    "user_email": "carol.davis@example.com",
    "plan_name": "Enterprise",
    "trial_days": 30
  }'::JSONB,
  'processed',
  '2025-12-20 11:00:00 UTC'
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'carol.davis@example.com') LIMIT 1;

-- ============================================================================
-- USER 4: David Wilson
-- ============================================================================

INSERT INTO users (email, name, password_hash, status)
VALUES ('david.wilson@example.com', 'David Wilson', '$2b$12$hash_example_david_1234567890123', 'active');

INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew, billing_cycle, current_cycle_usage)
SELECT
  u.id,
  p.id,
  'canceled',
  '2025-06-15'::DATE,
  '2025-09-15'::DATE,
  false,
  'monthly',
  '{"api_calls": 1200, "storage_gb": 50.0, "concurrent_users": 8}'::JSONB
FROM users u, subscription_plans p
WHERE u.email = 'david.wilson@example.com' AND p.name = 'Pro';

UPDATE users SET subscription_id = (
  SELECT id FROM subscriptions WHERE user_id = (
    SELECT id FROM users WHERE email = 'david.wilson@example.com'
  ) LIMIT 1
) WHERE email = 'david.wilson@example.com';

-- Payments for David (multiple months before cancellation)
INSERT INTO payments (subscription_id, amount, currency, status, payment_method, transaction_id, paid_at, metadata)
SELECT
  s.id,
  29.99,
  'USD',
  'paid',
  'paypal',
  'txn_paypal_david_001',
  '2025-06-15 09:00:00 UTC',
  '{"paypal_transaction_id": "PP-001", "email": "david.wilson@paypal.com"}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'david.wilson@example.com') LIMIT 1;

INSERT INTO payments (subscription_id, amount, currency, status, payment_method, transaction_id, paid_at, metadata)
SELECT
  s.id,
  29.99,
  'USD',
  'paid',
  'paypal',
  'txn_paypal_david_002',
  '2025-07-15 09:00:00 UTC',
  '{"paypal_transaction_id": "PP-002", "email": "david.wilson@paypal.com"}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'david.wilson@example.com') LIMIT 1;

INSERT INTO payments (subscription_id, amount, currency, status, payment_method, transaction_id, paid_at, metadata)
SELECT
  s.id,
  29.99,
  'USD',
  'paid',
  'paypal',
  'txn_paypal_david_003',
  '2025-08-15 09:00:00 UTC',
  '{"paypal_transaction_id": "PP-003", "email": "david.wilson@paypal.com"}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'david.wilson@example.com') LIMIT 1;

-- Webhook for cancellation
INSERT INTO webhooks (event_type, subscription_id, payload, status, processed_at)
SELECT
  'subscription_canceled',
  s.id,
  '{
    "event_id": "evt_david_001",
    "user_email": "david.wilson@example.com",
    "plan_name": "Pro",
    "cancellation_reason": "switching_to_competitor"
  }'::JSONB,
  'processed',
  '2025-09-15 10:30:00 UTC'
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'david.wilson@example.com') LIMIT 1;

-- ============================================================================
-- USER 5: Emma Martinez
-- ============================================================================

INSERT INTO users (email, name, password_hash, status)
VALUES ('emma.martinez@example.com', 'Emma Martinez', '$2b$12$hash_example_emma_1234567890abcd', 'inactive');

INSERT INTO subscriptions (user_id, plan_id, status, start_date, end_date, auto_renew, billing_cycle, current_cycle_usage)
SELECT
  u.id,
  p.id,
  'paused',
  '2025-08-01'::DATE,
  '2026-02-01'::DATE,
  false,
  'yearly',
  '{"api_calls": 5500, "storage_gb": 120.3, "concurrent_users": 15}'::JSONB
FROM users u, subscription_plans p
WHERE u.email = 'emma.martinez@example.com' AND p.name = 'Pro';

UPDATE users SET subscription_id = (
  SELECT id FROM subscriptions WHERE user_id = (
    SELECT id FROM users WHERE email = 'emma.martinez@example.com'
  ) LIMIT 1
) WHERE email = 'emma.martinez@example.com';

-- Last successful payment
INSERT INTO payments (subscription_id, amount, currency, status, payment_method, transaction_id, paid_at, metadata)
SELECT
  s.id,
  299.90,
  'USD',
  'paid',
  'stripe',
  'pi_stripe_emma_001',
  '2025-08-01 07:30:00 UTC',
  '{"invoice_id": "in_emma_001", "card_last_4": "9999"}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'emma.martinez@example.com') LIMIT 1;

-- Failed renewal attempt
INSERT INTO payments (subscription_id, amount, currency, status, payment_method, transaction_id, paid_at, metadata)
SELECT
  s.id,
  299.90,
  'USD',
  'failed',
  'stripe',
  'pi_stripe_emma_002',
  NULL,
  '{"invoice_id": "in_emma_002", "error_code": "card_declined"}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'emma.martinez@example.com') LIMIT 1;

-- Usage logs
INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'api_calls',
  3500.00,
  '2025-11-10 15:45:00 UTC',
  '{"endpoint": "/api/reports/generate", "response_time_ms": 892}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'emma.martinez@example.com') LIMIT 1;

INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'api_calls',
  2000.00,
  '2025-11-15 12:20:00 UTC',
  '{"endpoint": "/api/data/sync", "response_time_ms": 654}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'emma.martinez@example.com') LIMIT 1;

INSERT INTO usage_logs (subscription_id, metric_type, quantity, logged_at, metadata)
SELECT
  s.id,
  'storage',
  120.3,
  '2025-11-20 08:00:00 UTC',
  '{"storage_type": "backups"}'::JSONB
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'emma.martinez@example.com') LIMIT 1;

-- Webhook for paused subscription
INSERT INTO webhooks (event_type, subscription_id, payload, status, processed_at)
SELECT
  'renewal_failed',
  s.id,
  '{
    "event_id": "evt_emma_001",
    "user_email": "emma.martinez@example.com",
    "plan_name": "Pro",
    "error": "payment_method_expired"
  }'::JSONB,
  'processed',
  '2025-12-01 10:00:00 UTC'
FROM subscriptions s
WHERE s.user_id = (SELECT id FROM users WHERE email = 'emma.martinez@example.com') LIMIT 1;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 5 Users created:
-- 1. Alice Johnson (alice.johnson@example.com) - Basic plan, Active
-- 2. Bob Smith (bob.smith@example.com) - Pro plan, Active (Yearly)
-- 3. Carol Davis (carol.davis@example.com) - Enterprise plan, Trialing
-- 4. David Wilson (david.wilson@example.com) - Pro plan, Canceled
-- 5. Emma Martinez (emma.martinez@example.com) - Pro plan, Paused (Yearly)
--
-- 3 Subscription Plans created:
-- 1. Basic - $9.99/mo, $99.90/yr
-- 2. Pro - $29.99/mo, $299.90/yr
-- 3. Enterprise - $99.99/mo, $999.90/yr
--
-- Total: 5 subscriptions, 8 payments, 13 usage logs, 5 webhooks
