"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useWeb3 } from "@/components/providers/web3-provider"
import { Wallet, LogOut, Loader2 } from "lucide-react"

export function Header() {
  const { wallet, connect, disconnect, isConnecting } = useWeb3()
  const pathname = usePathname()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/98 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-sm font-semibold text-foreground">
            AutoSub
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/dashboard"
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive("/dashboard")
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/subscriptions"
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive("/subscriptions")
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Subscriptions
            </Link>
            <Link
              href="/activity"
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive("/activity")
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Activity
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {wallet.isConnected ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:block font-mono">
                {formatAddress(wallet.address!)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={connect}
              disabled={isConnecting}
              size="sm"
              className="h-8"
            >
              {isConnecting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wallet className="mr-1.5 h-3.5 w-3.5" />
              )}
              Connect
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
