/**
 * Mock Data Store for Development
 * Persists data in memory during session (until server restart)
 * Replace with database queries when DB is connected
 */

// In-memory storage for demo data
let mockData = {
  subscriptions: [
    {
      id: "sub-alice-basic",
      userId: "550e8400-e29b-41d4-a716-446655440000",
      planId: "plan-basic",
      planName: "Basic",
      status: "ACTIVE",
      startDate: "2025-01-15",
      endDate: "2026-01-15",
      autoRenew: true,
      billingCycle: "MONTHLY",
      lastPayment: {
        status: "PAID",
        amount: 9.99,
        paidAt: "2025-01-15T10:30:00Z",
      },
      recentUsage: [
        {
          id: "usage-1",
          metricType: "API_CALLS",
          quantity: 245,
          loggedAt: "2025-01-20T14:22:00Z",
        },
      ],
    },
    {
      id: "sub-bob-pro",
      userId: "550e8400-e29b-41d4-a716-446655440001",
      planId: "plan-pro",
      planName: "Pro",
      status: "ACTIVE",
      startDate: "2025-10-01",
      endDate: "2026-01-01",
      autoRenew: true,
      billingCycle: "YEARLY",
      lastPayment: {
        status: "PAID",
        amount: 299.9,
        paidAt: "2025-10-01T08:00:00Z",
      },
      recentUsage: [
        {
          id: "usage-2",
          metricType: "API_CALLS",
          quantity: 45230,
          loggedAt: "2025-01-20T16:45:00Z",
        },
      ],
    },
  ],
  plans: [
    {
      id: "plan-basic",
      name: "Basic",
      priceMonthly: 9.99,
      priceYearly: 99.9,
      features: ["up_to_5_projects", "1000_api_calls", "100gb_storage"],
      maxUsageLimit: { api_calls: 1000, storage: 100, concurrent_users: 5 },
    },
    {
      id: "plan-pro",
      name: "Pro",
      priceMonthly: 29.99,
      priceYearly: 299.9,
      features: [
        "unlimited_projects",
        "100000_api_calls",
        "1tb_storage",
        "advanced_analytics",
      ],
      maxUsageLimit: {
        api_calls: 100000,
        storage: 1000,
        concurrent_users: 50,
      },
    },
    {
      id: "plan-enterprise",
      name: "Enterprise",
      priceMonthly: 99.99,
      priceYearly: 999.9,
      features: [
        "unlimited_everything",
        "dedicated_manager",
        "sso",
        "advanced_security",
      ],
      maxUsageLimit: {
        api_calls: 10000000,
        storage: 10000,
        concurrent_users: 500,
      },
    },
  ],
  usageLogs: [
    {
      id: "usage-1",
      subscriptionId: "sub-alice-basic",
      metricType: "API_CALLS",
      quantity: 245,
      loggedAt: "2025-01-20T14:22:00Z",
    },
    {
      id: "usage-2",
      subscriptionId: "sub-alice-basic",
      metricType: "STORAGE",
      quantity: 12.5,
      loggedAt: "2025-01-20T15:10:00Z",
    },
    {
      id: "usage-3",
      subscriptionId: "sub-bob-pro",
      metricType: "API_CALLS",
      quantity: 15000,
      loggedAt: "2025-01-20T16:45:00Z",
    },
  ],
};

/**
 * Get all subscriptions for a user
 */
export function getMockSubscriptions(userId, filters = {}) {
  let subscriptions = mockData.subscriptions;

  // Filter by user
  if (userId) {
    subscriptions = subscriptions.filter((s) => s.userId === userId);
  }

  // Filter by status
  if (filters.status) {
    subscriptions = subscriptions.filter((s) => s.status === filters.status);
  }

  return subscriptions;
}

/**
 * Get single subscription by ID
 */
export function getMockSubscription(subscriptionId) {
  return mockData.subscriptions.find((s) => s.id === subscriptionId);
}

/**
 * Create new subscription
 */
export function createMockSubscription(data) {
  const newSubscription = {
    id: `sub-${Date.now()}`,
    userId: data.userId,
    planId: data.planId,
    planName:
      mockData.plans.find((p) => p.id === data.planId)?.name || "Unknown",
    status: "TRIALING",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    autoRenew: data.autoRenew !== false,
    billingCycle: data.billingCycle || "MONTHLY",
    lastPayment: null,
    recentUsage: [],
  };

  mockData.subscriptions.push(newSubscription);
  return newSubscription;
}

/**
 * Update subscription status
 */
export function updateMockSubscription(subscriptionId, updates) {
  const index = mockData.subscriptions.findIndex((s) => s.id === subscriptionId);
  if (index !== -1) {
    mockData.subscriptions[index] = {
      ...mockData.subscriptions[index],
      ...updates,
    };
    return mockData.subscriptions[index];
  }
  return null;
}

/**
 * Get all plans
 */
export function getMockPlans() {
  return mockData.plans;
}

/**
 * Get usage logs for a subscription
 */
export function getMockUsageLogs(subscriptionId) {
  return mockData.usageLogs.filter((log) => log.subscriptionId === subscriptionId);
}

/**
 * Add usage log
 */
export function addMockUsageLog(subscriptionId, data) {
  const newLog = {
    id: `usage-${Date.now()}`,
    subscriptionId,
    metricType: data.metricType,
    quantity: data.quantity,
    loggedAt: new Date().toISOString(),
    metadata: data.metadata || {},
  };

  mockData.usageLogs.push(newLog);

  // Update subscription's recent usage
  const subscription = mockData.subscriptions.find(
    (s) => s.id === subscriptionId
  );
  if (subscription) {
    subscription.recentUsage = subscription.recentUsage || [];
    subscription.recentUsage.unshift(newLog);
    if (subscription.recentUsage.length > 5) {
      subscription.recentUsage = subscription.recentUsage.slice(0, 5);
    }
  }

  return newLog;
}

/**
 * Reset mock data to initial state
 */
export function resetMockData() {
  mockData = {
    subscriptions: [
      {
        id: "sub-alice-basic",
        userId: "550e8400-e29b-41d4-a716-446655440000",
        planId: "plan-basic",
        planName: "Basic",
        status: "ACTIVE",
        startDate: "2025-01-15",
        endDate: "2026-01-15",
        autoRenew: true,
        billingCycle: "MONTHLY",
        lastPayment: {
          status: "PAID",
          amount: 9.99,
          paidAt: "2025-01-15T10:30:00Z",
        },
        recentUsage: [],
      },
    ],
    plans: mockData.plans,
    usageLogs: [],
  };
}

export default {
  getMockSubscriptions,
  getMockSubscription,
  createMockSubscription,
  updateMockSubscription,
  getMockPlans,
  getMockUsageLogs,
  addMockUsageLog,
  resetMockData,
};
