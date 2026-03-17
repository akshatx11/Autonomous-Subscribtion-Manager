"use client"

import { Header } from "@/components/layout/header"
import { mockActivities, type Activity } from "@/lib/mock-data"

const activityVerbs: Record<Activity["type"], string> = {
  subscribed: "Subscribed to",
  downgraded: "Downgraded",
  cancelled: "Cancelled",
  payment: "Payment for",
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Just now"
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  }
  const days = Math.floor(diffInSeconds / 86400)
  return `${days}d ago`
}

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold text-foreground">
            Activity
          </h1>
          <p className="text-muted-foreground">
            {mockActivities.length} actions this month
          </p>
        </div>

        {/* Activity list */}
        <div className="space-y-1">
          {mockActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-secondary/50"
            >
              <div className="w-16 shrink-0 pt-0.5">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">
                    {activityVerbs[activity.type]}
                  </span>{" "}
                  {activity.service}
                  {activity.details && (
                    <span className="text-muted-foreground">
                      {" "}
                      - {activity.details}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {activity.label === "Decided by Automation"
                    ? "Automation"
                    : "Manual via MetaMask"}
                </p>
              </div>

              <div className="shrink-0">
                {activity.label === "Decided by Automation" ? (
                  <span className="inline-flex h-5 items-center rounded bg-secondary px-1.5 text-[10px] font-medium text-muted-foreground">
                    AUTO
                  </span>
                ) : (
                  <span className="inline-flex h-5 items-center rounded bg-secondary px-1.5 text-[10px] font-medium text-muted-foreground">
                    MANUAL
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {mockActivities.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              No activity yet. Actions will appear here when the agent runs.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
