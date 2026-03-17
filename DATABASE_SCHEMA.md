# Autonomous Subscription Manager - Database Schema

Complete relational database schema for a subscription management system with PostgreSQL. Production-ready with soft deletes, UUID primary keys, comprehensive indexing, and automated triggers.

## Overview

This schema implements a robust subscription management platform supporting:
- Multiple subscription tiers (Basic, Pro, Enterprise)
- Usage-based metrics tracking
- Payment processing with multiple gateways (Stripe, PayPal)
- Webhook event management
- Automatic renewal and subscription lifecycle management

## Technology Stack

- **Database**: PostgreSQL 12+
- **Primary Keys**: UUID v4 (universally unique identifiers)
- **Deployment**: Compatible with PlanetScale, Supabase, AWS RDS, DigitalOcean, etc.
- **Soft Deletes**: All tables include `deleted_at` for non-destructive data retention

## Entity Relationship Diagram (ERD)

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK, UUID)       │
│ email (UNIQUE)      │
│ name                │
│ password_hash       │
│ status              │
│ subscription_id (FK)│◄─────────┐
│ created_at          │          │
│ updated_at          │          │
│ deleted_at          │          │
└─────────────────────┘          │
         │                       │
         │ (1:N)                 │ (1:1)
         │                       │
         ▼                       │
┌─────────────────────┐          │
│   subscriptions     │          │
├─────────────────────┤          │
│ id (PK, UUID)       │──────────┘
│ user_id (FK)────────┼──────────────────┐
│ plan_id (FK)────────┼──────────────────┤
│ status              │                  │
│ start_date          │                  │
│ end_date            │                  │
│ auto_renew          │                  │
│ billing_cycle       │                  │
│ current_cycle_usage │                  │
│ created_at          │                  │
│ updated_at          │                  │
│ deleted_at          │                  │
└─────────────────────┘                  │
    │        │                           │
    │        │ (1:N)                     │
    │        │                           │
    │        ▼                           │
    │   ┌──────────────────┐             │
    │   │   payments       │             │
    │   ├──────────────────┤             │
    │   │ id (PK, UUID)    │             │
    │   │ subscription_id  │             │
    │   │ amount           │             │
    │   │ status           │             │
    │   │ payment_method   │             │
    │   │ transaction_id   │             │
    │   │ paid_at          │             │
    │   │ metadata (JSONB) │             │
    │   │ created_at       │             │
    │   │ updated_at       │             │
    │   │ deleted_at       │             │
    │   └──────────────────┘             │
    │                                    │
    │        ┌────────────────────────────┘
    │        │
    │        ▼
    │   ┌──────────────────────┐
    │   │ subscription_plans   │
    │   ├──────────────────────┤
    │   │ id (PK, UUID)        │
    │   │ name (UNIQUE)        │
    │   │ description          │
    │   │ price_monthly        │
    │   │ price_yearly         │
    │   │ features (JSONB)     │
    │   │ max_usage_limit (JSON)
    │   │ is_active            │
    │   │ created_at           │
    │   │ updated_at           │
    │   │ deleted_at           │
    │   └──────────────────────┘
    │
    │ (1:N)
    │
    ▼
┌──────────────────────┐
│    usage_logs        │
├──────────────────────┤
│ id (PK, UUID)        │
│ subscription_id (FK) │
│ metric_type          │
│ quantity             │
│ logged_at            │
│ metadata (JSONB)     │
│ created_at           │
│ deleted_at           │
└──────────────────────┘

