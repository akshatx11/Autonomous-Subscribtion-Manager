#!/bin/bash
# Database Setup with Mock Data for Development
# Supports: Supabase, PlanetScale, Local PostgreSQL, Docker

echo "🔧 Autonomous Subscription Manager - Database Setup"
echo "===================================================="
echo ""

# Show current DATABASE_URL
echo "📋 Current .env.local settings:"
grep DATABASE_URL .env.local || echo "DATABASE_URL not set"
echo ""

echo "Choose your database option:"
echo ""
echo "OPTION 1: ☁️  Supabase (Recommended - Free PostgreSQL Cloud)"
echo "================================================"
echo "Quickest setup - Free tier includes 500MB storage"
echo ""
echo "Steps:"
echo "1. Go to: https://supabase.com"
echo "2. Sign up with GitHub/Google"
echo "3. Create new project (region: closest to you)"
echo "4. Wait for setup (2-3 min)"
echo "5. Go to: Settings → Database → Connection string"
echo "6. Copy the 'Pooler' connection URI"
echo "7. Paste it below"
echo ""
read -p "Enter Supabase connection URI (or press Enter to skip): " supabase_uri

if [ -n "$supabase_uri" ]; then
    # Update .env.local
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$supabase_uri\"|" .env.local
    echo "✅ Updated DATABASE_URL in .env.local"
    
    echo ""
    echo "📡 Testing connection and creating schema..."
    npm run prisma:push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🌱 Seeding database with sample data..."
        npm run prisma:seed
        
        echo ""
        echo "✅ SUCCESS! Database is ready to use"
        echo ""
        echo "Your API is now connected to: Supabase"
        echo "Start development server: npm run dev"
    else
        echo "❌ Connection failed. Check your URI and try again."
    fi
else
    echo ""
    echo "OPTION 2: 🐳 Docker PostgreSQL (Local)"
    echo "===================================="
    echo "Run this command to start PostgreSQL in Docker:"
    echo ""
    echo "docker run --name asm-postgres \\"
    echo "  -e POSTGRES_PASSWORD=postgres \\"
    echo "  -e POSTGRES_DB=asm_dev \\"
    echo "  -p 5432:5432 -d postgres"
    echo ""
    echo "Then update .env.local:"
    echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/asm_dev"'
    echo ""
    echo "And run:"
    echo "npm run prisma:push"
    echo "npm run prisma:seed"
    echo ""
    echo "OPTION 3: 🔗 PlanetScale (Free MySQL Cloud)"
    echo "======================================="
    echo "1. Go to: https://planetscale.com"
    echo "2. Sign up and create database"
    echo "3. Get connection URI"
    echo "4. Update .env.local with MySQL URI"
    echo ""
fi

echo ""
echo "Need help? Check DATABASE_SCHEMA.md or BACKEND_SETUP.md"
