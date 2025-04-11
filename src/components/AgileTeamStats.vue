<template>
  <div class="agile-team-stats">
    <v-card>
      <v-card-title class="d-flex align-center">
        敏捷走查结果统计
        <v-spacer></v-spacer>
      </v-card-title>
      
      <!-- 文件上传区域 -->
      <v-card-text>
        <v-file-input
          v-model="files"
          multiple
          accept=".xlsx"
          label="上传敏捷走查结果数据文件（支持上传两个时期进行对比）"
          prepend-icon="mdi-file-excel"
          @update:model-value="handleFileUpload"
          hide-details
        ></v-file-input>

        <!-- 错误提示 -->
        <v-alert
          v-if="showError"
          type="error"
          class="mt-4"
          closable
          @click:close="showError = false"
        >
          {{ errorMessage }}
        </v-alert>
      </v-card-text>

      <!-- 加载提示 -->
      <v-card-text v-if="isLoading">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        正在处理数据...
      </v-card-text>

      <!-- 图表展示区域 -->
      <v-card-text v-if="Object.keys(statsData).length > 0">
        <!-- 按季度分开展示统计表格 -->
        <template v-for="period in periods" :key="period">
          <v-card elevation="2" class="mb-6">
            <v-card-title>{{ period }} 敏捷活动统计数据</v-card-title>
            <v-card-text>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th rowspan="2" style="vertical-align: middle">送代活动</th>
                    <th colspan="3" class="text-center">过程完成度</th>
                    <th colspan="3" class="text-center">效果完成度</th>
                  </tr>
                  <tr>
                    <th class="text-center">最高</th>
                    <th class="text-center">最低</th>
                    <th class="text-center">平均</th>
                    <th class="text-center">最高</th>
                    <th class="text-center">最低</th>
                    <th class="text-center">平均</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="activity in activities" :key="activity">
                    <td>{{ activity }}</td>
                    <td class="text-center">{{ getMetricStats(activity, period, '过程完成度').max }}%</td>
                    <td class="text-center">{{ getMetricStats(activity, period, '过程完成度').min }}%</td>
                    <td class="text-center">{{ getMetricStats(activity, period, '过程完成度').avg }}%</td>
                    <td class="text-center">{{ getMetricStats(activity, period, '效果完成度').max }}%</td>
                    <td class="text-center">{{ getMetricStats(activity, period, '效果完成度').min }}%</td>
                    <td class="text-center">{{ getMetricStats(activity, period, '效果完成度').avg }}%</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </template>

        <!-- 规范度状态汇总统计 -->
        <v-card elevation="2" class="mb-6">
          <v-card-title>规范度状态汇总统计</v-card-title>
          <v-card-text>
            <v-table density="compact">
              <thead>
                <tr>
                  <th rowspan="2" style="vertical-align: middle; min-width: 90px">状态</th>
                  <template v-for="metric in metrics" :key="metric">
                    <th :colspan="2" class="text-center" :style="{ 'min-width': '80px', 'max-width': '120px' }">
                      {{ metric }}
                    </th>
                  </template>
                </tr>
                <tr>
                  <template v-for="metric in metrics" :key="metric">
                    <th v-for="period in periods" :key="`${metric}-${period}`" class="text-center" style="padding: 8px 4px">
                      {{ period.slice(-2) }}
                    </th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="status in ['良好规范', '较为规范', '不太规范', '有待健全']" :key="status">
                  <td>
                    <v-chip :color="getStatusColor(status)" size="x-small" class="status-chip">
                      {{ status }}
                    </v-chip>
                  </td>
                  <template v-for="metric in metrics" :key="metric">
                    <td
                      v-for="period in periods"
                      :key="`${metric}-${period}`"
                      class="text-center"
                      :class="{
                        'highlight': hasStatusChanged(status, metric),
                        'increased': hasStatusIncreased(status, metric),
                        'decreased': hasStatusDecreased(status, metric)
                      }"
                      style="padding: 8px 4px"
                    >
                      {{ getStatusCount(status, metric, period) }}
                    </td>
                  </template>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>

        <!-- 图表展示区域 -->
        <v-row>
          <v-col v-for="metric in metrics" :key="metric" cols="12">
            <v-card elevation="2" class="pa-4">
              <v-card-title class="text-center">{{ metric }}规范度分布对比</v-card-title>
              <v-row>
                <v-col v-for="period in periods" :key="period" cols="12" md="6">
                  <div :ref="el => setChartRef(el, `${metric}-${period}`)" style="height: 300px"></div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as XLSX from 'xlsx'
