import { ref, type Ref } from 'vue'
import type { TeamMetrics } from '@/types'

export function useCharts(
  metricsData: Ref<TeamMetrics[]>,
  monthList: Ref<string[]>,
  selectedTeams: Ref<string[]>
) {
  const monthlyAgileLevelCharts = ref<{
    month: string,
    option: any,
    levelData: any[]
  }[]>([])

  // 定义等级颜色映射
  const levelColorMap: Record<string, string> = {
    'L1': '#4caf50',
    'L2': '#ff9800',
    'L3': '#f44336',
    '数据不全': '#9e9e9e'
  }

  // 更新饼图数据
  function updateCharts() {
    const allMonths = [...monthList.value].sort()
    const chartDataArray: { month: string, option: any, levelData: any[] }[] = []

    allMonths.forEach(month => {
      const monthData = metricsData.value.filter(item => item.month === month)
      const levelCounts: Record<string, number> = {
        'L1': 0,
        'L2': 0,
        'L3': 0,
        '数据不全': 0
      }
      let total = 0

      monthData.forEach(data => {
        if (selectedTeams.value.length > 0 && !selectedTeams.value.includes(data.teamName)) {
          return
        }

        let simplifiedLevel = '数据不全'
        const levelMatch = data.agileLevel.match(/L[1-3]/)
        if (levelMatch) {
          simplifiedLevel = levelMatch[0]
        }

        levelCounts[simplifiedLevel] = (levelCounts[simplifiedLevel] || 0) + 1
        total++
      })

      // 转换为饼图数据格式
      const pieData = Object.entries(levelCounts)
        .filter(([_, count]) => count > 0) // 过滤掉数量为 0 的项
        .map(([level, count]) => ({
          name: level,
          value: count,
          percent: total > 0 ? ((count / total) * 100).toFixed(1) + '%' : '0.0%',
          itemStyle: {
            color: levelColorMap[level] || levelColorMap['数据不全']
          }
        }))

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
      ]

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
            radius: '60%',
            avoidLabelOverlap: true,
            label: {
              show: true,
              position: 'inside',
              formatter: '{b}',
              fontSize: 14,
              fontWeight: 'bold'
            },
            labelLayout: {
              hideOverlap: true
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
      case 'L1': return 'success'
      case 'L2': return 'warning'
      case 'L3': return 'error'
      default: return 'grey'
    }
  }

  return {
    monthlyAgileLevelCharts,
    updateCharts,
    getColorByLevel
  }
} 