┌──────────────────────┐
│     webhooks         │
├──────────────────────┤
│ id (PK, UUID)        │
│ event_type           │
│ subscription_id (FK) │
│ payload (JSONB)      │
│ status               │
│ processed_at         │
│ retry_count          │
│ created_at           │
│ updated_at           │
│ deleted_at           │
└──────────────────────┘
```

## Schema Components

### Core Tables

#### 1. **users**
Stores user account information with subscription references.

**Key Columns:**
- `id` (UUID): Primary key, auto-generated
- `email` (VARCHAR): Unique identifier, indexed
- `name` (VARCHAR): User's display name
- `password_hash` (VARCHAR): Bcrypt-hashed password
- `status` (VARCHAR): `active` | `inactive` | `suspended`
- `subscription_id` (UUID FK): Current active subscription reference
- `created_at`, `updated_at`: Automatic timestamps
- `deleted_at`: Soft delete marker

**Indexes:**
- `idx_users_email`: For login and lookups
- `idx_users_status`: For user reporting
- `idx_users_subscription_id`: For subscription queries
- `idx_users_created_at`: For analytics and sorting

---

#### 2. **subscription_plans**
Available subscription tiers with pricing and features.

**Key Columns:**
- `id` (UUID): Primary key
- `name` (VARCHAR): Unique plan name (Basic, Pro, Enterprise)
- `price_monthly` (DECIMAL): Monthly billing amount
- `price_yearly` (DECIMAL): Annual billing amount with discount
- `features` (JSONB): Array of feature strings
  - Example: `["api_access", "advanced_analytics", "webhooks"]`
- `max_usage_limit` (JSONB): Usage quotas per billing cycle
  - Example: `{"api_calls": 100000, "storage_gb": 1000, "concurrent_users": 50}`
- `is_active` (BOOLEAN): Enable/disable plan offerings
- `created_at`, `updated_at`: Timestamps
- `deleted_at`: Soft delete marker

**Constraints:**
- Yearly price minimum: `price_yearly >= (price_monthly * 12 * 0.8)`
- Prices must be non-negative

**Indexes:**
- `idx_subscription_plans_name`: For plan lookups
- `idx_subscription_plans_is_active`: For active plan listings

---

#### 3. **subscriptions**
User subscriptions to plans with lifecycle and usage tracking.

**Key Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID FK): Reference to users table
- `plan_id` (UUID FK): Reference to subscription_plans table
- `status` (VARCHAR): `active` | `trialing` | `paused` | `canceled`
- `start_date` (DATE): Subscription start date
- `end_date` (DATE): Subscription expiration date (NULL for indefinite)
- `auto_renew` (BOOLEAN): Automatic renewal on expiration
- `billing_cycle` (VARCHAR): `monthly` | `yearly`
- `current_cycle_usage` (JSONB): Real-time usage tracking
  - Example: `{"api_calls": 45230, "storage_gb": 235.8, "concurrent_users": 28}`
- `created_at`, `updated_at`: Timestamps
- `deleted_at`: Soft delete marker

**Constraints:**
- `end_date > start_date` (logical date ordering)

**Indexes:**
- `idx_subscriptions_user_id`: User's subscriptions lookup
- `idx_subscriptions_plan_id`: Plan usage analysis
- `idx_subscriptions_status`: Subscription lifecycle reports
- `idx_subscriptions_start_date`: Temporal queries
- `idx_subscriptions_end_date`: Expiration tracking
- `idx_subscriptions_auto_renew`: Renewal batch processing

---

#### 4. **payments**
Payment transactions with multi-gateway support.

**Key Columns:**
- `id` (UUID): Primary key
- `subscription_id` (UUID FK): Related subscription
- `amount` (DECIMAL): Payment amount in currency
- `currency` (VARCHAR): ISO currency code (default: USD)
- `status` (VARCHAR): `pending` | `paid` | `failed` | `refunded` | `disputed`
- `payment_method` (VARCHAR): `stripe` | `paypal` | `bank_transfer`
- `transaction_id` (VARCHAR): Unique provider transaction ID
- `paid_at` (TIMESTAMP): Payment completion time
- `refunded_at` (TIMESTAMP): Refund completion time
- `failure_reason` (TEXT): Decline/failure details
- `metadata` (JSONB): Provider-specific data
  - Example: `{"invoice_id": "in_123", "card_last_4": "4242"}`
- `created_at`, `updated_at`: Timestamps
- `deleted_at`: Soft delete marker

**Constraints:**
- Amount must be positive
- Status/timestamp logical consistency: `status = 'paid' ⟹ paid_at IS NOT NULL`

**Indexes:**
- `idx_payments_subscription_id`: Subscription payment history
- `idx_payments_status`: Financial reporting
- `idx_payments_payment_method`: Gateway analysis
- `idx_payments_transaction_id`: Idempotency checks
- `idx_payments_paid_at`: Revenue recognition

---

#### 5. **usage_logs**
Detailed metric tracking for subscription usage.

**Key Columns:**
- `id` (UUID): Primary key
- `subscription_id` (UUID FK): Related subscription
- `metric_type` (VARCHAR): `api_calls` | `storage` | `bandwidth` | `compute_hours` | `concurrent_users`
- `quantity` (DECIMAL): Usage amount with decimal precision
- `logged_at` (TIMESTAMP): Event timestamp (UTC)
- `metadata` (JSONB): Event-specific context
  - Example: `{"endpoint": "/api/data/fetch", "response_time_ms": 245, "status_code": 200}`
- `created_at`: Log creation timestamp
- `deleted_at`: Soft delete marker

**Indexes:**
- `idx_usage_logs_subscription_id`: Subscription usage retrieval
- `idx_usage_logs_metric_type`: Metric aggregation
- `idx_usage_logs_logged_at`: Time-range queries
- `idx_usage_logs_subscription_metric`: Composite for efficiency

---

#### 6. **webhooks**
Event queue for subscription state changes and notifications.

**Key Columns:**
- `id` (UUID): Primary key
- `event_type` (VARCHAR): `renewal_failed` | `new_subscription` | `subscription_canceled` | `payment_received` | `payment_failed` | `usage_limit_reached`
- `subscription_id` (UUID FK): Related subscription (nullable for system events)
- `payload` (JSONB): Complete event data for audit trail
- `status` (VARCHAR): `pending` | `processed` | `failed` | `retrying`
- `processed_at` (TIMESTAMP): Event processing time
- `retry_count` (INTEGER): Delivery attempt count
- `last_error` (TEXT): Most recent delivery error
- `created_at`, `updated_at`: Timestamps
- `deleted_at`: Soft delete marker

**Indexes:**
- `idx_webhooks_event_type`: Event routing
- `idx_webhooks_subscription_id`: Subscription event history
- `idx_webhooks_status`: Processing queue management
- `idx_webhooks_processed_at`: Audit trail queries

---

### Database Views

#### 1. **active_subscriptions_view**
Materialized view for efficient active subscription queries.

```sql
SELECT
  s.id, s.user_id, u.email, u.name,
  s.plan_id, sp.name AS plan_name,
  sp.price_monthly, sp.price_yearly,
  s.status, s.start_date, s.end_date,
  s.auto_renew, s.billing_cycle,
  s.current_cycle_usage