import * as echarts from 'echarts'
import type { ComponentPublicInstance } from 'vue'

const files = ref<File[]>([])
const statsData = ref<{ [period: string]: any[] }>({})
const errorMessage = ref('')
const showError = ref(false)
const isLoading = ref(false)
const periods = ref<string[]>([])

// 定义类型
interface MetricData {
  过程完成度: string
  效果完成度: string
  最终状态: string
}

interface TeamData {
  PM: string
  产品线: string
  敏捷组: string
  metrics: {
    [key: string]: MetricData
  }
}

interface StatusCounts {
  '良好规范': number
  '较为规范': number
  '不太规范': number
  '有待健全': number
  [key: string]: number
}

interface ChartData {
  name: string
  value: number
  itemStyle?: {
    color: string
  }
}

const metrics = [
  '基础敏捷约定',
  'Refinement',
  'DailyStandup',
  'Planning',
  'Review',
  'Retrospective'
] as const

// 活动列表
const activities = ref([
  '敏捷基础约定',
  'Refinement',
  '站会',
  'Planning',
  'Review/Demo',
  'Retrospective'
])

const chartRefs: { [key: string]: HTMLElement | null } = {}

// 从文件名中提取时期信息
const extractPeriod = (filename: string): string => {
  const match = filename.match(/\d{4}Q[1-4]/i)
  return match ? match[0] : filename
}

// 更新获取状态计数的方法
const getStatusCount = (status: string, metric: string, period: string): number => {
  const periodData = statsData.value[period]
  if (!periodData) return 0

  const statusCounts: StatusCounts = {
    '良好规范': 0,
    '较为规范': 0,
    '不太规范': 0,
    '有待健全': 0
  }

  periodData.forEach(item => {
    const itemStatus = item.metrics[metric]?.最终状态
    if (itemStatus && itemStatus in statusCounts) {
      statusCounts[itemStatus]++
    }
  })

  return statusCounts[status as keyof StatusCounts] || 0
}

// 图表引用
const basicAgileChart1 = ref<HTMLElement | null>(null)
const basicAgileChart2 = ref<HTMLElement | null>(null)
const refinementChart1 = ref<HTMLElement | null>(null)
const refinementChart2 = ref<HTMLElement | null>(null)
const standupChart1 = ref<HTMLElement | null>(null)
const standupChart2 = ref<HTMLElement | null>(null)
const planningChart1 = ref<HTMLElement | null>(null)
const planningChart2 = ref<HTMLElement | null>(null)
const reviewChart1 = ref<HTMLElement | null>(null)
const reviewChart2 = ref<HTMLElement | null>(null)
const retroChart1 = ref<HTMLElement | null>(null)
const retroChart2 = ref<HTMLElement | null>(null)

// 图表实例
let charts: echarts.ECharts[] = []

// 初始化图表
const initCharts = () => {
  // 销毁现有图表
  charts.forEach(chart => {
    chart.dispose()
  })
  charts = []

  const chartRefs = [
    basicAgileChart1, basicAgileChart2,
    refinementChart1, refinementChart2,
    standupChart1, standupChart2,
    planningChart1, planningChart2,
    reviewChart1, reviewChart2,
    retroChart1, retroChart2
  ]

  charts = chartRefs.map(ref => {
    if (ref.value) {
      const chart = echarts.init(ref.value)
      return chart
    }
    return null
  }).filter(Boolean) as echarts.ECharts[]
}

