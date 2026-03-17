/**
 * Authentication & Authorization Middleware
 * JWT verification and subscription status checks
 * 
 * Features:
 * - JWT token extraction and verification
 * - User subscription status validation
 * - Usage limit enforcement
 * - Role-based access control
 */

import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

/**
 * Middleware: Verify JWT token and attach user to request
 * Usage: app.use(authMiddleware);
 */
export async function authMiddleware(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub; // Subject claim (user ID)
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: "TOKEN_EXPIRED",
        message: "JWT token has expired",
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: "INVALID_TOKEN",
        message: "Invalid JWT token",
      });
    }
    res.status(500).json({
      error: "AUTH_ERROR",
      message: "Authentication failed",
    });
  }
}

/**
 * Generate JWT token for user
 * @param {string} userId - User ID
 * @param {object} additionalClaims - Extra claims to include in token
 * @returns {string} JWT token
 */
export function generateJWT(userId, additionalClaims = {}) {
  return jwt.sign(
    {
      sub: userId,
      ...additionalClaims,
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Verify user's subscription is active
 * Usage: app.get("/api/protected", subscriptionRequired, handler);
 */
export async function subscriptionRequired(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    // Fetch user with active subscription
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!user || !user.subscription) {
      return res.status(403).json({
        error: "NO_SUBSCRIPTION",
        message: "User does not have an active subscription",
      });
    }

    // Check subscription status
    if (!["ACTIVE", "TRIALING"].includes(user.subscription.status)) {
      return res.status(403).json({
        error: "SUBSCRIPTION_INACTIVE",
        message: `Subscription status is ${user.subscription.status}`,
      });
    }

    // Check subscription expiry
    if (user.subscription.endDate && new Date() > user.subscription.endDate) {
      return res.status(403).json({
        error: "SUBSCRIPTION_EXPIRED",
        message: "Subscription has expired",
      });
    }

    // Attach subscription to request
    req.subscription = user.subscription;
    req.user = user;
    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({
      error: "SUBSCRIPTION_CHECK_ERROR",
      message: "Failed to verify subscription",
    });
  }
}

/**
 * Check if user has reached usage limits for current metric
 * Usage: app.post("/api/usage", usageLimitCheck("api_calls"), handler);
 * @param {string} metricType - Metric type to check (e.g., "API_CALLS")
 */
export function usageLimitCheck(metricType) {
  return async (req, res, next) => {
    try {
      if (!req.subscription) {
        return res.status(401).json({
          error: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const plan = req.subscription.plan;
      const limits = plan.maxUsageLimit || {};
      const limit = limits[metricType.toLowerCase()];

      if (!limit) {
        // No limit configured for this metric
        return next();
      }

      // Get current usage for this billing cycle
      const cycleStart = new Date(req.subscription.startDate);
      const cycleEnd = req.subscription.endDate
        ? new Date(req.subscription.endDate)
        : new Date(cycleStart.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const totalUsage = await prisma.usageLog.aggregate({
        where: {
          subscriptionId: req.subscription.id,
          metricType,
          loggedAt: {
            gte: cycleStart,
            lte: cycleEnd,
          },
          deletedAt: null,
        },
        _sum: { quantity: true },
      });

      const currentUsage = totalUsage._sum.quantity || 0;
      const remainingUsage = limit - currentUsage;

      // Attach usage info to request
      req.usageInfo = {
        metricType,
        limit,
        currentUsage,
        remainingUsage,
        percentageUsed: (currentUsage / limit) * 100,
      };

      // Trigger webhook if usage exceeds 80% of limit
      if (req.usageInfo.percentageUsed >= 80) {
        // Queue webhook asynchronously (non-blocking)
        queueWebhook(req.subscription.id, "USAGE_LIMIT_REACHED", {
          metricType,
          currentUsage,
          limit,
          percentageUsed: req.usageInfo.percentageUsed,
        }).catch((err) =>
          console.error("Failed to queue webhook:", err.message)
        );
      }

      // Reject if usage exceeds limit
      if (remainingUsage < 0) {
        return res.status(429).json({
          error: "USAGE_LIMIT_EXCEEDED",
          message: `Usage limit for ${metricType} exceeded`,
          usage: req.usageInfo,
        });
      }

      next();
    } catch (error) {
      console.error("Usage limit check error:", error);
      res.status(500).json({
        error: "USAGE_CHECK_ERROR",
        message: "Failed to check usage limits",
      });
    }
  };
}

/**
 * Optional: Role-based access control
 * Usage: app.get("/api/admin", roleRequired("ADMIN"), handler);
 * @param {...string} requiredRoles - Role names
 */
export function roleRequired(...requiredRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "User role not found",
      });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "INSUFFICIENT_PERMISSIONS",
        message: `Required roles: ${requiredRoles.join(", ")}`,
      });
    }

    next();
  };
}

/**
 * Queue a webhook event (asynchronous)
 * @param {string} subscriptionId - Subscription ID
 * @param {string} eventType - Event type
 * @param {object} payload - Event payload
 */
async function queueWebhook(subscriptionId, eventType, payload) {
  try {
    await prisma.webhook.create({
      data: {
        eventType,
        subscriptionId,
        payload,
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Error queueing webhook:", error);
    throw error;
  }
}

export default {
  authMiddleware,
  subscriptionRequired,
  usageLimitCheck,
  roleRequired,
  generateJWT,
};
