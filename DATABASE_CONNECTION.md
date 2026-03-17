# Database Connection & Integration Guide

Complete guide to connect your ASM database and make all endpoints workable.

## 🎯 Current Status

✅ **Website Frontend**: Running at http://localhost:3000  
✅ **API Routes**: Created and configured  
✅ **Prisma Schema**: Defined with all models  
⏳ **Database**: Needs connection setup  

---

## 📋 What You Need to Do

### STEP 1: Choose Your Database (2 min)

#### Option A: Supabase (Recommended - Free, Cloud PostgreSQL)
- **Pros**: Free tier, no setup, managed backups, real-time features
- **Best for**: Development and production
- **Setup time**: 5 minutes

#### Option B: Docker PostgreSQL (Local)
- **Pros**: Full control, runs locally, free
- **Best for**: Local development
- **Setup time**: 2 minutes (if Docker installed)

#### Option C: PlanetScale (Free, Cloud MySQL)
- **Pros**: Generous free tier, MySQL compatible
- **Best for**: Budget projects
- **Setup time**: 5 minutes

---

## 🚀 STEP 2: Quick Setup (Choose One)

### ✨ EASIEST: Supabase Setup

```bash
# 1. Go to https://supabase.com and create account
# 2. Create new project (takes 2-3 min)
# 3. Go to Settings → Database → Connection string → Pooler tab
# 4. Copy the URI (looks like: postgresql://postgres.xxxxx:password@db.supabase.co:6543/postgres)

# 5. Update your .env.local file:
cat > .env.local << EOF
DATABASE_URL="postgresql://postgres.xxxxx:password@db.supabase.co:6543/postgres"
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
PORT=3000
EOF

# 6. Create database schema
npm run prisma:push

# 7. Seed sample data
npm run prisma:seed

# 8. Restart dev server
# (Ctrl+C to stop, then: npm run dev)
```

### 🐳 Alternative: Docker PostgreSQL

```bash
# 1. Install Docker from docker.com if not installed

# 2. Start PostgreSQL container
docker run --name asm-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=asm_dev \
  -p 5432:5432 -d postgres

# 3. Update .env.local
cat > .env.local << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/asm_dev"
JWT_SECRET=super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000
PORT=3000
EOF

# 4. Create schema
npm run prisma:push

# 5. Seed data
npm run prisma:seed

# 6. Restart: Ctrl+C then npm run dev
```

---

## 🧪 STEP 3: Test Your Connection

### Test 1: Health Check (No Auth Required)
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Autonomous Subscription Manager API is running",
  "database": {
    "connected": "configured",
    "provider": "PostgreSQL"
  }
}
```

### Test 2: Login (Demo, Works Without DB)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.johnson@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "alice.johnson@example.com",
      "name": "Alice Johnson",
      "subscriptionPlan": "Basic"
    }
  }
}
```

### Test 3: Get Subscriptions (Requires Database)
```bash
# 1. Get token from login endpoint above
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Use token to fetch subscriptions
curl http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (if database connected):**
```json
{
  "data": [
    {
      "id": "subscription-id-123",
      "planName": "Pro",
      "status": "ACTIVE",
      "startDate": "2025-01-15",
      "endDate": "2026-01-15",
      "billingCycle": "YEARLY"
    }
  ],
  "pagination": {
    "page": 1,
    "total": 1,
    "totalPages": 1
  }
}
```

### Test 4: Log Usage Metric
```bash
TOKEN="your-token-here"

curl -X POST http://localhost:3000/api/usage \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "metricType": "API_CALLS",
    "quantity": 50,
    "metadata": {
      "endpoint": "/api/test",
      "responseTime": 245
    }
  }'
```

---

## 🔧 Database Management Commands

```bash
# View database in interactive UI
npm run prisma:studio

# Create a new migration
npm run prisma:migrate -- --name add_new_table

# Push schema changes
npm run prisma:push

# Seed sample data
npm run prisma:seed

# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# Generate fresh Prisma Client
npm run prisma:generate
```

---

## 📊 After Setup: What You'll Have

### Database Tables
- **users** - User accounts with auth info
- **subscription_plans** - Available plan tiers (Basic, Pro, Enterprise)
- **subscriptions** - User subscriptions with status tracking
- **payments** - Payment records (Stripe/PayPal)
- **usage_logs** - Metric tracking (API calls, storage, etc.)
- **webhooks** - Event queue for subscription changes

### API Endpoints
```
GET  /api/health              → Health check
POST /api/auth/login          → Demo login
GET  /api/subscriptions       → List subscriptions
POST /api/subscriptions       → Create subscription
GET  /api/usage               → Fetch usage logs
POST /api/usage               → Log usage metric
```

### Sample Data
After `npm run prisma:seed`, you'll have:
- 3 users (Alice, Bob, Carol)
- 3 subscription plans (Basic, Pro, Enterprise)
- 3 active subscriptions
- 8 payment records
- 13 usage logs

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `P1000: Cannot reach database server` | Check DATABASE_URL in .env.local |
| `ECONNREFUSED` on localhost:5432 | Docker container not running: `docker start asm-postgres` |
| `PSQLException: too many connections` | Reduce connection pool size or restart database |
| `relation "users" does not exist` | Run: `npm run prisma:push` |
| `Unique constraint failed` | Email already exists, use different email |

---

## 🎓 Learn More

- **Database Design**: See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Backend API**: See [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **React Hooks**: Check [lib/hooks.js](./lib/hooks.js)
- **Prisma Docs**: https://prisma.io/docs

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] DATABASE_URL in .env.local (no localhost:5432)
- [ ] `npm run prisma:push` completes without errors
- [ ] `npm run prisma:seed` succeeds
- [ ] `/api/health` returns 200 with database info
- [ ] `/api/auth/login` returns JWT token
- [ ] `/api/subscriptions` returns subscription list
- [ ] `npm run prisma:studio` opens database viewer

---

## 🎉 You're All Set!

Once all checks pass:

```bash
npm run dev
```

Then visit: **http://localhost:3000**

Your ASM application is now fully functional with a working database! 🚀
