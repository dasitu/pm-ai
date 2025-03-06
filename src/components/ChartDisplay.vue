<template>
  <v-card v-if="chartStore.data.length > 0">
    <v-card-title>数据图表</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedChartType"
            :items="chartTypes"
            label="选择图表类型"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedColumn"
            :items="availableColumns"
            label="选择要展示的数据列"
          ></v-select>
        </v-col>
      </v-row>
      <v-chart class="chart" :option="chartOption" autoresize />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChartStore } from '../stores/chart'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'

// 注册必要的 ECharts 组件
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

const chartStore = useChartStore()
const selectedChartType = ref('bar')
const selectedColumn = ref('')

const chartTypes = [
  { title: '柱状图', value: 'bar' },
  { title: '折线图', value: 'line' },
  { title: '饼图', value: 'pie' }
]

const availableColumns = computed(() => {
  if (!chartStore.data.length) return []
  return Object.keys(chartStore.data[0]).map(key => ({
    title: key,
    value: key
  }))
})

// 当列表可用时，自动选择第一列
computed(() => {
  if (availableColumns.value.length > 0 && !selectedColumn.value) {
    selectedColumn.value = availableColumns.value[0].value
  }
})

const chartOption = computed(() => {
  const data = chartStore.data
  if (!data.length || !selectedColumn.value) return {}

  const values = data.map(item => item[selectedColumn.value])
  const labels = data.map((_, index) => `数据 ${index + 1}`)

  if (selectedChartType.value === 'pie') {
    return {
      title: {
        text: `${selectedColumn.value} 数据分布`
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      series: [{
        type: 'pie',
        radius: '70%',
        data: values.map((value, index) => ({
          name: labels[index],
          value: value
        }))
      }]
    }
  }

  return {
    title: {
      text: `${selectedColumn.value} 数据展示`
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: labels
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      type: selectedChartType.value,
      data: values
    }]
  }
})
</script>

<style scoped>
.chart {
  height: 400px;
  width: 100%;
}
</style> 