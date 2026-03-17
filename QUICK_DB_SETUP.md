# Quick Database Setup Guide

Your ASM website is running at **http://localhost:3000** but needs a database connection to use the API endpoints.

## 🚀 Quickest Setup: Supabase (5 minutes)

### Step 1: Create Supabase Account
1. Go to **https://supabase.com**
2. Click "Start your project"
3. Sign up with GitHub or Google
4. Create a new project (choose your closest region)
5. Wait 2-3 minutes for setup

### Step 2: Get Connection String
1. In Supabase dashboard, go to: **Settings → Database**
2. Look for "Connection string"
3. Choose the **"Pooler"** tab (important for Node.js)
4. Copy the connection URI

### Step 3: Update .env.local
```bash
# Edit .env.local and replace the DATABASE_URL line with:
DATABASE_URL="postgresql://postgres.xxxxx:password@db.supabase.co:6543/postgres"
```

### Step 4: Create Database Schema & Seed Data
```bash
# 1. Create all tables
npm run prisma:push

# 2. Seed with sample data (optional, for testing)
npm run prisma:seed
```

### Step 5: Restart Dev Server
```bash
# Stop current server with Ctrl+C
npm run dev
```

✅ Your database is now connected!

---

## 🐳 Alternative: Docker PostgreSQL (Local)

If you prefer local development:

```bash
# 1. Start PostgreSQL container
docker run --name asm-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=asm_dev \
  -p 5432:5432 -d postgres

# 2. Update .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/asm_dev"

# 3. Create schema
npm run prisma:push

# 4. Seed data (optional)
npm run prisma:seed
```

---

## 🔗 Test API Endpoints

Once database is connected, test the API:

```bash
# Get JWT token (example)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice.johnson@example.com","password":"password123"}'

# List subscriptions
curl http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Log usage
curl -X POST http://localhost:3000/api/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "metricType": "API_CALLS",
    "quantity": 50,
    "metadata": {"endpoint": "/api/test"}
  }'
```

---

## 📊 Prisma Commands

```bash
# View database in interactive UI
npm run prisma:studio

# Create migration
npm run prisma:migrate -- --name migration_name

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Generate Prisma Client
npm run prisma:generate
```

---

## ✅ Verify Setup

Check if everything is working:

```bash
# This should show your Prisma schema
npm run prisma:studio
```

When Prisma Studio opens, you should see your tables:
- users
- subscription_plans
- subscriptions
- payments
- usage_logs
- webhooks

---

## 🆘 Troubleshooting

### Connection Timeout
- Check DATABASE_URL is correct
- Verify network allows connection to database host
- For Supabase, use the **Pooler** endpoint (port 6543), not direct connection

### "P1000" Error (Cannot reach database server)
- Database URL is wrong
- Database server is down
- Network/firewall issue

### "P2002" Error (Unique constraint failed)
- Email already exists in database
- Use different email in sample data

---

## 🎯 Your Website is Ready!

| Component | Status |
|-----------|--------|
| Frontend | ✅ Running at localhost:3000 |
| API Routes | ✅ Created (need DB connection) |
| Database Schema | ✅ Defined (need DB setup) |
| Authentication | ✅ JWT ready (need DB) |
| Documentation | ✅ Complete |

**Next: Complete Step 1-4 above to connect your database!**