// 监听窗口大小变化
const handleResize = () => {
  charts.forEach(chart => {
    chart.resize()
  })
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  nextTick(() => {
    initCharts()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(chart => {
    chart.dispose()
  })
})

interface AgileMetrics {
  '基础敏捷约定-最终状态分': string;
  'Refinement-最终状态分': string;
  'DailyStandup-最终状态分': string;
  'Planning-最终状态分': string;
  'Review-最终状态分': string;
  'Retrospective-最终状态分': string;
  [key: string]: any;
}

const processTeamData = (data: any[]): TeamData[] => {
  return data.map(row => {
    // 过滤掉空的__EMPTY字段
    const cleanRow = Object.fromEntries(
      Object.entries(row).filter(([key]) => !key.startsWith('__EMPTY'))
    )

    const processedRow: TeamData = {
      PM: String(cleanRow['PM'] || ''),
      产品线: String(cleanRow['产品线'] || ''),
      敏捷组: String(cleanRow['敏捷组'] || ''),
      metrics: {}
    }

    metrics.forEach(metric => {
      // 处理字段名中可能存在的空格
      const processKey = (key: string) => {
        const variants = [
          key,
          ` ${key}`,  // 前面有空格
          `${key} `   // 后面有空格
        ]
        // 尝试所有可能的字段名组合
        for (const variant of variants) {
          // 检查过程完成度
          if (`${variant}-过程完成度` in cleanRow) {
            return variant
          }
          // 检查带空格的过程完成度
          if (` ${variant}-过程完成度` in cleanRow) {
            return variant
          }
          // 检查最终状态分
          if (`${variant}-最终状态分` in cleanRow) {
            return variant
          }
          // 检查带空格的最终状态分
          if (` ${variant}-最终状态分` in cleanRow) {
            return variant
          }
        }
        return key
      }

      const actualMetric = processKey(metric)
      
      const processValue = (value: any): string => {
        if (typeof value === 'string' && value.includes('%')) {
          return value.replace('%', '')
        }
        return value || '0'
      }

      // 尝试所有可能的字段名组合获取最终状态
      const getFinalStatus = (metric: string): string => {
        const possibleKeys = [
          `${metric}-最终状态分`,
          ` ${metric}-最终状态分`,
          `${metric} -最终状态分`,
          ` ${metric} -最终状态分`
        ]
        for (const key of possibleKeys) {
          if (key in cleanRow) {
            return String(cleanRow[key] || '')
          }
        }
        return '未知'
      }
      
      processedRow.metrics[metric] = {
        过程完成度: processValue(cleanRow[`${actualMetric}-过程完成度`] || cleanRow[` ${actualMetric}-过程完成度`] || '0'),
        效果完成度: processValue(cleanRow[`${actualMetric}-效果完成度`] || cleanRow[` ${actualMetric}-效果完成度`] || '0'),
        最终状态: getFinalStatus(actualMetric)
      }

      // 调试输出
      console.log(`处理${metric}:`, {
        actualMetric,
        状态: processedRow.metrics[metric].最终状态,
        原始数据: cleanRow
      })
    })

    return processedRow
  })
}

// 检查状态是否发生变化
const hasStatusChanged = (status: string, metric: string): boolean => {
  if (periods.value.length !== 2) return false
  const [period1, period2] = periods.value
  const count1 = getStatusCount(status, metric, period1)
  const count2 = getStatusCount(status, metric, period2)
  return count1 !== count2
}

// 检查状态是否增加
const hasStatusIncreased = (status: string, metric: string): boolean => {
  if (periods.value.length !== 2) return false
  const [period1, period2] = periods.value
  const count1 = getStatusCount(status, metric, period1)
  const count2 = getStatusCount(status, metric, period2)
  return count2 > count1
}

// 检查状态是否减少
const hasStatusDecreased = (status: string, metric: string): boolean => {
  if (periods.value.length !== 2) return false
  const [period1, period2] = periods.value
  const count1 = getStatusCount(status, metric, period1)
  const count2 = getStatusCount(status, metric, period2)
  return count2 < count1
}

// 更新图表创建方法中的标题设置
const createMetricCharts = () => {
  // 销毁现有图表
  Object.values(chartRefs).forEach(ref => {
    if (ref) {
      echarts.dispose(ref)
    }
  })

  const statusColors = {
    '良好规范': '#91cc75',
    '较为规范': '#fac858',
    '不太规范': '#ee6666',
    '有待健全': '#73c0de',
    '未知': '#909399'
  }

  metrics.forEach(metric => {
    periods.value.forEach(period => {
      const data = statsData.value[period]
      const statusCounts: { [key: string]: number } = {
        '良好规范': 0,
        '较为规范': 0,
        '不太规范': 0,
        '有待健全': 0
      }

      data.forEach(row => {
        const status = row.metrics[metric]?.最终状态
        if (status && status in statusCounts) {
          statusCounts[status]++
        }
      })

      const chartData: ChartData[] = Object.entries(statusCounts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({
          name: status,
          value: count,
          itemStyle: {
            color: statusColors[status as keyof typeof statusColors]
          }
        }))

      const chartContainer = chartRefs[`${metric}-${period}`]
      if (chartContainer) {
        const chart = echarts.init(chartContainer)
        chart.setOption({
          title: {
            text: period,
            left: 'center',
            top: 0,
            textStyle: {
              fontSize: 14,
              color: '#666'
            }
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'horizontal',
            bottom: 10,
            type: 'scroll'
          },
          series: [
            {
              type: 'pie',
              radius: '50%',
              center: ['50%', '50%'],
              data: chartData,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              },
              label: {
                show: true,
                formatter: '{b}: {c}'
              }
            }
          ]
        })
      }
    })
  })
}

