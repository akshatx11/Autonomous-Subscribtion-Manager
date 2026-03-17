#!/bin/bash

# Test script to verify subscription persistence

echo "================================"
echo "Testing Subscription Persistence"
echo "================================"
echo ""

# Test user ID (new user without existing subscription)
TEST_USER="550e8400-e29b-41d4-a716-446655440199"

echo "1. Creating a new subscription..."
echo "   User ID: $TEST_USER"

CREATE_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/subscriptions" \
  -H "x-user-id: $TEST_USER" \
  -H "Content-Type: application/json" \
  -d '{"planId":"plan-pro","billingCycle":"ANNUAL"}')

SUB_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')
echo "   Created subscription: $SUB_ID"
echo ""

echo "2. Fetching subscriptions immediately..."
FETCH1=$(curl -s "http://localhost:3000/api/subscriptions?limit=10" \
  -H "x-user-id: $TEST_USER" | jq '.data | length')
echo "   Found $FETCH1 subscriptions"
echo ""

echo "3. Waiting 2 seconds..."
sleep 2

echo "4. Fetching subscriptions again (after wait)..."
FETCH2=$(curl -s "http://localhost:3000/api/subscriptions?limit=10" \
  -H "x-user-id: $TEST_USER" | jq '.data | length')
echo "   Found $FETCH2 subscriptions"
echo ""

if [ "$FETCH1" -eq "$FETCH2" ] && [ "$FETCH2" -gt 0 ]; then
  echo "✅ SUCCESS: Subscription persisted in memory!"
  echo "   Both fetches returned $FETCH2 subscription(s)"
else
  echo "❌ FAILED: Subscription did not persist"
  echo "   First fetch: $FETCH1, Second fetch: $FETCH2"
fi

echo ""
echo "5. Full subscription data:"
curl -s "http://localhost:3000/api/subscriptions?limit=10" \
  -H "x-user-id: $TEST_USER" | jq '.data[0]'
