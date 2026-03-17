"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mockSubscriptions, type Subscription } from "@/lib/mock-data"
import { Loader2, Plus, Check, X, ArrowDown } from "lucide-react"

interface AutomationRule {
  id: string
  name: string
  description: string
  threshold: number
  action: "downgrade" | "cancel"
  enabled: boolean
}

interface ExecutionStep {
  id: string
  subscription: Subscription
  action: "downgrade" | "cancel"
  status: "pending" | "signing" | "executing" | "completed" | "failed"
}

interface PendingAction {
  type: "bulk" | "individual"
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] =
    useState<Subscription[]>(mockSubscriptions)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load subscriptions from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("user_subscriptions")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSubscriptions(parsed)
      } catch (e) {
        console.error("Failed to parse subscriptions from local storage", e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save subscriptions to local storage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("user_subscriptions", JSON.stringify(subscriptions))
    }
  }, [subscriptions, isLoaded])

  const [isExecuting, setIsExecuting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([])
  const [showExecutionPanel, setShowExecutionPanel] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  // Add subscription form
  const [newSub, setNewSub] = useState({
    name: "",
    plan: "6 months" as Subscription["plan"],
    usage: 50,
    monthlyPrice: 10,
  })

  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "1",
      name: "Low usage downgrade",
      description: "Downgrade to shorter plan when usage falls below threshold",
      threshold: 30,
      action: "downgrade",
      enabled: true,
    },
    {
      id: "2",
      name: "Zero usage cancel",
      description: "Cancel subscription after 30 days of no usage",
      threshold: 5,
      action: "cancel",
      enabled: true,
    },
  ])

  // Get subscriptions that match automation criteria
  const getLowUsageSubscriptions = () =>
    subscriptions.filter(
      (sub) =>
        sub.status === "active" &&
        sub.usage < 30 &&
        rules.find((r) => r.action === "downgrade")?.enabled
    )

  const getZeroUsageSubscriptions = () =>
    subscriptions.filter(
      (sub) =>
        sub.status === "active" &&
        sub.usage < 5 &&
        rules.find((r) => r.action === "cancel")?.enabled
    )

  const flaggedForAction = [
    ...getLowUsageSubscriptions(),
    ...getZeroUsageSubscriptions(),
  ]
  const uniqueFlagged = [...new Map(flaggedForAction.map((s) => [s.id, s])).values()]

  const toggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  const executeAutomation = async () => {
    setIsExecuting(true)
    setShowConfirmDialog(false)
    setShowExecutionPanel(true)

    // Build execution steps
    const steps: ExecutionStep[] = uniqueFlagged.map((sub) => ({
      id: sub.id,
      subscription: sub,
      action: sub.usage < 5 ? "cancel" : "downgrade",
      status: "pending" as const,
    }))
    setExecutionSteps(steps)

    // Execute each step with visual feedback
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]

      // Update to signing
      setExecutionSteps((prev) =>
        prev.map((s) => (s.id === step.id ? { ...s, status: "signing" } : s))
      )
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Update to executing
      setExecutionSteps((prev) =>
        prev.map((s) => (s.id === step.id ? { ...s, status: "executing" } : s))
      )
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Apply the change
      setSubscriptions((prev) =>
        prev.map((sub) => {
          if (sub.id === step.subscription.id) {
            if (step.action === "cancel") {
              return { ...sub, status: "cancelled", usage: 0 }
            }
            return { ...sub, status: "downgraded", plan: "3 months" as const }
          }
          return sub
        })
      )

      // Mark completed
      setExecutionSteps((prev) =>
        prev.map((s) => (s.id === step.id ? { ...s, status: "completed" } : s))
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsExecuting(false)
    setPendingAction(null)
  }

  const handleResubscribe = (subscription: Subscription) => {
    setSubscriptions((prev) =>
      prev.map((sub) =>
        sub.id === subscription.id
          ? { ...sub, status: "active", usage: Math.floor(Math.random() * 40) + 10 }
          : sub
      )
    )
  }

  const handleAddSubscription = () => {
    if (!newSub.name) return

    const newSubscription: Subscription = {
      id: String(Date.now()),
      name: newSub.name,
      plan: newSub.plan,
      usage: newSub.usage,
      status: "active",
      monthlyPrice: newSub.monthlyPrice,
      icon: "layout",
    }

    setSubscriptions((prev) => [...prev, newSubscription])
    setShowAddDialog(false)
    setNewSub({ name: "", plan: "6 months", usage: 50, monthlyPrice: 10 })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Automation Rules */}
        <div className="mb-8 rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Automation Rules
              </h2>
              <p className="text-xs text-muted-foreground">
                Agent will act when these conditions are met
              </p>
            </div>
            <div className="flex h-6 items-center gap-1.5 rounded bg-green-500/10 px-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-600">
                Monitoring
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm text-foreground">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rule.description} ({rule.threshold}% threshold)
                  </p>
                </div>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => toggleRule(rule.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        {uniqueFlagged.length > 0 && (
          <div className="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
            <div className="mb-4">
              <h2 className="text-sm font-medium text-foreground">
                {uniqueFlagged.length} subscription
                {uniqueFlagged.length > 1 ? "s" : ""} flagged
              </h2>
              <p className="text-xs text-muted-foreground">
                Based on your rules, the agent recommends action on these
              </p>
            </div>

            <div className="mb-4 space-y-2">
              {uniqueFlagged.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded bg-background/50 px-3 py-2"
                >
                  <div>
                    <span className="text-sm text-foreground">{sub.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {sub.usage}% usage
                    </span>
                  </div>
                  <span className="text-xs font-medium text-amber-600">
                    {sub.usage < 5 ? "Will cancel" : "Will downgrade"}
                  </span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => {
                setPendingAction({ type: "bulk" })
                setShowConfirmDialog(true)
              }}
              disabled={isExecuting}
              className="w-full"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing via MetaMask...
                </>
              ) : (
                `Execute all ${uniqueFlagged.length} actions`
              )}
            </Button>
          </div>
        )}

        {/* Execution Panel - Shows step by step progress */}
        {showExecutionPanel && executionSteps.length > 0 && (
          <div className="mb-8 rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">
                Agent Execution Log
              </h2>
              {!isExecuting && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    setShowExecutionPanel(false)
                    setExecutionSteps([])
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {executionSteps.map((step, index) => (
                <div key={step.id} className="relative">
                  {index < executionSteps.length - 1 && (
                    <div className="absolute left-3 top-8 h-full w-px bg-border" />
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        step.status === "completed"
                          ? "bg-green-500"
                          : step.status === "failed"
                            ? "bg-destructive"
                            : step.status === "signing" ||
                                step.status === "executing"
                              ? "bg-amber-500"
                              : "bg-secondary"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <Check className="h-3 w-3 text-white" />
                      ) : step.status === "failed" ? (
                        <X className="h-3 w-3 text-white" />
                      ) : step.status === "signing" ||
                        step.status === "executing" ? (
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {step.action === "cancel" ? "Cancel" : "Downgrade"}{" "}
                          {step.subscription.name}
                        </p>
                        <span
                          className={`text-xs ${
                            step.status === "completed"
                              ? "text-green-600"
                              : step.status === "failed"
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {step.status === "pending" && "Waiting..."}
                          {step.status === "signing" &&
                            "Requesting signature..."}
                          {step.status === "executing" &&
                            "Executing transaction..."}
                          {step.status === "completed" && "Completed"}
                          {step.status === "failed" && "Failed"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {step.action === "cancel"
                          ? `Cancelling subscription (${step.subscription.usage}% usage)`
                          : `Downgrading to 3 months (${step.subscription.usage}% usage)`}
                      </p>
                      {(step.status === "signing" ||
                        step.status === "executing") && (
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
                          <div className="h-1 w-1/2 animate-pulse rounded-full bg-amber-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!isExecuting &&
              executionSteps.every((s) => s.status === "completed") && (
                <div className="mt-4 rounded-lg bg-green-500/10 p-3">
                  <p className="text-sm font-medium text-green-600">
                    All actions completed successfully
                  </p>
                  <p className="text-xs text-green-600/80">
                    {executionSteps.length} transaction
                    {executionSteps.length > 1 ? "s" : ""} executed via MetaMask
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Subscriptions List */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-foreground">
              All Subscriptions
            </h2>
            <p className="text-xs text-muted-foreground">
              {subscriptions.filter((s) => s.status === "active").length} active,{" "}
              {subscriptions.filter((s) => s.status !== "active").length}{" "}
              inactive
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-transparent"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {subscriptions.map((subscription) => {
            const isFlagged = uniqueFlagged.some((f) => f.id === subscription.id)

            return (
              <div
                key={subscription.id}
                className={`rounded-lg border p-4 ${
                  isFlagged
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">
                        {subscription.name}
                      </h3>
                      {subscription.status === "cancelled" && (
                        <span className="text-xs text-muted-foreground">
                          cancelled
                        </span>
                      )}
                      {subscription.status === "downgraded" && (
                        <span className="text-xs text-amber-600">downgraded</span>
                      )}
                      {isFlagged && (
                        <span className="text-xs text-amber-600">flagged</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {subscription.plan} - ${subscription.monthlyPrice}/mo
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {subscription.status !== "cancelled" && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {subscription.usage}%
                        </p>
                        <div className="mt-1 h-1 w-16 rounded-full bg-secondary">
                          <div
                            className={`h-1 rounded-full ${
                              subscription.usage < 30
                                ? "bg-amber-500"
                                : "bg-foreground"
                            }`}
                            style={{ width: `${subscription.usage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {subscription.status === "cancelled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 bg-transparent text-xs"
                        onClick={() => handleResubscribe(subscription)}
                      >
                        Resubscribe
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Execute automation</DialogTitle>
              <DialogDescription>
                This will execute {uniqueFlagged.length} action
                {uniqueFlagged.length > 1 ? "s" : ""} via MetaMask. Each
                transaction will be signed individually.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              {uniqueFlagged.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{sub.name}</span>
                  <span className="text-muted-foreground">
                    {sub.usage < 5 ? "Cancel" : "Downgrade to 3 months"}
                  </span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={executeAutomation}>Sign with MetaMask</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Subscription Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add subscription</DialogTitle>
              <DialogDescription>
                Add a new subscription to be monitored by the agent.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Service name
                </label>
                <Input
                  placeholder="e.g. Slack, Dropbox, Zoom"
                  value={newSub.name}
                  onChange={(e) =>
                    setNewSub((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Plan duration
                </label>
                <Select
                  value={newSub.plan}
                  onValueChange={(v) =>
                    setNewSub((prev) => ({
                      ...prev,
                      plan: v as Subscription["plan"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3 months">3 months</SelectItem>
                    <SelectItem value="6 months">6 months</SelectItem>
                    <SelectItem value="10 months">10 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Monthly price ($)
                </label>
                <Input
                  type="number"
                  value={newSub.monthlyPrice}
                  onChange={(e) =>
                    setNewSub((prev) => ({
                      ...prev,
                      monthlyPrice: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Current usage (%)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newSub.usage}
                  onChange={(e) =>
                    setNewSub((prev) => ({
                      ...prev,
                      usage: Number(e.target.value),
                    }))
                  }
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Set below 30% to trigger downgrade rule, below 5% to trigger
                  cancel rule
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSubscription} disabled={!newSub.name}>
                Add subscription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
