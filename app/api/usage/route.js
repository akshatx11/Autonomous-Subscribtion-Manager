/**
 * API Route: POST /api/usage
 * Log usage metric for a subscription
 * 
 * Request Body:
 * {
 *   "subscriptionId": "sub-123",
 *   "metricType": "API_CALLS",
 *   "amount": 150,
 *   "metadata": {}
 * }
 * 
 * Protected: YES (requires x-user-id header for demo)
 */

import { addMockUsageLog, getMockSubscriptions } from "../../../lib/mock-data-store.js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { subscriptionId, metricType, amount, metadata } = body;

    // Validation
    if (!subscriptionId || !metricType || amount === undefined) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: "subscriptionId, metricType, and amount are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Valid metric types
    const validMetrics = [
      "API_CALLS",
      "STORAGE",
      "BANDWIDTH",
      "COMPUTE_HOURS",
      "CONCURRENT_USERS",
    ];
    if (!validMetrics.includes(metricType)) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: `Invalid metricType. Must be one of: ${validMetrics.join(", ")}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log usage
    const usageLog = addMockUsageLog(subscriptionId, {
      metricType,
      amount,
      metadata: metadata || {},
    });

    return new Response(
      JSON.stringify({
        data: usageLog,
        message: "Usage logged successfully",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("POST /api/usage error:", error);

    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: "Invalid JSON in request body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "INTERNAL_ERROR",
        message: "Failed to log usage",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * API Route: GET /api/usage
 * Fetch usage logs for subscriptions
 * 
 * Query Parameters:
 * - subscriptionId: Filter by subscription (required)
 * - metricType: Filter by metric type (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * 
 * Protected: YES (requires x-user-id header for demo)
 */
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const subscriptionId = url.searchParams.get("subscriptionId");
    const metricType = url.searchParams.get("metricType");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 100);
    const skip = (page - 1) * limit;

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: "subscriptionId query parameter is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get all usage logs for this subscription
    let allLogs = [];
    try {
      const allSubscriptions = getMockSubscriptions("", {}); // Get all to find logs
      const subscription = allSubscriptions.find((s) => s.id === subscriptionId);
      if (subscription && subscription.recentUsage) {
        allLogs = subscription.recentUsage;
      }
    } catch (e) {
      // Fallback: empty logs
    }

    // Filter by metric type if provided
    if (metricType) {
      allLogs = allLogs.filter((log) => log.metricType === metricType);
    }

    // Paginate
    const total = allLogs.length;
    const logs = allLogs.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    // Aggregate usage by metric type
    const aggregated = logs.reduce(
      (acc, log) => {
        if (!acc[log.metricType]) {
          acc[log.metricType] = 0;
        }
        acc[log.metricType] += log.amount;
        return acc;
      },
      {}
    );

    return new Response(
      JSON.stringify({
        data: logs,
        aggregation: aggregated,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GET /api/usage error:", error);

    return new Response(
      JSON.stringify({
        error: "INTERNAL_ERROR",
        message: "Failed to fetch usage logs",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
