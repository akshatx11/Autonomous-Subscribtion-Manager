/**
 * API Route: GET /api/health
 * Health check endpoint (no database required)
 */

export async function GET(req) {
  try {
    return new Response(
      JSON.stringify({
        status: "ok",
        message: "Autonomous Subscription Manager API is running",
        timestamp: new Date().toISOString(),
        endpoints: {
          health: "GET /api/health",
          subscriptions: "GET /api/subscriptions (requires auth & database)",
          usage: "POST /api/usage (requires auth & database)",
        },
        database: {
          connected: process.env.DATABASE_URL ? "configured" : "not configured",
          provider: process.env.DATABASE_URL?.includes("postgresql")
            ? "PostgreSQL"
            : process.env.DATABASE_URL?.includes("mysql")
              ? "MySQL"
              : "unknown",
        },
        documentation: {
          schema: "See /DATABASE_SCHEMA.md",
          backend: "See /BACKEND_SETUP.md",
          quickStart: "See /QUICK_DB_SETUP.md",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "HEALTH_CHECK_FAILED",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