FROM subscriptions s
JOIN users u ON s.user_id = u.id
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.deleted_at IS NULL
  AND s.status IN ('active', 'trialing')
  AND u.deleted_at IS NULL;
```

**Use Cases:**
- Dashboard active subscription counts
- User onboarding workflows
- Renewal batch processing

---

#### 2. **revenue_view**
Analytics view for financial reporting.

```sql
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
GROUP BY DATE_TRUNC('month', p.paid_at), sp.name;
```

**Use Cases:**
- Monthly recurring revenue (MRR) tracking
- Plan-specific analytics
- Churn analysis

---

#### 3. **user_subscription_summary**
User-centric view combining all subscription data.

```sql
SELECT
  u.id, u.email, u.name,
  s.id AS subscription_id,
  sp.name AS plan_name,
  s.status AS subscription_status,
  s.end_date AS subscription_ends,
  s.auto_renew
FROM users u
LEFT JOIN subscriptions s ON u.subscription_id = s.id AND s.deleted_at IS NULL
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE u.deleted_at IS NULL;
```

**Use Cases:**
- Admin dashboards
- User management interfaces
- Subscription analytics

---

### Triggers and Automation

#### 1. **Automatic Timestamp Updates**
All tables have `BEFORE UPDATE` triggers that automatically set `updated_at` to current timestamp.

**Affected Tables:**
- `users_updated_at_trigger`
- `subscriptions_updated_at_trigger`
- `payments_updated_at_trigger`
- `subscription_plans_updated_at_trigger`
- `webhooks_updated_at_trigger`

---

#### 2. **Subscription End Date Auto-Renewal**
Triggered when subscription status changes from `trialing/paused` to `active`.

```sql
FUNCTION: auto_update_subscription_end_date()
-- Extends end_date based on billing_cycle
-- monthly: +1 month
-- yearly: +1 year
```

**Example:**
- User upgrades from trialing → active
- If `billing_cycle = 'monthly'`, `end_date` becomes `start_date + 1 month`
- Ensures continuous coverage without gaps

---

#### 3. **User Subscription Reference**
Auto-sets `subscription_id` on user when first subscription created.

```sql
FUNCTION: set_user_subscription()
-- Runs AFTER INSERT on subscriptions
-- Sets user.subscription_id if NULL
-- Only for 'active' or 'trialing' subscriptions
```

---

## Deployment Guide

### PlanetScale (MySQL-compatible)

1. **Create Database:**
   ```bash
   pscale database create autonomous-subscription-manager
   ```

2. **Apply Schema:**
   ```bash
   pscale shell autonomous-subscription-manager main < schema.sql
   ```

3. **Seed Data:**
   ```bash
   pscale shell autonomous-subscription-manager main < data.sql
   ```

4. **Connection String:**
   ```
   mysql://user:password@aws.connect.psdb.cloud/autonomous-subscription-manager?sslaccept=strict
   ```

### Supabase (PostgreSQL-managed)

1. **Create Project:**
   - Log in to [Supabase](https://supabase.com)
   - Create new project
   - Copy connection string

2. **Apply Schema via SQL Editor:**
   - Paste `schema.sql` content into Supabase SQL Editor
   - Execute queries

3. **Insert Sample Data:**
   - Paste `data.sql` content
   - Execute

4. **Connection Details:**
   - Available in project settings → Database
   - Use for application connection pooling

### Local PostgreSQL Development

```bash
# Create database
createdb autonomous_subscription_manager

