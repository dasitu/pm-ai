<template>
  <div class="team-metrics-analysis">
    <v-card>
      <v-card-title class="d-flex align-center">
        团队度量指标分析
        <v-spacer></v-spacer>
      </v-card-title>
      
      <!-- 文件上传区域 -->
      <v-card-text>
        <v-file-input
          v-model="files"
          multiple
          accept=".xlsx"
          label="上传月度数据文件"
          prepend-icon="mdi-file-excel"
          @update:model-value="handleFiles"
        ></v-file-input>
      </v-card-text>

      <!-- 饼图区域 -->
      <v-card-text v-if="metricsData.length > 0">
        <h3 class="text-subtitle-1 mb-4">敏捷组评估等级分布</h3>
        <v-row>
          <v-col v-for="(chartData, index) in monthlyAgileLevelCharts" :key="index" cols="12" md="4">
            <v-card elevation="2" class="pa-2">
              <v-card-title class="text-subtitle-2">{{ chartData.month }}</v-card-title>
              <v-chart class="level-chart" :option="chartData.option" autoresize />
              <!-- 添加等级分布表格 -->
              <v-table density="compact" class="mt-2 level-table">
                <thead>
                  <tr>
                    <th>等级</th>
                    <th>团队数量</th>
                    <th>占比</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, itemIndex) in chartData.levelData" :key="itemIndex">
                    <td>
                      <v-chip
                        :color="getColorByLevel(item.level)"
                        size="x-small"
                        class="text-white"
                      >{{ item.level }}</v-chip>
                    </td>
                    <td class="text-right">{{ item.count }}</td>
                    <td class="text-right">{{ item.percent }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 筛选条件 -->
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedTeams"
              :items="teamList"
              label="选择团队"
              multiple
              chips
              clearable
              density="compact"
              @update:model-value="filterData"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedLevelChanges"
              :items="levelChangeOptions"
              label="等级变化"
              multiple
              chips
              clearable
              density="compact"
              @update:model-value="filterData"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 状态变化和警告区域 -->
      <v-card-text v-if="statusChanges.length > 0 || continuousStatus.length > 0">
        <v-tabs v-model="activeTab" color="primary">
          <v-tab value="changes">状态变化</v-tab>
          <v-tab value="warnings">连续状态警告</v-tab>
        </v-tabs>

        <v-window v-model="activeTab">
          <!-- 状态变化表格 -->
          <v-window-item value="changes">
            <v-data-table
              :headers="changeHeaders"
              :items="statusChanges"
              density="compact"
              class="mt-4"
            >
              <template v-slot:item.team="{ item }">
                <a href="#" @click.prevent="selectTeam((item as unknown as TableItem).raw?.team)">
                  {{ (item as unknown as TableItem).raw?.team || '-' }}
                </a>
              </template>
              <template v-slot:item.metric="{ item }">
                <span>{{ (item as unknown as TableItem).raw?.metric || '-' }}</span>
              </template>
              <template v-slot:item.from="{ item }">
                <v-chip
                  v-if="(item as unknown as TableItem).raw && (item as unknown as TableItem).raw.from"
                  :color="getStatusColor((item as unknown as TableItem).raw.from)"
                  size="small"
                >
                  {{ (item as unknown as TableItem).raw.from }}
                </v-chip>
                <span v-else>-</span>
              </template>
              <template v-slot:item.to="{ item }">
                <v-chip
                  v-if="(item as unknown as TableItem).raw && (item as unknown as TableItem).raw.to"
                  :color="getStatusColor((item as unknown as TableItem).raw.to)"
                  size="small"
                >
                  {{ (item as unknown as TableItem).raw.to }}
                </v-chip>
                <span v-else>-</span>
              </template>
              <template v-slot:item.metrics="{ item }">
                <div v-if="(item as unknown as TableItem).raw && (item as unknown as TableItem).raw.metrics && Array.isArray((item as unknown as TableItem).raw.metrics!) && (item as unknown as TableItem).raw.metrics!.length > 0">
                  <v-table density="compact" class="metrics-table">
                    <thead>
                      <tr>
                        <th>指标</th>
                        <th>{{ firstMonthDisplay }}</th>
                        <th>{{ lastMonthDisplay }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(metricChange, index) in (item as unknown as TableItem).raw?.metrics || []" :key="index">
                        <td>{{ metricChange.metric }}</td>
                        <td>
                          <v-chip :color="getStatusColor(metricChange.from)" size="x-small">
                            {{ metricChange.from }}
                          </v-chip>
                        </td>
                        <td>
                          <v-chip :color="getStatusColor(metricChange.to)" size="x-small">
                            {{ metricChange.to }}
                          </v-chip>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
                <span v-else>-</span>
              </template>
              <template v-slot:item.levelChange="{ item }">
                <v-chip
                  v-if="(item as unknown as TableItem).raw?.levelChange"
                  :color="getLevelChangeColor((item as unknown as TableItem).raw?.levelChange || '')"
                  size="small"
                >
                  {{ (item as unknown as TableItem).raw?.levelChange }}
                </v-chip>
                <span v-else>-</span>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- 连续状态警告表格 -->
          <v-window-item value="warnings">
            <v-data-table
              :headers="warningHeaders"
              :items="continuousStatus"
              density="compact"
              class="mt-4"
              :sort-by="[{ key: 'team', order: 'asc' }]"
            >
              <template v-slot:item.team="{ item }">
                <a href="#" @click.prevent="selectTeam(item.team)">
                  {{ item.team || '-' }}
                </a>
              </template>
              <template v-slot:item.metric="{ item }">
                <span>{{ item.metric || '-' }}</span>
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip
                  v-if="item && item.status"
                  :color="getStatusColor(item.status)"
                  size="small"
                >
                  {{ item.status }}
                </v-chip>
                <span v-else>-</span>
              </template>
              <template v-slot:item.startMonth="{ item }">
                <span>{{ item.startMonth || '-' }}</span>
              </template>
              <template v-slot:item.endMonth="{ item }">
                <span>{{ item.endMonth || '-' }}</span>
              </template>
              <template v-slot:item.duration="{ item }">
                <v-chip
                  v-if="item && item.duration"
                  :color="getDurationColor(item.duration)"
                  size="small"
                >
                  {{ item.duration }}个月
                </v-chip>
                <span v-else>-</span>
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { read, utils } from 'xlsx'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'

// 注册必要的 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

// 设置 dayjs 使用中文语言包
dayjs.locale('zh-cn')

// 定义数据接口
interface TeamMetrics {
  teamName: string
  month: string
  agileLevel: string // L1, L2, L3
  metrics: {
    [key: string]: string // GREEN, YELLOW, RED
  }
}

// 定义表格项类型
interface TableItem {
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

// 状态定义
const files = ref<File[]>([])
const teamList = ref<string[]>([])
const monthList = ref<string[]>([])
const metricList = ref<string[]>([])
const selectedTeams = ref<string[]>([])
const selectedLevelChanges = ref<string[]>([])
const metricsData = ref<TeamMetrics[]>([])
const activeTab = ref('changes')
const statusChanges = ref<Array<{
  raw: {
    team: string
    metric: string
    from: string
    to: string
    month: string
    levelChange?: string
    metrics?: Array<{
      metric: string
      from: string
      to: string
    }>
  }
}>>([])
const continuousStatus = ref<Array<{
  team: string
  metric: string
  status: string
  startMonth: string
  endMonth: string
  duration: number
}>>([])

// 表格表头月份显示
const firstMonthDisplay = ref('原状态')
const lastMonthDisplay = ref('新状态')

// 表格配置
const changeHeaders = ref([
  { title: '团队', key: 'team' },
  { title: '指标', key: 'metric' },
  { title: '原状态', key: 'from' },
  { title: '新状态', key: 'to' },
  { title: '指标变化', key: 'metrics' },
  { title: '等级变化', key: 'levelChange' }
])

const warningHeaders = [
  { title: '团队', key: 'team', sortable: true },
  { title: '指标', key: 'metric', sortable: true },
  { title: '状态', key: 'status' },
  { title: '开始月份', key: 'startMonth' },
  { title: '结束月份', key: 'endMonth' },
  { title: '持续时间', key: 'duration' }
]

// 等级变化类型
const levelChangeOptions = ['升级', '降级', '不变']

// 饼图数据
const monthlyAgileLevelCharts = ref<{
  month: string,
  option: any,
  levelData: any[]
}[]>([])

// 获取状态颜色
function getStatusColor(status: string): string {
  // 处理null或undefined情况
  if (!status) return 'grey';
  
  // 检查字符串是否包含特定前缀
  const statusStr = String(status).trim().toUpperCase();
  
  if (statusStr.startsWith('GREEN') || statusStr.includes('L1')) {
    return 'success'
  } else if (statusStr.startsWith('YELLOW') || statusStr.includes('L2')) {
    return 'warning'
  } else if (statusStr.startsWith('RED') || statusStr.includes('L3')) {
    return 'error'
  } else {
    return 'grey'
  }
}

// 获取持续时间颜色
function getDurationColor(duration: number): string {
  if (duration >= 6) return 'error'
  if (duration >= 4) return 'warning'
  return 'success'
}

// 获取等级变化颜色
function getLevelChangeColor(change: string): string {
  switch (change) {
    case '升级':
      return 'success'
    case '降级':
      return 'error'
    case '不变':
      return 'info'
    default:
      return 'grey'
  }
}

// 判断等级变化
function getLevelChange(from: string, to: string): string {
  // 确保输入值是字符串
  const fromStr = String(from || '').trim()
  const toStr = String(to || '').trim()
  
  console.log(`原始等级值: 从 ${fromStr} 到 ${toStr}`)
  
  // 从字符串中提取L1、L2、L3部分
  const fromLevelMatch = fromStr.match(/L(\d)/)
  const toLevelMatch = toStr.match(/L(\d)/)
  
  if (!fromLevelMatch || !toLevelMatch) {
    console.warn(`无法从 "${fromStr}" 或 "${toStr}" 提取等级数字`)
    return '不变'
  }
  
  // 获取数字部分
  const fromLevel = parseInt(fromLevelMatch[1])
  const toLevel = parseInt(toLevelMatch[1])
  
  console.log(`提取的等级数字: 从 L${fromLevel} 到 L${toLevel}`)
  
  // 数字越小，等级越高 (L1 > L2 > L3)
  if (fromLevel > toLevel) {
    console.log(`结果: 升级 (L${fromLevel} -> L${toLevel})`)
    return '升级' // 从高数字到低数字表示升级（如从L3到L1是升级）
  } else if (fromLevel < toLevel) {
    console.log(`结果: 降级 (L${fromLevel} -> L${toLevel})`)
    return '降级' // 从低数字到高数字表示降级（如从L1到L3是降级）
  } else {
    console.log(`结果: 不变 (L${fromLevel} = L${toLevel})`)
    return '不变'
  }
}

// 自定义过滤函数
const customFilter = (value: any, search: string, item: any) => {
  if (search == null || search === '') return true
  
  const itemValue = (item.raw && item.raw[value]) ? String(item.raw[value]).toLowerCase() : ''
  return itemValue.includes(search.toLowerCase())
}

// 自定义排序函数，处理嵌套对象结构
const customSort = (items: any[], sortBy: any[], sortDesc: boolean[], locale: string) => {
  if (!sortBy.length) return items
  
  // 创建一个副本，避免修改原始数据
  const itemsCopy = [...items]
  
  // 根据排序参数进行排序
  return itemsCopy.sort((a, b) => {
    // 使用第一个排序字段
    const sortKey = sortBy[0]
    const sortDirection = sortDesc[0] ? -1 : 1
    
    // 从嵌套的raw对象中获取排序值
    const aValue = a.raw && a.raw[sortKey] ? String(a.raw[sortKey]).toLowerCase() : ''
    const bValue = b.raw && b.raw[sortKey] ? String(b.raw[sortKey]).toLowerCase() : ''
    
    // 按字母顺序比较
    if (aValue < bValue) return -1 * sortDirection
    if (aValue > bValue) return 1 * sortDirection
    return 0
  })
}

// 更新饼图数据
function updateCharts() {
  // 获取所有月份
  const allMonths = [...monthList.value].sort()
  const chartDataArray: { month: string, option: any, levelData: any[] }[] = []
  
  // 定义等级颜色映射
  const levelColorMap: Record<string, string> = {
    'L1': '#4caf50',  // 绿色 - 最好的等级
    'L2': '#ff9800',  // 黄色 - 中等等级
    'L3': '#f44336',  // 红色 - 最差的等级
    '数据不全': '#9e9e9e'  // 灰色 - 未知等级
  }
  
  // 为每个月份创建饼图数据
  allMonths.forEach(month => {
    // 筛选该月份的数据
    const monthData = metricsData.value.filter(item => item.month === month)
    
    // 统计不同敏捷等级的数量
    const levelCounts: Record<string, number> = {}
    let total = 0
    
    // 初始化所有等级计数为0，确保所有等级都存在
    levelCounts['L1'] = 0
    levelCounts['L2'] = 0
    levelCounts['L3'] = 0
    levelCounts['数据不全'] = 0
    
    monthData.forEach(data => {
      // 如果有筛选条件，只统计被选中的团队
      if (selectedTeams.value.length > 0 && !selectedTeams.value.includes(data.teamName)) {
        return
      }
      
      // 简化敏捷等级名称，只保留L1、L2、L3部分
      let simplifiedLevel = '数据不全'
      const levelMatch = data.agileLevel.match(/L[1-3]/)
      if (levelMatch) {
        simplifiedLevel = levelMatch[0]
      }
      
      levelCounts[simplifiedLevel] = (levelCounts[simplifiedLevel] || 0) + 1
      total++
    })
    
    // 转换为饼图数据格式
    const pieData = Object.entries(levelCounts).map(([level, count]) => {
      return {
        name: level,
        value: count,
        percent: total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0.0%',
        itemStyle: {
          color: levelColorMap[level] || levelColorMap['数据不全']
        }
      }
    })
    
    // 准备表格展示数据 - 固定顺序为L1, L2, L3, 数据不全
    const levelData = [
      {
        level: 'L1',
        count: levelCounts['L1'],
        percent: total > 0 ? ((levelCounts['L1'] / total) * 100).toFixed(1) + '%' : '0.0%'
      },
      {
        level: 'L2',
        count: levelCounts['L2'],
        percent: total > 0 ? ((levelCounts['L2'] / total) * 100).toFixed(1) + '%' : '0.0%'
      },
      {
        level: 'L3',
        count: levelCounts['L3'],
        percent: total > 0 ? ((levelCounts['L3'] / total) * 100).toFixed(1) + '%' : '0.0%'
      },
      {
        level: '数据不全',
        count: levelCounts['数据不全'],
        percent: total > 0 ? ((levelCounts['数据不全'] / total) * 100).toFixed(1) + '%' : '0.0%'
      }
    ];
    
    // 创建饼图配置
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 'bottom',
        type: 'scroll',
        textStyle: {
          fontSize: 12
        }
      },
      color: [levelColorMap.L1, levelColorMap.L2, levelColorMap.L3, levelColorMap['数据不全']],
      series: [
        {
          type: 'pie',
          radius: '60%',  // 改为实心饼图
          avoidLabelOverlap: true, // 启用标签避免重叠
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}', // 只显示等级名称
            fontSize: 14,
            fontWeight: 'bold'
          },
          labelLayout: {  // 添加标签布局选项
            hideOverlap: true  // 隐藏重叠的标签
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '16',
              fontWeight: 'bold'
            }
          },
          data: pieData
        }
      ]
    }
    
    chartDataArray.push({
      month,
      option,
      levelData
    })
  })
  
  monthlyAgileLevelCharts.value = chartDataArray
}

