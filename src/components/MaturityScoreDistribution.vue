<template>
  <div class="maturity-score-distribution">
    <v-card>
      <v-card-title class="d-flex align-center">
        成熟度评估分数分布
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
          @update:model-value="handleFileUpload"
          hide-details
        ></v-file-input>
      </v-card-text>

      <!-- 图表区域 -->
      <v-card-text v-if="distributionData.length > 0">
        <v-row>
          <v-col v-for="(chartData, index) in distributionData" :key="index" cols="12" md="6">
            <v-card elevation="2" class="pa-2">
              <v-card-title class="text-subtitle-2">{{ chartData.chartTitle }}</v-card-title>
              <v-chart class="distribution-chart" :option="chartData.option" autoresize />
            </v-card>
          </v-col>
        </v-row>
        
        <!-- 统一的统计信息表格 -->
        <v-card elevation="2" class="mt-4">
          <v-card-title class="text-subtitle-1">统计指标汇总</v-card-title>
          <v-table density="compact">
            <thead>
              <tr>
                <th>维度</th>
                <th class="text-right">中位数</th>
                <th class="text-right">平均值</th>
                <th class="text-right">标准差</th>
                <th class="text-right">最大值</th>
                <th class="text-right">最小值</th>
                <th class="text-right">级差</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(data, index) in distributionData" :key="index">
                <td>{{ data.title }}</td>
                <td class="text-right">{{ data.median.toFixed(2) }}</td>
                <td class="text-right">{{ data.mean.toFixed(2) }}</td>
                <td class="text-right">{{ data.std.toFixed(2) }}</td>
                <td class="text-right">{{ data.max.toFixed(2) }}</td>
                <td class="text-right">{{ data.min.toFixed(2) }}</td>
                <td class="text-right">{{ data.range.toFixed(2) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  GraphicComponent
} from 'echarts/components'
import { read, utils } from 'xlsx'

// 注册必要的 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  GraphicComponent
])

const files = ref<File[]>([])
const distributionData = ref<Array<{
  title: string,
  chartTitle: string,
  option: any,
  median: number,
  mean: number,
  std: number,
  max: number,
  min: number,
  range: number
}>>([])

// 清理标题
function cleanTitle(title: string, isForChart: boolean): string {
  // 移除中文方括号【】
  const titleWithoutBrackets = String(title).replace(/[【】]/g, '')
  
  // 尝试提取数字后面的内容
  const numMatch = titleWithoutBrackets.match(/\d+、(.+?)维度得分$/)
  if (numMatch) {
    // 对于图表标题，添加"分布图"
    return isForChart ? `${numMatch[1]}分布图` : numMatch[1]
  }
  
  return titleWithoutBrackets
}