# Apply schema
psql autonomous_subscription_manager < schema.sql

# Load sample data
psql autonomous_subscription_manager < data.sql

# Verify setup
psql autonomous_subscription_manager -c "SELECT COUNT(*) FROM users;"
```

---

## Sample Data Overview

The `data.sql` file includes 5 complete user scenarios:

### User 1: Alice Johnson
- **Email:** alice.johnson@example.com
- **Plan:** Basic ($9.99/mo)
- **Status:** Active
- **Cycle:** Monthly
- **Usage:** 245 API calls, 12.5 GB storage
- **Payment:** Stripe, paid

### User 2: Bob Smith
- **Email:** bob.smith@example.com
- **Plan:** Pro ($299.90/yr)
- **Status:** Active
- **Cycle:** Yearly
- **Usage:** 45,230 API calls, 235.8 GB storage, 28 concurrent users
- **Payments:** Multiple successful transactions

### User 3: Carol Davis
- **Email:** carol.davis@example.com
- **Plan:** Enterprise ($99.99/mo)
- **Status:** Trialing
- **Duration:** 30 days (ends 2026-01-20)
- **Usage:** 850 API calls, 45.2 GB storage
- **Webhooks:** Trial start event

### User 4: David Wilson
- **Email:** david.wilson@example.com
- **Plan:** Pro ($29.99/mo)
- **Status:** Canceled
- **Duration:** 3 months (Jun-Sep 2025)
- **Payments:** 3 successful PayPal transactions
- **Webhooks:** Cancellation event with reason

### User 5: Emma Martinez
- **Email:** emma.martinez@example.com
- **Plan:** Pro ($299.90/yr)
- **Status:** Paused
- **Account:** Inactive
- **Issue:** Failed renewal (card declined)
- **Webhooks:** Renewal failure event

---

## Key Features

✅ **UUID Primary Keys** - Distributed, privacy-preserving identifiers  
✅ **Soft Deletes** - Non-destructive data retention via `deleted_at`  
✅ **Automatic Timestamps** - `created_at`, `updated_at` management  
✅ **Comprehensive Indexing** - Optimized query performance  
✅ **JSONB Flexibility** - Features, usage, metadata extensibility  
✅ **Foreign Key Constraints** - Referential integrity  
✅ **Check Constraints** - Valid status values, positive amounts  
✅ **Business Triggers** - Automated renewal and subscription management  
✅ **Materialized Views** - Pre-computed analytics queries  
✅ **Multi-Gateway Support** - Stripe, PayPal, bank transfers  
✅ **Soft Delete Filtering** - All queries exclude deleted records  
✅ **Audit Trail** - Complete history via webhooks and metadata  

---

## Query Examples

### Active Subscriptions by Plan
```sql
SELECT sp.name, COUNT(*) as count
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status = 'active'
  AND s.deleted_at IS NULL
