"use client"

import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/providers/web3-provider"
import { useRouter } from "next/navigation"
import { Wallet, ArrowRight, Loader2 } from "lucide-react"

export default function LandingPage() {
  const { wallet, connect, isConnecting } = useWeb3()
  const router = useRouter()

  const handleGetStarted = async () => {
    if (wallet.isConnected) {
      router.push("/dashboard")
    } else {
      await connect()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="px-4 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="mx-auto max-w-2xl">
            <p className="mb-4 text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Subscription automation for Web3
            </p>

            <h1 className="mb-6 text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Stop overpaying for
              <br />
              SaaS you barely use.
            </h1>

            <p className="mb-10 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
              We built an agent that watches your usage and automatically
              adjusts your plans. Connect your wallet, set your rules, and let
              it run.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={handleGetStarted}
                disabled={isConnecting}
                className="h-12 px-6"
              >
                {isConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="mr-2 h-4 w-4" />
                )}
                {wallet.isConnected ? "Open Dashboard" : "Connect Wallet"}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="h-12 px-6 text-muted-foreground"
                onClick={() => router.push("/dashboard")}
              >
                See how it works
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-secondary/30 px-4 py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-12 text-sm font-medium tracking-wide text-muted-foreground uppercase">
              How it works
            </h2>

            <div className="space-y-12">
              <div className="flex gap-6">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                  1
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium text-foreground">
                    Connect your wallet
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Link MetaMask to authorize the automation agent. Your keys
                    stay with you - we just need permission to execute.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                  2
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium text-foreground">
                    Set your rules
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Define usage thresholds for each subscription. If usage
                    drops below 30% for a month, downgrade automatically.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                  3
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-medium text-foreground">
                    Let it run
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The agent monitors your services 24/7 and executes changes
                    when conditions are met. Every action is logged on-chain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why this exists */}
        <section className="border-t border-border px-4 py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              We got tired of wasting money on subscriptions.
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Most SaaS billing is designed to extract maximum revenue, not
                deliver value. You sign up for a Pro plan, use it heavily for a
                month, then forget about it. Six months later you realize you
                have been paying $50/mo for something you used twice.
              </p>
              <p>
                We built this because we wanted a system that actually worked in
                our favor. Something that would automatically catch waste and do
                something about it - without us having to remember.
              </p>
              <p className="text-foreground font-medium">
                Early users are saving 20-40% on their monthly SaaS spend.
              </p>
            </div>
          </div>
        </section>

        {/* Features - simple list */}
        <section className="border-t border-border bg-secondary/30 px-4 py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-sm font-medium tracking-wide text-muted-foreground uppercase">
              What you get
            </h2>

            <ul className="space-y-4">
              {[
                "Usage monitoring across all connected services",
                "Automatic plan switching based on your rules",
                "Full transaction history on-chain",
                "MetaMask signing for every action",
                "Real-time dashboard with savings tracking",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border px-4 py-20">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Ready to stop overpaying?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Connect your wallet to get started. Takes about 2 minutes.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              disabled={isConnecting}
              className="h-12 px-6"
            >
              {isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="mr-2 h-4 w-4" />
              )}
              {wallet.isConnected ? "Open Dashboard" : "Connect Wallet"}
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">AutoSub</span>
            <span className="text-sm text-muted-foreground">
              Made for people who hate wasting money
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