// 根据等级获取颜色
function getColorByLevel(level: string): string {
  switch(level) {
    case 'L1': return 'success';
    case 'L2': return 'warning';
    case 'L3': return 'error';
    default: return 'grey';
  }
}

// 处理文件上传
const handleFiles = async (uploadedFiles: any) => {
  try {
    if (!uploadedFiles) return
    
    const newData: TeamMetrics[] = []
    const files = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]
    
    for (const file of files) {
      const data = await file.arrayBuffer()
      const workbook = read(data)
      
      // 从文件名解析月份
      const month = parseMonthFromFileName(file.name)
      
      // 只处理第一个工作表
      if (workbook.SheetNames.length > 0) {
        try {
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const jsonData = utils.sheet_to_json(sheet)
          
          // 处理数据并添加到newData
          processTeamData(jsonData, month, newData)
        } catch (sheetError) {
          console.error(`处理工作表时出错:`, sheetError)
        }
      }
    }
    
    // 更新数据
    metricsData.value = newData
    
    // 更新选项列表
    updateLists(newData)
    
    // 更新图表和数据
    updateCharts()
    updateData()
    
  } catch (error) {
    console.error('处理文件时出错:', error)
    alert('处理文件时出错: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 从文件名解析月份
function parseMonthFromFileName(fileName: string): string {
  const match = fileName.match(/(\d{4})(\d{2})/)
  if (match) {
    const [_, year, month] = match
    return `${year}年${month}月`
  }
  return '未知月份'
}

// 处理团队数据
function processTeamData(data: any[], month: string, newData: TeamMetrics[]) {
  data.forEach(row => {
    // 确保有团队名称
    if (!row['敏捷组名称']) {
      console.warn('跳过没有敏捷组名称的行:', row)
      return
    }
    
    // 标准化敏捷组评估等级
    let agileLevel = row['敏捷组评估等级'] || '未知'
    // 移除可能的空格
    agileLevel = agileLevel.trim()
    
    const teamMetrics: TeamMetrics = {
      teamName: row['敏捷组名称'], // 使用敏捷组名称作为团队名称
      month: month,
      agileLevel: agileLevel,
      metrics: {}
    }
    
    // 处理其他指标
    Object.keys(row).forEach(key => {
      if (key !== '敏捷组名称' && key !== '敏捷组评估等级') {
        teamMetrics.metrics[key] = row[key]
      }
    })
    
    newData.push(teamMetrics)
  })
}

// 更新选项列表
function updateLists(data: TeamMetrics[]) {
  // 更新团队列表
  teamList.value = [...new Set(data.map(item => item.teamName))]
  
  // 更新月份列表
  monthList.value = [...new Set(data.map(item => item.month))]
  
  // 更新指标列表
  const metrics = new Set<string>()
  data.forEach(item => {
    Object.keys(item.metrics).forEach(metric => metrics.add(metric))
  })
  metricList.value = Array.from(metrics)
}

// 分析团队状态变化
function analyzeTeamStatusChanges() {
  // 创建一个Map来保存每个团队的变化
  const teamChanges = new Map<string, {
    team: string,
    metrics: Array<{
      metric: string,
      from: string,
      to: string,
      month: string
    }>,
    agileLevel?: {
      from: string,
      to: string,
      month: string,
      levelChange: string
    }
  }>()
  
  // 创建最终返回的变化数组
  const changes: Array<{
    raw: {
      team: string
      metric: string
      from: string
      to: string
      month: string
      levelChange?: string
      metrics?: Array<{
        metric: string
        from: string
        to: string
      }>
    }
  }> = []
  
  // 获取所有月份并排序
  const allMonths = [...monthList.value].sort()
  console.log("所有可用月份:", allMonths)
  
  // 如果月份不足，无法分析变化
  if (allMonths.length < 2) {
    console.log("月份数量不足，无法分析变化")
    return []
  }
  
  // 只使用最近两个月进行表头更新
  const lastTwoMonths = allMonths.slice(-2)
  const firstMonth = lastTwoMonths[0]
  const lastMonth = lastTwoMonths[1]
  
  console.log(`使用最近两个月进行分析: ${firstMonth} 和 ${lastMonth}`)
  
  // 更新表头
  changeHeaders.value = [
    { title: '团队', key: 'team' },
    { title: '指标', key: 'metric' },
    { title: firstMonth, key: 'from' },
    { title: lastMonth, key: 'to' },
    { title: '指标变化', key: 'metrics' },
    { title: '等级变化', key: 'levelChange' }
  ]
  
  // 更新嵌套表格的表头
  firstMonthDisplay.value = firstMonth
  lastMonthDisplay.value = lastMonth
  
  // 按团队分组数据
  const teamData = new Map<string, TeamMetrics[]>()
  metricsData.value.forEach(item => {
    // 应用筛选条件
    if (selectedTeams.value.length > 0 && !selectedTeams.value.includes(item.teamName)) return
    
    // 只关注最近两个月的数据
    if (!lastTwoMonths.includes(item.month)) return
    
    if (!teamData.has(item.teamName)) {
      teamData.set(item.teamName, [])
    }
    teamData.get(item.teamName)!.push(item)
  })
  
  console.log(`分析 ${teamData.size} 个团队的状态变化`)
  
  // 分析每个团队的变化
  teamData.forEach((data, team) => {
    // 如果数据不足两个月，则跳过
    if (data.length < 2) {
      console.log(`团队 ${team} 不满足两个月的数据条件，跳过分析`)
      return
    }
    
    // 按月份排序
    data.sort((a, b) => a.month.localeCompare(b.month))
    
    // 提取最近两个月的数据
    const teamFirstMonth = data.find(d => d.month === firstMonth)
    const teamLastMonth = data.find(d => d.month === lastMonth)
    
    if (!teamFirstMonth || !teamLastMonth) {
      console.log(`团队 ${team} 缺少 ${firstMonth} 或 ${lastMonth} 的数据，跳过分析`)
      return
    }
    
    console.log(`分析团队 ${team} 在 ${firstMonth} 到 ${lastMonth} 之间的变化:`)
    
    // 初始化团队变化
    if (!teamChanges.has(team)) {
      teamChanges.set(team, {
        team,
        metrics: []
      })
    }
    
    // 分析敏捷组评估等级变化 - 现在无论是否变化都记录
    const levelChange = teamFirstMonth.agileLevel !== teamLastMonth.agileLevel
      ? getLevelChange(teamFirstMonth.agileLevel, teamLastMonth.agileLevel)
      : '不变'
    
    console.log(`敏捷等级变化状态: ${team} 从 ${teamFirstMonth.agileLevel} 到 ${teamLastMonth.agileLevel}, 变化类型: ${levelChange}`)
    
    // 记录敏捷等级变化（包括不变的情况）
    teamChanges.get(team)!.agileLevel = {
      from: teamFirstMonth.agileLevel,
      to: teamLastMonth.agileLevel,
      month: teamLastMonth.month,
      levelChange: levelChange
    }
    
    // 分析其他指标变化
    if (teamFirstMonth.metrics && teamLastMonth.metrics) {
      // 获取所有指标
      const metrics = new Set([
        ...Object.keys(teamFirstMonth.metrics), 
        ...Object.keys(teamLastMonth.metrics)
      ])
      
      metrics.forEach(metric => {
        const fromValue = teamFirstMonth.metrics[metric] || ''
        const toValue = teamLastMonth.metrics[metric] || ''
        
        if (fromValue !== toValue) {
          teamChanges.get(team)!.metrics.push({
            metric,
            from: fromValue,
            to: toValue,
            month: teamLastMonth.month
          })
          
          console.log(`指标 ${metric} 变化: 从 ${fromValue} 到 ${toValue}`)
        }
      })
    }
  })
  
  // 将团队变化转换为最终格式
  teamChanges.forEach(change => {
    // 添加所有团队的敏捷等级数据（包括不变的）
    if (change.agileLevel) {
      // 应用等级变化筛选
      if (selectedLevelChanges.value.length > 0 && !selectedLevelChanges.value.includes(change.agileLevel.levelChange)) {
        console.log(`由于筛选条件，跳过团队 ${change.team} 的等级变化记录: ${change.agileLevel.levelChange}`)
        return
      }
      
      console.log(`添加敏捷等级记录到最终结果: 团队 ${change.team}, 从 ${change.agileLevel.from} 到 ${change.agileLevel.to}, 变化类型: ${change.agileLevel.levelChange}`)
      
      changes.push({
        raw: {
          team: change.team,
          metric: '敏捷组评估等级',
          from: change.agileLevel.from,
          to: change.agileLevel.to,
          month: change.agileLevel.month,
          levelChange: change.agileLevel.levelChange,
          metrics: change.metrics.map(m => ({
            metric: m.metric,
            from: m.from,
            to: m.to
          }))
        }
      })
    }
  })
  
  console.log(`共检测到 ${changes.length} 个团队记录将显示在表格中`)
  
  // 对变化进行排序，按照团队名称排序
  changes.sort((a, b) => a.raw.team.localeCompare(b.raw.team))
  
  return changes
}

// 检测连续指标状态
function detectContinuousStatus(months: number = 3) {  // 改为默认值3个月
  const continuousStatus: Array<{
    team: string
    metric: string
    status: string
    startMonth: string
    endMonth: string
    duration: number
  }> = []
  
  // 按团队分组数据
  const teamData = new Map<string, TeamMetrics[]>()
  metricsData.value.forEach(item => {
    // 应用筛选条件
    if (selectedTeams.value.length > 0 && !selectedTeams.value.includes(item.teamName)) return
    
    if (!teamData.has(item.teamName)) {
      teamData.set(item.teamName, [])
    }
    teamData.get(item.teamName)!.push(item)
  })
  
  // 分析每个团队的连续状态
  teamData.forEach((data, team) => {
    // 如果数据为空，跳过
    if (data.length < months) return // 至少需要3个数据点
    
    // 按月份排序
    data.sort((a, b) => a.month.localeCompare(b.month))
    
    // 分析评估等级连续状态
    let currentStatus = data[0].agileLevel
    let startMonth = data[0].month
    let duration = 1
    
    for (let i = 1; i < data.length; i++) {
      if (data[i].agileLevel === currentStatus) {
        duration++
        if (duration >= months) {
          // 只有当状态是L3时才添加到连续告警
          const isL3 = currentStatus.toUpperCase().includes('L3')
          
          if (isL3) {
            continuousStatus.push({
              team,
              metric: '敏捷组评估等级',
              status: currentStatus,
              startMonth,
              endMonth: data[i].month,
              duration
            })
          }
        }
      } else {
        currentStatus = data[i].agileLevel
        startMonth = data[i].month
        duration = 1
      }
    }
    
    // 确保有数据并且有指标
    if (data.length > 0 && data[0] && data[0].metrics) {
      // 分析其他指标连续状态
      const metrics = Object.keys(data[0].metrics)
      metrics.forEach(metric => {
        // 不再使用指标筛选条件
        currentStatus = data[0].metrics[metric]
        startMonth = data[0].month
        duration = 1
        
        for (let i = 1; i < data.length; i++) {
          if (data[i].metrics[metric] === currentStatus) {
            duration++
            if (duration >= months) {
              // 只有当状态是RED时才添加到连续告警
              const isRed = currentStatus.toUpperCase().includes('RED')
              
              if (isRed) {
                continuousStatus.push({
                  team,
                  metric,
                  status: currentStatus,
                  startMonth,
                  endMonth: data[i].month,
                  duration
                })
              }
            }
          } else {
            currentStatus = data[i].metrics[metric]
            startMonth = data[i].month
            duration = 1
          }
        }
      })
    }
  })
  
  return continuousStatus
}

// 更新数据
function updateData() {
  // 直接更新状态变化和连续状态的数据
  statusChanges.value = analyzeTeamStatusChanges()
  continuousStatus.value = detectContinuousStatus()
}

// 过滤数据
function filterData() {
  updateData()
  updateCharts() // 更新饼图以反映筛选条件
}

// 点击团队名称链接时的处理函数
function selectTeam(team: string | undefined) {
  if (!team) return
  
  // 设置选中的团队
  selectedTeams.value = [team]
  
  // 清空等级变化筛选
  selectedLevelChanges.value = []
  
  // 更新图表
  filterData()
  
  // 滚动到顶部筛选区域
  setTimeout(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, 100)
}

// 暴露方法供父组件调用
defineExpose({
  handleFiles,
  getColorByLevel
})
</script>

<style>
.team-metrics-analysis {
  width: 100%;
  height: 100%;
  min-height: 600px;
  padding: 20px;
}

/* 调整按钮和选择器大小 */
.v-select {
  max-height: 40px;
}

.v-select .v-field__input {
  min-height: 36px !important;
  padding-top: 0 !important;
}

.v-select .v-chip {
  margin: 2px;
}

/* 表格样式 */
.v-data-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.v-data-table .v-data-table-header {
  background-color: #f5f5f5;
}

.v-data-table .v-data-table-footer {
  background-color: #f5f5f5;
}

/* 指标变化表格样式 */
.metrics-table {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  margin: 0;
  padding: 0;
  width: 100%;
}

.metrics-table th {
  background-color: #f5f5f5;
  font-size: 0.8rem;
  padding: 2px 4px !important;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.metrics-table td {
  font-size: 0.8rem;
  padding: 2px 4px !important;
  text-align: center;
  vertical-align: middle;
}

/* 饼图样式 */
.level-chart {
  height: 300px;
  width: 100%;
}
</style> 