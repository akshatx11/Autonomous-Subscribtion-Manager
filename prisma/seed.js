/**
 * Database Seed Script
 * Populates database with initial data for testing
 * 
 * Run: npm run prisma:seed
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create subscription plans
  console.log("📋 Creating subscription plans...");
  const plans = await prisma.subscriptionPlan.createMany({
    data: [
      {
        name: "Basic",
        description: "Perfect for individuals and small projects",
        priceMonthly: 9.99,
        priceYearly: 99.9,
        features: JSON.stringify([
          "up_to_5_projects",
          "1000_api_calls_monthly",
          "100gb_storage",
          "email_support",
        ]),
        maxUsageLimit: JSON.stringify({
          api_calls: 1000,
          storage: 100,
          concurrent_users: 5,
        }),
        isActive: true,
      },
      {
        name: "Pro",
        description: "For growing teams and enterprises",
        priceMonthly: 29.99,
        priceYearly: 299.9,
        features: JSON.stringify([
          "unlimited_projects",
          "100000_api_calls_monthly",
          "1tb_storage",
          "priority_support",
          "advanced_analytics",
          "webhooks",
        ]),
        maxUsageLimit: JSON.stringify({
          api_calls: 100000,
          storage: 1000,
          concurrent_users: 50,
        }),
        isActive: true,
      },
      {
        name: "Enterprise",
        description: "Custom solutions for large organizations",
        priceMonthly: 99.99,
        priceYearly: 999.9,
        features: JSON.stringify([
          "unlimited_everything",
          "dedicated_account_manager",
          "sso",
          "advanced_security",
          "custom_integrations",
          "99.99_uptime_sla",
        ]),
        maxUsageLimit: JSON.stringify({
          api_calls: 10000000,
          storage: 10000,
          concurrent_users: 500,
        }),
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ Created ${plans.count} subscription plans`);

  // Create users with subscriptions
  console.log("👥 Creating users...");

  const users = [
    {
      email: "alice.johnson@example.com",
      name: "Alice Johnson",
      password: "password123",
      planName: "Basic",
    },
    {
      email: "bob.smith@example.com",
      name: "Bob Smith",
      password: "password123",
      planName: "Pro",
    },
    {
      email: "carol.davis@example.com",
      name: "Carol Davis",
      password: "password123",
      planName: "Enterprise",
    },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { name: userData.planName },
    });

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        passwordHash: hashedPassword,
        status: "ACTIVE",
      },
    });

    // Create subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "ACTIVE",
        startDate,
        endDate,
        autoRenew: true,
        billingCycle: "MONTHLY",
        currentCycleUsage: JSON.stringify({}),
      },
    });

    // Update user's subscription reference
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionId: subscription.id },
    });

    console.log(`✅ Created user: ${user.email}`);
  }

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
