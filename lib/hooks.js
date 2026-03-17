/**
 * React Hook: useSubscription
 * Fetch user subscription data with real-time updates
 * 
 * Usage:
 * const { subscription, isLoading, error } = useSubscription();
 */

"use client";

import useSWR from "swr";
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Decode JWT token to extract userId
 */
function decodeJWT(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    // Decode payload (second part)
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    
    // Support both 'userId' and 'sub' (subject)
    payload.userId = payload.userId || payload.sub;
    return payload;
  } catch (err) {
    console.error("Error decoding JWT:", err);
    return null;
  }
}

/**
 * Default fetcher for SWR with error handling
 */
const fetcher = async (url, token) => {
  const headers = {
    "Content-Type": "application/json",
  };

  // Add token to Authorization header
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    
    // Also decode and add userId header for mock data store
    const payload = decodeJWT(token);
    if (payload && payload.userId) {
      headers["x-user-id"] = payload.userId;
    }
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const error = new Error("Failed to fetch data");
    error.status = res.status;
    error.info = await res.json();
    throw error;
  }

  return res.json();
};

/**
 * Hook to fetch user's subscription data
 * @param {object} options - SWR options
 * @returns {object} { subscription, isLoading, error, refetch, mutate }
 */
export function useSubscription(options = {}) {
  const [token, setToken] = useState(null);

  // Get token from localStorage or cookie
  useEffect(() => {
    const accessToken =
      localStorage.getItem("accessToken") ||
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

    setToken(accessToken);
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    token ? [`${API_BASE_URL}/api/subscriptions?limit=1`, token] : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      focusThrottleInterval: 300000, // 5 minutes
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      onError: (err) => {
        console.error("Subscription fetch error:", err);
      },
      ...options,
    }
  );

  const subscription = data?.data?.[0] || null;

  return {
    subscription,
    isLoading: !error && !data,
    error,
    refetch: mutate,
    mutate,
  };
}

/**
 * Hook to fetch usage logs for a metric
 * @param {string} metricType - Metric type to fetch
 * @param {object} options - Query options
 * @returns {object} { usageLogs, isLoading, error, refetch }
 */
export function useUsageLogs(metricType, options = {}) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const accessToken =
      localStorage.getItem("accessToken") ||
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

    setToken(accessToken);
  }, []);

  const params = new URLSearchParams({
    metricType: metricType || "",
    limit: options.limit || 20,
    page: options.page || 1,
    ...(options.startDate && { startDate: options.startDate }),
    ...(options.endDate && { endDate: options.endDate }),
  });

  const { data, error, isLoading, mutate } = useSWR(
    token
      ? [`${API_BASE_URL}/api/usage?${params.toString()}`, token]
      : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      errorRetryCount: 3,
      ...options,
    }
  );

  return {
    usageLogs: data?.data || [],
    aggregation: data?.aggregation || [],
    pagination: data?.pagination || {},
    isLoading: !error && !data,
    error,
    refetch: mutate,
  };
}

/**
 * Hook to log usage metric
 * @returns {object} { logUsage, isLoading, error }
 */
export function useLogUsage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const logUsage = useCallback(
    async (subscriptionId, metricType, quantity, metadata = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const token =
          localStorage.getItem("accessToken") ||
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("accessToken="))
            ?.split("=")[1];

        if (!token) {
          throw new Error("No authentication token found");
        }

        // Decode JWT to get userId
        const payload = decodeJWT(token);
        if (!payload || !payload.userId) {
          throw new Error("Invalid token");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-user-id": payload.userId,
        };

        const res = await fetch(`${API_BASE_URL}/api/usage`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            subscriptionId,
            metricType,
            quantity,
            metadata,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to log usage");
        }

        const result = await res.json();
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { logUsage, isLoading, error };
}

/**
 * Hook to create a new subscription
 * @returns {object} { createSubscription, isLoading, error }
 */
export function useCreateSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSubscription = useCallback(
    async (planId, billingCycle = "MONTHLY", autoRenew = true) => {
      setIsLoading(true);
      setError(null);

      try {
        const token =
          localStorage.getItem("accessToken") ||
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("accessToken="))
            ?.split("=")[1];

        if (!token) {
          throw new Error("No authentication token found");
        }

        // Decode JWT to get userId
        const payload = decodeJWT(token);
        if (!payload || !payload.userId) {
          throw new Error("Invalid token");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-user-id": payload.userId,
        };

        const res = await fetch(`${API_BASE_URL}/api/subscriptions`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            planId,
            billingCycle,
            autoRenew,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message || "Failed to create subscription"
          );
        }

        const result = await res.json();
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { createSubscription, isLoading, error };
}

/**
 * Example component using subscription hook
 */
export function SubscriptionStatus() {
  const { subscription, isLoading, error } = useSubscription();
  const { usageLogs, aggregation } = useUsageLogs(null, { limit: 5 });

  if (isLoading) {
    return <div className="p-4">Loading subscription...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700">
        Error: {error.message}
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700">
        No active subscription found
      </div>
    );
  }

  const usagePercentage =
    aggregation.length > 0
      ? (aggregation[0].totalUsage / subscription.limit) * 100
      : 0;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Your Subscription</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-gray-600 text-sm">Plan</p>
          <p className="text-lg font-semibold">{subscription.planName}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Status</p>
          <p className="text-lg font-semibold">{subscription.status}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Billing Cycle</p>
          <p className="text-lg font-semibold">{subscription.billingCycle}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm">Auto Renew</p>
          <p className="text-lg font-semibold">
            {subscription.autoRenew ? "Enabled" : "Disabled"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 text-sm mb-2">Usage</p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {usagePercentage.toFixed(1)}% of limit used
        </p>
      </div>

      {subscription.endDate && (
        <div>
          <p className="text-gray-600 text-sm">Expires</p>
          <p className="text-lg">
            {new Date(subscription.endDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default useSubscription;