// 处理文件上传
async function handleFileUpload(files: File | File[]) {
  try {
    const fileArray = Array.isArray(files) ? files : [files]
    if (fileArray.length === 0) return
    
    const newData: Array<{
      title: string,
      chartTitle: string,
      option: any,
      median: number,
      mean: number,
      std: number,
      max: number,
      min: number,
      range: number
    }> = []
    
    for (const file of fileArray) {
      const data = await file.arrayBuffer()
      const workbook = read(data)
      
      if (workbook.SheetNames.length > 0) {
        const sheetName = workbook.SheetNames.find(name => name === '原始数据') || workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = utils.sheet_to_json(sheet, { header: 1 })
        
        // 处理数据并创建图表
        processData(jsonData, newData)
      }
    }
    
    distributionData.value = newData
  } catch (error) {
    console.error('处理文件时出错:', error)
    alert('处理文件时出错: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 处理数据并创建图表
function processData(data: any[], chartData: Array<{
  title: string,
  chartTitle: string,
  option: any,
  median: number,
  mean: number,
  std: number,
  max: number,
  min: number,
  range: number
}>) {
  // 确保数据有足够的行和列
  if (!data || data.length < 2 || !data[0] || data[0].length < 3) {
    console.error('数据格式不正确')
    return
  }
  
  // 获取第一行作为标题
  const headers = data[0]
  
  // 从第三列开始处理数据
  for (let col = 2; col < headers.length; col++) {
    // 提取当前列的数据
    const columnData: number[] = []
    
    // 从第二行开始读取数据
    for (let row = 1; row < data.length; row++) {
      if (data[row] && data[row][col] !== undefined && data[row][col] !== null) {
        const value = parseFloat(data[row][col])
        if (!isNaN(value)) {
          columnData.push(value)
        }
      }
    }
    
    if (columnData.length === 0) continue
    
    // 从第一行获取标题
    const chartTitle = cleanTitle(headers[col], true)  // 图表标题带"分布图"
    const tableTitle = cleanTitle(headers[col], false) // 表格标题不带"分布图"
    const median = calculateMedian(columnData)
    const mean = calculateMean(columnData)
    const std = calculateStd(columnData)
    const max = Math.max(...columnData)
    const min = Math.min(...columnData)
    const range = max - min  // 级差
    
    // 生成区间
    const binCount = 10
    const binWidth = (max - min) / binCount
    
    // 生成区间边界，确保精确到小数点后2位
    const bins: number[] = []
    for (let i = 0; i <= binCount; i++) {
      bins.push(Number((min + i * binWidth).toFixed(2)))
    }
    
    // 生成直方图数据
    const histogramData = Array(binCount).fill(0)
    columnData.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1)
      histogramData[binIndex]++
    })
    
    // 生成区间标签
    const binLabels = bins.slice(0, -1).map((bin, i) => 
      `${bin.toFixed(2)}-${bins[i + 1].toFixed(2)}`
    )
    
    // 找出中位数所在的区间索引
    const medianBinIndex = Math.floor((median - min) / binWidth)
    
    // 添加调试信息
    console.log('中位数:', median)
    console.log('中位数区间索引:', medianBinIndex)
    console.log('区间标签:', binLabels)
    console.log('直方图数据:', histogramData)
    
    // 创建基本图表配置
    const option: any = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '18%',
        top: '20%',
        containLabel: true
      },
      graphic: [{
        type: 'group',
        left: medianBinIndex / binCount * 100 + '%',
        top: '5%',
        children: [{
          type: 'text',
          style: {
            text: `中位数: ${median.toFixed(2)}`,
            fill: '#ff0000',
            fontSize: 14,
            textAlign: 'center'
          },
          left: 'center',
          silent: true
        }]
      }],
      xAxis: {
        type: 'category',
        data: binLabels,
        name: '分数区间',
        nameLocation: 'middle',
        nameGap: 75,
        axisLabel: {
          interval: 0,
          rotate: 45,
          margin: 22
        }
      },
      yAxis: {
        type: 'value',
        name: '团队数量',
        nameLocation: 'middle',
        nameGap: 40
      },
      series: [
        {
          name: '团队数量',
          type: 'bar',
          data: histogramData,
          itemStyle: {
            color: '#1976d2'
          },
          barWidth: '60%'
        },
        {
          name: '中位数',
          type: 'line',
          tooltip: {
            show: false
          },
          data: [
            [medianBinIndex, 0],
            [medianBinIndex, Math.max(...histogramData)]
          ],
          lineStyle: {
            color: '#ff0000',
            width: 2,
            type: 'solid'
          },
          symbol: 'none'
        }
      ]
    }
    
    chartData.push({
      title: tableTitle,  // 使用不带"分布图"的标题
      chartTitle,         // 使用带"分布图"的标题
      option,
      median,
      mean,
      std,
      max,
      min,
      range
    })
  }
}

// 计算中位数
function calculateMedian(data: number[]): number {
  const sorted = [...data].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }
  return sorted[middle]
}

// 计算平均值
function calculateMean(data: number[]): number {
  return data.reduce((sum, value) => sum + value, 0) / data.length
}

// 计算标准差
function calculateStd(data: number[]): number {
  const mean = calculateMean(data)
  const squareDiffs = data.map(value => Math.pow(value - mean, 2))
  const avgSquareDiff = calculateMean(squareDiffs)
  return Math.sqrt(avgSquareDiff)
}
</script>

<style>
.maturity-score-distribution {
  width: 100%;
  height: 100%;
  min-height: 600px;
  padding: 20px;
}

.distribution-chart {
  height: 280px;
  width: 100%;
}

.distribution-table {
  margin-top: 16px;
  background: white;
  border-radius: 4px;
  overflow: hidden;
}

.distribution-table th {
  background-color: #f5f5f5;
  font-size: 0.8rem;
  padding: 4px 8px !important;
  text-align: left;
}

.distribution-table td {
  font-size: 0.8rem;
  padding: 4px 8px !important;
}
</style> 