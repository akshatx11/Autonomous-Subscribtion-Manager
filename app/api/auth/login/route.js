/**
 * API Route: POST /api/auth/login
 * Demo login endpoint (works without database)
 * 
 * For production, replace with database query
 */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

// Demo users (replace with database query in production)
const DEMO_USERS = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "alice.johnson@example.com",
    password: "password123",
    name: "Alice Johnson",
    subscriptionPlan: "Basic",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    email: "bob.smith@example.com",
    password: "password123",
    name: "Bob Smith",
    subscriptionPlan: "Pro",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    email: "carol.davis@example.com",
    password: "password123",
    name: "Carol Davis",
    subscriptionPlan: "Enterprise",
  },
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          message: "Email and password are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find user (demo - replace with database query)
    const user = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "UNAUTHORIZED",
          message: "Invalid email or password",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        plan: user.subscriptionPlan,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return new Response(
      JSON.stringify({
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            subscriptionPlan: user.subscriptionPlan,
          },
        },
        message: "Login successful",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        error: "INTERNAL_ERROR",
        message: "Login failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
