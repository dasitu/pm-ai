import { ref } from 'vue'
import type { TeamMetricsData, MetricStats } from '@/types'
import * as XLSX from 'xlsx'

export function useTeamMetrics() {
  const statsData = ref<{ [period: string]: TeamMetricsData[] }>({})
  const periods = ref<string[]>([])
  const isLoading = ref(false)
  const errorMessage = ref('')
  const showError = ref(false)

  const extractPeriod = (filename: string): string => {
    const match = filename.match(/\d{4}Q[1-4]/i)
    return match ? match[0] : filename
  }

  const readExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  const getMetricStats = (activity: string, period: string, metricType: '过程完成度' | '效果完成度'): MetricStats => {
    const data = statsData.value[period]
    if (!data) return { max: 0, min: 0, avg: 0 }

    const values = data
      .map(item => {
        const metricValue = item.metrics[activity]?.[metricType]
        return metricValue ? parseFloat(metricValue) : 0
      })
      .filter(value => !isNaN(value))

    if (values.length === 0) return { max: 0, min: 0, avg: 0 }

    const max = Math.max(...values)
    const min = Math.min(...values)
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)

    return { max, min, avg }
  }

  return {
    statsData,
    periods,
    isLoading,
    errorMessage,
    showError,
    extractPeriod,
    readExcelFile,
    getMetricStats
  }
} 