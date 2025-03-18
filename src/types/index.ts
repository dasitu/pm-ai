export interface TeamMetrics {
  teamName: string
  month: string
  agileLevel: string
  metrics: Record<string, string>
}

export interface TableItem {
  raw: {
    team: string
    metric: string
    from: string
    to: string
    month: string
    status?: string
    startMonth?: string
    endMonth?: string
    duration?: number
    levelChange?: string
    metrics?: Array<{
      metric: string
      from: string
      to: string
    }>
  }
}

export interface ContinuousStatus {
  team: string
  metric: string
  status: string
  startMonth: string
  endMonth: string
  duration: number
} 