const handleFileUpload = async (files: File | File[] | null) => {
  if (!files) return
  
  try {
    isLoading.value = true
    const fileArray = Array.isArray(files) ? files : [files]
    
    if (fileArray.length !== 2) {
      throw new Error('请上传两个时期的数据文件进行对比')
    }

    // 清空现有数据
    statsData.value = {}
    periods.value = []
    
    // 处理每个文件
    for (const file of fileArray) {
      const period = extractPeriod(file.name)
      const data = await readExcelFile(file)
      const processed = processTeamData(data as AgileMetrics[])
      statsData.value[period] = processed
      periods.value.push(period)
    }

    // 按时期排序
    periods.value.sort()
    
    showError.value = false
    
    // 等待DOM更新后再创建图表
    await nextTick()
    createMetricCharts()
  } catch (error) {
    console.error('处理文件时出错：', error)
    errorMessage.value = `处理文件时出错：${error instanceof Error ? error.message : '未知错误'}`
    showError.value = true
  } finally {
    isLoading.value = false
  }
}

const setChartRef = (el: Element | ComponentPublicInstance | null, metric: string) => {
  if (el instanceof HTMLElement) {
    chartRefs[metric] = el
  } else if (el && 'el' in el && el.el instanceof HTMLElement) {
    chartRefs[metric] = el.el
  }
}

const readExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          throw new Error('文件读取失败')
        }
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // 获取工作表的范围
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
        
        // 修改范围，从第4行开始（索引从0开始，所以是3）
        range.s.r = 3
        worksheet['!ref'] = XLSX.utils.encode_range(range)

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          raw: false,
          defval: ''
        })
        
        resolve(jsonData as any[])
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = (error) => reject(error)
    reader.readAsArrayBuffer(file)
  })
}

function getStatusColor(status: string): string {
  const colorMap: { [key: string]: string } = {
    '良好规范': 'success',
    '较为规范': 'warning',
    '不太规范': 'error',
    '有待健全': 'info',
    '未知': 'grey'
  }
  return colorMap[status] || 'grey'
}

// 计算指标统计数据
const getMetricStats = (activity: string, period: string, type: '过程完成度' | '效果完成度') => {
  const data = statsData.value[period] || []
  const values: number[] = []
  
  // 映射活动名称到指标名称
  const metricMap: { [key: string]: string } = {
    '敏捷基础约定': '基础敏捷约定',
    '站会': 'DailyStandup',
    'Review/Demo': 'Review'
  }
  
  const metricName = metricMap[activity] || activity
  
  data.forEach(item => {
    const value = item.metrics[metricName]?.[type]
    if (value) {
      // 移除百分号并转换为数字
      const numValue = parseFloat(value.toString().replace('%', ''))
      if (!isNaN(numValue)) {
        values.push(numValue)
      }
    }
  })
  
  if (values.length === 0) {
    return { max: 0, min: 0, avg: 0 }
  }
  
  const max = Math.max(...values)
  const min = Math.min(...values)
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  
  return { max, min, avg }
}
</script>

<style scoped>
.agile-team-stats {
  padding: 16px;
}

.v-table {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  overflow: hidden;
}

.v-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  white-space: nowrap;
  padding: 12px 16px;
}

.v-table td {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.text-center {
  text-align: center;
}

.highlight {
  background-color: #fff8e1;
}

.increased {
  color: #2e7d32;
}

.decreased {
  color: #d32f2f;
}

.v-card-title {
  font-size: 1.25rem;
  font-weight: 500;
  padding: 16px;
  background-color: #f5f5f5;
}

.v-card {
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subtitle-1 {
  font-size: 1.1rem;
  font-weight: 500;
  background-color: #e8eaf6;
  padding: 8px;
}

.v-chip {
  margin: 0 4px;
}

.v-progress-circular {
  margin-right: 8px;
}

.v-alert {
  margin-top: 16px;
}

.v-file-input {
  margin-bottom: 16px;
}

.status-chip {
  font-size: 12px !important;
  height: 20px !important;
}

.v-table th {
  font-size: 13px;
  padding: 8px 4px;
}

.v-table td {
  font-size: 13px;
  padding: 8px 4px;
}
</style> 