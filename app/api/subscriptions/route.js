/**
 * API Route: GET /api/subscriptions
 * Fetch user's subscriptions with pagination
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - status: Filter by status (ACTIVE, TRIALING, PAUSED, CANCELED)
 * 
 * Protected: YES (requires JWT or x-user-id header for demo)
 */

import { getMockSubscriptions, createMockSubscription, getMockPlans } from "../../../lib/mock-data-store.js";

export async function GET(req) {
  try {
    // Get user ID from header (demo mode)
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "User ID required. Use header: x-user-id",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse URL parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "10"), 100);
    const status = url.searchParams.get("status");
    const skip = (page - 1) * limit;

    // Get subscriptions from mock data
    let subscriptions = getMockSubscriptions(userId, { status });

    // Paginate
    const total = subscriptions.length;
    subscriptions = subscriptions.slice(skip, skip + limit);
    const totalPages = Math.ceil(total / limit);

    return new Response(
      JSON.stringify({
        data: subscriptions,
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
    console.error("GET /api/subscriptions error:", error);

    return new Response(
      JSON.stringify({
        error: "INTERNAL_ERROR",
        message: "Failed to fetch subscriptions",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * API Route: POST /api/subscriptions
 * Create new subscription for user
 * 
 * Request Body:
 * {
 *   "planId": "plan-basic",
 *   "billingCycle": "MONTHLY" (MONTHLY, QUARTERLY, ANNUAL)
 * }
 * 
 * Protected: YES (requires x-user-id header for demo)
 */
export async function POST(req) {
  try {
    // Get user ID from header (demo mode)
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "User ID required. Use header: x-user-id",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { planId, billingCycle = "MONTHLY" } = body;

    if (!planId) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: "planId is required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get plans to verify planId exists
    const plans = getMockPlans();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: "Plan not found",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user already has active subscription for this plan
    const existingSubscriptions = getMockSubscriptions(userId, { status: "ACTIVE" });
    if (existingSubscriptions.length > 0) {
      return new Response(
        JSON.stringify({
          error: "CONFLICT",
          message: "User already has an active subscription",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create new subscription
    const newSubscription = createMockSubscription({
      userId,
      planId,
      planName: plan.name,
      billingCycle,
      status: "TRIALING", // Start with trial
      autoRenew: true,
    });

    return new Response(
      JSON.stringify({
        data: newSubscription,
        message: "Subscription created successfully",
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("POST /api/subscriptions error:", error);

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
        message: "Failed to create subscription",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


