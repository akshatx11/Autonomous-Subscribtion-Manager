# Autonomous Subscription Manager - Backend Setup Guide

Complete Node.js/Express + Prisma ORM integration with PostgreSQL for the Autonomous Subscription Manager platform.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Database Configuration](#database-configuration)
4. [API Endpoints](#api-endpoints)
5. [Authentication](#authentication)
6. [Error Handling](#error-handling)
7. [Deployment](#deployment)
8. [Environment Variables](#environment-variables)

## 🔧 Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 12+ (or PlanetScale, Supabase)
- Git

## 📦 Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project directory
cd asm2

# Install dependencies
npm install
# or
pnpm install
```

New dependencies added:
- `@prisma/client@^5.21.1` - Prisma ORM client
- `prisma@^5.21.1` - Prisma CLI
- `jsonwebtoken@^9.1.2` - JWT authentication
- `bcryptjs@^2.4.3` - Password hashing
- `mysql2@^3.10.3` - MySQL driver (optional)
- `swr@^2.2.5` - React data fetching hook

### 2. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your database credentials
nano .env.local
```

**Required variables:**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/autonomous_subscription_manager
JWT_SECRET=your-super-secret-key-here
NODE_ENV=development
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

This generates type-safe Prisma Client from your schema.

### 4. Push Schema to Database

Two options:

**Option A: Database Push (Development)**
```bash
npm run prisma:push
```
Use this for rapid development. Directly syncs your Prisma schema to the database.

**Option B: Create Migrations (Production)**
```bash
npm run prisma:migrate -- --name init
```
Creates a migration file that can be version controlled.

### 5. Seed Database

```bash
npm run prisma:seed
```

This creates:
- 3 subscription plans (Basic, Pro, Enterprise)
- 3 sample users with active subscriptions
- Test data for development

## 🗄️ Database Configuration

### PostgreSQL (Recommended)

**Connection String Format:**
```
postgresql://user:password@host:port/database?schema=public
```

**Example (Local):**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/asm_dev
```

**Connection Pooling:**

For production, use a connection pool:

- **Supabase**: Built-in connection pooling
- **PlanetScale**: Built-in connection pooling
- **PgBouncer**: Standalone tool
- **Prisma Data Proxy**: Managed pooling service

### MySQL (Alternative)

```env
DATABASE_URL=mysql://user:password@host:port/database
```

Requires `mysql2` driver (already in package.json).

## 🔐 Authentication & Authorization

### JWT-Based Authentication

1. **User Login**
```javascript
import jwt from "jsonwebtoken";

const token = jwt.sign(
  { sub: userId, email: userEmail },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
```

2. **Protected Routes**

All API routes require `Authorization: Bearer <token>` header.

```javascript
const authHeader = req.headers.get("authorization");
const token = authHeader.slice(7); // Remove "Bearer "
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const userId = decoded.sub;
```

### Middleware Stack

```
Request
  ↓
authMiddleware (JWT verification)
  ↓
subscriptionRequired (check active subscription)
  ↓
usageLimitCheck (check rate limits)
  ↓
Handler
```

**Example Usage:**

```javascript
import {
  authMiddleware,
  subscriptionRequired,
  usageLimitCheck,
} from "@/lib/middleware";

// Public endpoint
app.get("/api/plans", getPlans);

// Requires auth
app.get("/api/subscriptions", authMiddleware, getSubscriptions);

// Requires active subscription
app.post(
  "/api/usage",
  authMiddleware,
  subscriptionRequired,
  usageLimitCheck("API_CALLS"),
  logUsage
);
```

## 🔌 API Endpoints

### Subscriptions

#### GET /api/subscriptions
Fetch user's subscriptions

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status (ACTIVE, TRIALING, PAUSED, CANCELED)

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "planName": "Pro",
      "status": "ACTIVE",
      "startDate": "2025-01-15",
      "endDate": "2026-01-15",
      "autoRenew": true,
      "billingCycle": "YEARLY",
      "lastPayment": { "status": "PAID", "amount": 299.90 },
      "recentUsage": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Example:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/subscriptions?limit=5&status=ACTIVE"
```

---

#### POST /api/subscriptions
Create new subscription

**Request Body:**
```json
{
  "planId": "550e8400-e29b-41d4-a716-446655440000",
  "billingCycle": "MONTHLY",
  "autoRenew": true
}
```

**Response:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "planName": "Pro",
    "status": "TRIALING",
    "startDate": "2025-01-25",
    "endDate": "2025-02-25",
    "billingCycle": "MONTHLY"
  },
  "message": "Subscription created successfully"
}
```

---

### Usage Logging

#### POST /api/usage
Log usage metric

**Request Body:**
```json
{
  "metricType": "API_CALLS",
  "quantity": 125.5,
  "metadata": {
    "endpoint": "/api/data/fetch",
    "responseTime": 245
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "subscriptionId": "550e8400-e29b-41d4-a716-446655440000",
    "metricType": "API_CALLS",
    "quantity": 125.5,
    "loggedAt": "2025-01-25T14:30:00Z"
  },
  "message": "Usage logged successfully"
}
```

**Error (Usage Limit Exceeded):**
```json
{
  "error": "USAGE_LIMIT_EXCEEDED",
  "message": "Usage limit for API_CALLS would be exceeded",
  "usage": {
    "limit": 100000,
    "currentUsage": 99875.5,
    "percentageUsed": 99.88,
    "requestedQuantity": 125.5
  }
}
```

---

#### GET /api/usage
Fetch usage logs

**Query Parameters:**
- `metricType` - Filter by metric type
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `page` - Page number
- `limit` - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "subscriptionId": "550e8400-e29b-41d4-a716-446655440000",
      "metricType": "API_CALLS",
      "quantity": 125.5,
      "loggedAt": "2025-01-25T14:30:00Z",
      "metadata": { "endpoint": "/api/data/fetch" }
    }
  ],
  "aggregation": [
    {
      "metricType": "API_CALLS",
      "totalUsage": 45230
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## ⚠️ Error Handling

### Database Errors

All API routes implement automatic retry logic:

```javascript
executeWithRetry(
  () => prisma.subscription.findMany(...),
  3,        // max 3 retries
  30000     // 30 second timeout
);
```

**Exponential Backoff:**
- Attempt 1: immediate
- Attempt 2: wait 100ms
- Attempt 3: wait 200ms

### Common Error Responses

| Error | Status | Cause |
|-------|--------|-------|
| `UNAUTHORIZED` | 401 | Missing/invalid JWT |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `NO_SUBSCRIPTION` | 403 | User has no active subscription |
| `SUBSCRIPTION_EXPIRED` | 403 | Subscription end date passed |
| `USAGE_LIMIT_EXCEEDED` | 429 | Usage limit reached |
| `DATABASE_TIMEOUT` | 504 | Query timeout |
| `INTERNAL_ERROR` | 500 | Server error |

**Example Error Response:**
```json
{
  "error": "USAGE_LIMIT_EXCEEDED",
  "message": "Usage limit for API_CALLS would be exceeded",
  "usage": {
    "limit": 100000,
    "currentUsage": 99875.5,
    "percentageUsed": 99.88
  }
}
```

---

## 💾 React Hooks

### useSubscription

Fetch user's current subscription.

```javascript
import { useSubscription } from "@/lib/hooks";

export function MyComponent() {
  const { subscription, isLoading, error } = useSubscription();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Plan: {subscription?.planName}</div>;
}
```

### useUsageLogs

Fetch usage logs with filtering.

```javascript
import { useUsageLogs } from "@/lib/hooks";

const { usageLogs, aggregation, pagination } = useUsageLogs("API_CALLS", {
  limit: 20,
  page: 1,
  startDate: "2025-01-01",
  endDate: "2025-01-31",
});
```

### useLogUsage

Log a usage event.

```javascript
import { useLogUsage } from "@/lib/hooks";

const { logUsage, isLoading, error } = useLogUsage();

async function trackApiCall() {
  try {
    await logUsage("API_CALLS", 1, {
      endpoint: "/api/data",
      responseTime: 245,
    });
  } catch (err) {
    console.error("Failed to log usage:", err);
  }
}
```

### useCreateSubscription

Create a new subscription.

```javascript
import { useCreateSubscription } from "@/lib/hooks";

const { createSubscription, isLoading } = useCreateSubscription();

await createSubscription(planId, "MONTHLY", true);
```

---

## 🚀 Deployment

### Supabase Deployment

```bash
# 1. Create Supabase project
# 2. Copy connection string to .env

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Sync schema to Supabase
npm run prisma:push

# 5. Deploy Next.js to Vercel
npm run build
```

### PlanetScale Deployment

```bash
# 1. Create PlanetScale database
pscale database create asm

# 2. Set connection string
DATABASE_URL=mysql://root:password@aws.connect.psdb.cloud/asm?sslaccept=strict

# 3. Create development branch for schema changes
pscale branch create asm init

# 4. Push changes
npm run prisma:push

# 5. Create production deployment request
pscale deploy-request create asm init

# 6. Review and merge request
pscale deploy-request deploy asm <deploy-request-number>
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
RUN npm run prisma:generate

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 📝 Environment Variables

See [.env.example](.env.example) for complete list.

**Critical Variables:**

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d

# Application
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
PORT=3000
```

---

## 🔄 Common Tasks

### View Database in Studio

```bash
npm run prisma:studio
```

Opens interactive database browser at `http://localhost:5555`

### Create Migration

```bash
npm run prisma:migrate -- --name add_new_field
```

### Reset Database (Development Only)

```bash
npm run prisma:migrate reset
```

⚠️ WARNING: Destroys all data. Development only!

### Generate Types

```bash
npm run prisma:generate
```

Creates TypeScript types for all models.

---

## 📚 Files Overview

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Prisma ORM schema with all models |
| `lib/db.js` | PrismaClient instance with retry logic |
| `lib/middleware.js` | JWT auth & subscription verification |
| `lib/hooks.js` | React hooks for data fetching |
| `app/api/subscriptions/route.js` | Subscription endpoints |
| `app/api/usage/route.js` | Usage logging endpoints |
| `prisma/seed.js` | Database seed script |
| `.env.example` | Environment variable template |

---

## 🤝 Contributing

When adding new API routes:

1. Add model to `prisma/schema.prisma`
2. Run `npm run prisma:generate`
3. Create route in `app/api/[resource]/route.js`
4. Add error handling & retry logic
5. Document in this README

---

## 📞 Support

For issues with:

- **Prisma**: [prisma.io/docs](https://prisma.io/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Database**: See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

---

**Last Updated:** January 25, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
