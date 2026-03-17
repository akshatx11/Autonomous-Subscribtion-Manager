export interface Subscription {
  id: string
  name: string
  plan: "3 months" | "6 months" | "10 months"
  usage: number
  status: "active" | "downgraded" | "cancelled"
  monthlyPrice: number
  icon: string
}

export interface Activity {
  id: string
  type: "subscribed" | "downgraded" | "cancelled" | "payment"
  service: string
  timestamp: Date
  label: "Decided by Automation" | "Executed via MetaMask"
  details?: string
}

export const mockSubscriptions: Subscription[] = [
  {
    id: "1",
    name: "Claude AI",
    plan: "10 months",
    usage: 85,
    status: "active",
    monthlyPrice: 20,
    icon: "brain",
  },
  {
    id: "2",
    name: "GitHub Copilot",
    plan: "6 months",
    usage: 62,
    status: "active",
    monthlyPrice: 10,
    icon: "code",
  },
  {
    id: "3",
    name: "Notion",
    plan: "6 months",
    usage: 18,
    status: "active",
    monthlyPrice: 8,
    icon: "file-text",
  },
  {
    id: "4",
    name: "Figma",
    plan: "6 months",
    usage: 3,
    status: "active",
    monthlyPrice: 12,
    icon: "pen-tool",
  },
  {
    id: "5",
    name: "Linear",
    plan: "10 months",
    usage: 95,
    status: "active",
    monthlyPrice: 8,
    icon: "layout",
  },
  {
    id: "6",
    name: "Slack",
    plan: "6 months",
    usage: 22,
    status: "active",
    monthlyPrice: 15,
    icon: "layout",
  },
]

export const mockActivities: Activity[] = [
  {
    id: "1",
    type: "payment",
    service: "Claude AI",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    label: "Executed via MetaMask",
    details: "Monthly payment of 0.008 ETH",
  },
  {
    id: "2",
    type: "downgraded",
    service: "Notion",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    label: "Decided by Automation",
    details: "Usage dropped below 30% threshold",
  },
  {
    id: "3",
    type: "subscribed",
    service: "Linear",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    label: "Executed via MetaMask",
    details: "New 10-month subscription started",
  },
  {
    id: "4",
    type: "cancelled",
    service: "Figma",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    label: "Decided by Automation",
    details: "No usage detected for 30 days",
  },
  {
    id: "5",
    type: "payment",
    service: "GitHub Copilot",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    label: "Executed via MetaMask",
    details: "Monthly payment of 0.004 ETH",
  },
]

export const mockDashboardStats = {
  agentBalance: "2.45",
  activeSubscriptions: 3,
  monthlySpend: "0.024",
  automationSavings: "0.156",
}