GROUP BY sp.name;
```

### Monthly Recurring Revenue (MRR)
```sql
SELECT 
  DATE_TRUNC('month', s.start_date)::DATE as month,
  SUM(CASE WHEN sp.name = 'Pro' THEN sp.price_monthly ELSE 0 END) * 12 / 365 as mrr
FROM active_subscriptions_view v
GROUP BY DATE_TRUNC('month', v.start_date);
```

### Usage Approaching Limits
```sql
SELECT u.email, sp.max_usage_limit -> 'api_calls' as limit, 
       SUM(ul.quantity) as used
FROM usage_logs ul
JOIN subscriptions s ON ul.subscription_id = s.id
JOIN users u ON s.user_id = u.id
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE DATE_TRUNC('month', ul.logged_at) = DATE_TRUNC('month', NOW())
GROUP BY u.email, sp.max_usage_limit
HAVING SUM(ul.quantity) > (sp.max_usage_limit -> 'api_calls')::numeric * 0.8;
```

### Failed Renewals to Process
```sql
SELECT s.id, u.email, sp.name, p.failure_reason
FROM subscriptions s
JOIN users u ON s.user_id = u.id
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN payments p ON s.id = p.subscription_id
WHERE s.status = 'paused'
  AND s.deleted_at IS NULL
  AND p.status = 'failed'
  AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;
```

---

## Performance Optimization

### Index Strategy
- **Selective Indexes**: All include `WHERE deleted_at IS NULL` to exclude soft-deleted records
- **Composite Indexes**: `(subscription_id, metric_type)` for joined queries
- **Timestamp Indexes**: `created_at`, `updated_at` for time-range queries

### Query Optimization Tips
1. **Use Views** - `active_subscriptions_view` for common joins
2. **Batch Operations** - Webhook processing with batch updates
3. **Connection Pooling** - Recommended for high-traffic applications
4. **Partitioning** - Consider time-based partitioning for `usage_logs` at scale

---

## Compliance & Security

- ✅ **GDPR Compliance** - Soft delete support for "right to be forgotten"
- ✅ **Data Integrity** - Foreign keys prevent orphaned records
- ✅ **Audit Trail** - Complete timestamps and webhook history
- ✅ **Password Hashing** - Application-level bcrypt (not stored as plaintext)
- ✅ **Transaction Safety** - ACID-compliant with proper constraints

---

## Files Included

1. **schema.sql** - DDL with tables, indexes, views, triggers, functions
2. **data.sql** - DML with 5 users, 3 plans, and complete lifecycle data
3. **README.md** - This comprehensive documentation

---

## Getting Started

1. **Choose your database provider** (PlanetScale, Supabase, local PostgreSQL)
2. **Execute `schema.sql`** to create all tables, indexes, and functions
3. **Execute `data.sql`** to load sample data
4. **Query `active_subscriptions_view`** to verify installation
5. **Integrate with your application** using the provided connection string

---

## Support & Questions

For issues with:
- **Schema Design**: Review the ERD and table comments
- **Indexes**: Check `idx_*` naming convention and selectivity
- **Triggers**: See trigger function definitions for automation logic
- **Views**: Query definitions are fully documented with comments

---

**Last Updated:** January 25, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
