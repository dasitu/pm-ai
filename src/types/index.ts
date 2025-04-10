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

export interface TeamMetricsData {
  PM: string
  产品线: string
  敏捷组: string
  metrics: {
    [key: string]: {
      过程完成度: string
      效果完成度: string
      最终状态: string
    }
  }
}

export interface StatusCounts {
  '良好规范': number
  '较为规范': number
  '不太规范': number
  '有待健全': number
  [key: string]: number
}

export interface ChartData {
  name: string
  value: number
  itemStyle?: {
    color: string
  }
}

export interface MetricStats {
  max: number
  min: number
  avg: number
} 