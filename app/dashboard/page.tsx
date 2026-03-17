"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { useWeb3 } from "@/components/providers/web3-provider"
import { mockDashboardStats, mockSubscriptions, type Subscription } from "@/lib/mock-data"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function DashboardPage() {
  const { wallet } = useWeb3()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(mockSubscriptions)

  useEffect(() => {
    const saved = localStorage.getItem("user_subscriptions")
    if (saved) {
      try {
        setSubscriptions(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse subscriptions", e)
      }
    }
  }, [])

  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.status === "active"
  ).length

  const getChainName = (chainId: number | null) => {
    const chains: Record<number, string> = {
      1: "Ethereum",
      5: "Goerli",
      11155111: "Sepolia",
      137: "Polygon",
      80001: "Mumbai",
      42161: "Arbitrum",
    }
    return chainId ? chains[chainId] || `Chain ${chainId}` : "Not connected"
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Status */}
        <div className="mb-12">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">
              Agent running
            </span>
          </div>

          <h1 className="mb-2 text-2xl font-semibold text-foreground">
            You have saved {mockDashboardStats.automationSavings} ETH this
            month.
          </h1>
          <p className="text-muted-foreground">
            {activeSubscriptions} active subscriptions being monitored.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Balance</p>
            <p className="text-lg font-medium text-foreground">
              {wallet.isConnected
                ? wallet.balance
                : mockDashboardStats.agentBalance}{" "}
              ETH
            </p>
          </div>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Monthly spend</p>
            <p className="text-lg font-medium text-foreground">
              {mockDashboardStats.monthlySpend} ETH
            </p>
          </div>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Services</p>
            <p className="text-lg font-medium text-foreground">
              {activeSubscriptions} of {subscriptions.length}
            </p>
          </div>
          <div>
            <p className="mb-1 text-sm text-muted-foreground">Network</p>
            <p className="text-lg font-medium text-foreground">
              {getChainName(wallet.chainId)}
            </p>
          </div>
        </div>

        {/* Pending Actions Alert */}
        {subscriptions.filter((s) => s.status === "active" && s.usage < 30)
          .length > 0 && (
          <Link
            href="/subscriptions"
            className="mb-12 block rounded-lg border border-amber-500/30 bg-amber-500/5 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {
                    subscriptions.filter(
                      (s) => s.status === "active" && s.usage < 30
                    ).length
                  }{" "}
                  subscriptions need attention
                </p>
                <p className="text-xs text-muted-foreground">
                  Low usage detected - agent ready to optimize
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-amber-600" />
            </div>
          </Link>
        )}

        {/* Connection info */}
        <div className="mb-12 rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 text-sm font-medium text-foreground">
            Agent Status
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wallet</span>
              <span className="font-mono text-foreground">
                {wallet.address
                  ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
                  : "Not connected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agent ID</span>
              <span className="font-mono text-foreground">
                ASM-0x7f3a...9b2e
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rules enabled</span>
              <span className="text-foreground">2 active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span className="text-green-600">Monitoring</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-3">
          <Link
            href="/subscriptions"
            className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
          >
            <div>
              <p className="font-medium text-foreground">Subscriptions</p>
              <p className="text-sm text-muted-foreground">
                Manage your services and rules
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/activity"
            className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
          >
            <div>
              <p className="font-medium text-foreground">Activity</p>
              <p className="text-sm text-muted-foreground">
                View recent automation actions
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>
    </div>
  )
}
