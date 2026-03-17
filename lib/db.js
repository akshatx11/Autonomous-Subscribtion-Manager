/**
 * Database Connection Setup
 * Prisma Client instance with connection pooling and error handling
 * 
 * Features:
 * - Connection pooling via datasource configuration
 * - Automatic retry on connection failures
 * - Query timeout handling
 * - Graceful disconnection on app shutdown
 * - Development logging for debugging
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

// Initialize Prisma Client with extended timeout and logging
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Log configuration for development
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Enhanced query execution with retry logic and timeout handling
 * @param {Function} queryFn - Async function containing Prisma query
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} timeoutMs - Query timeout in milliseconds (default: 30000)
 * @returns {Promise<any>} Query result or throws error
 */
export async function executeWithRetry(
  queryFn,
  maxRetries = 3,
  timeoutMs = 30000
) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Wrap query with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Query timeout after ${timeoutMs}ms on attempt ${attempt}`
              )
            ),
          timeoutMs
        )
      );

      const result = await Promise.race([queryFn(), timeoutPromise]);
      return result;
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable =
        error.code === "P1008" || // Operations timed out
        error.code === "P1017" || // Connection closed
        error.code === "ECONNREFUSED" || // Connection refused
        error.code === "ENOTFOUND"; // DNS lookup failed

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const backoffMs = Math.min(100 * Math.pow(2, attempt - 1), 1000);
      console.warn(
        `Query failed (attempt ${attempt}/${maxRetries}), retrying in ${backoffMs}ms...`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}

/**
 * Health check to verify database connectivity
 * @returns {Promise<boolean>} true if database is connected
 */
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

/**
 * Graceful disconnect on application shutdown
 * Call this in your server's shutdown handler
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log("Database disconnected gracefully");
  } catch (error) {
    console.error("Error disconnecting from database:", error);
    process.exit(1);
  }
}

// Handle process termination signals
if (process.env.NODE_ENV !== "test") {
  process.on("SIGINT", disconnectDatabase);
  process.on("SIGTERM", disconnectDatabase);
}

export default prisma;
