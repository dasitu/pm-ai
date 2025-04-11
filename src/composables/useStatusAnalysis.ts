import { ref, type Ref } from 'vue'
import type { TeamMetrics, TableItem, ContinuousStatus } from '@/types'

export function useStatusAnalysis(
  metricsData: Ref<TeamMetrics[]>,
  monthList: Ref<string[]>,
  selectedTeams: Ref<string[]>,
  selectedLevelChanges: Ref<string[]>
) {
  const statusChanges = ref<TableItem[]>([])
  const continuousStatus = ref<ContinuousStatus[]>([])
  const firstMonthDisplay = ref('原状态')
  const lastMonthDisplay = ref('新状态')

  // 判断等级变化
  function getLevelChange(from: string, to: string): string {
    const fromStr = String(from || '').trim()
    const toStr = String(to || '').trim()
    
    const fromLevelMatch = fromStr.match(/L(\d)/)
    const toLevelMatch = toStr.match(/L(\d)/)
    
    if (!fromLevelMatch || !toLevelMatch) {
      return '不变'
    }
    
    const fromLevel = parseInt(fromLevelMatch[1])
    const toLevel = parseInt(toLevelMatch[1])
    
    if (fromLevel > toLevel) {
      return '升级'
    } else if (fromLevel < toLevel) {
      return '降级'
    } else {
      return '不变'
    }
  }

  // 分析团队状态变化
  function analyzeTeamStatusChanges() {
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

    const changes: TableItem[] = []
    const allMonths = [...monthList.value].sort()

    if (allMonths.length < 2) {
      return []
    }

    const lastTwoMonths = allMonths.slice(-2)
    const firstMonth = lastTwoMonths[0]
    const lastMonth = lastTwoMonths[1]

    firstMonthDisplay.value = firstMonth
    lastMonthDisplay.value = lastMonth

    const teamData = new Map<string, TeamMetrics[]>()
    metricsData.value.forEach(item => {
      if (selectedTeams.value.length > 0 && !selectedTeams.value.includes(item.teamName)) return
      if (!lastTwoMonths.includes(item.month)) return

      if (!teamData.has(item.teamName)) {
        teamData.set(item.teamName, [])
      }
      teamData.get(item.teamName)!.push(item)
    })

    teamData.forEach((data, team) => {
      if (data.length < 2) return

      data.sort((a, b) => a.month.localeCompare(b.month))

      const teamFirstMonth = data.find(d => d.month === firstMonth)
      const teamLastMonth = data.find(d => d.month === lastMonth)

      if (!teamFirstMonth || !teamLastMonth) return

      if (!teamChanges.has(team)) {
        teamChanges.set(team, {
          team,
          metrics: []
        })
      }

      const levelChange = getLevelChange(teamFirstMonth.agileLevel, teamLastMonth.agileLevel)

      teamChanges.get(team)!.agileLevel = {
        from: teamFirstMonth.agileLevel,
        to: teamLastMonth.agileLevel,
        month: teamLastMonth.month,
        levelChange: levelChange
      }

      if (teamFirstMonth.metrics && teamLastMonth.metrics) {
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
          }
        })
      }
    })

    teamChanges.forEach(change => {
      if (change.agileLevel) {
        if (selectedLevelChanges.value.length > 0 && !selectedLevelChanges.value.includes(change.agileLevel.levelChange)) {
          return
        }

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

    changes.sort((a, b) => a.raw.team.localeCompare(b.raw.team))
    return changes
  }

  // 检测连续指标状态
  function detectContinuousStatus(months: number = 3) {
    const result: ContinuousStatus[] = []

    const teamData = new Map<string, TeamMetrics[]>()
    metricsData.value.forEach(item => {
      if (selectedTeams.value.length > 0 && !selectedTeams.value.includes(item.teamName)) return

      if (!teamData.has(item.teamName)) {
        teamData.set(item.teamName, [])
      }
      teamData.get(item.teamName)!.push(item)
    })

    teamData.forEach((data, team) => {
      if (data.length < months) return

      data.sort((a, b) => a.month.localeCompare(b.month))

      let currentStatus = data[0].agileLevel
      let startMonth = data[0].month
      let duration = 1

      for (let i = 1; i < data.length; i++) {
        if (data[i].agileLevel === currentStatus) {
          duration++
          if (duration >= months) {
            const isL3 = currentStatus.toUpperCase().includes('L3')
            
            if (isL3) {
              result.push({
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

      if (data.length > 0 && data[0] && data[0].metrics) {
        const metrics = Object.keys(data[0].metrics)
        metrics.forEach(metric => {
          currentStatus = data[0].metrics[metric]
          startMonth = data[0].month
          duration = 1

          for (let i = 1; i < data.length; i++) {
            if (data[i].metrics[metric] === currentStatus) {
              duration++
              if (duration >= months) {
                const isRed = currentStatus.toUpperCase().includes('RED')
                
                if (isRed) {
                  result.push({
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

    return result
  }

  // 更新数据
  function updateData() {
    statusChanges.value = analyzeTeamStatusChanges()
    continuousStatus.value = detectContinuousStatus()
  }

  return {
    statusChanges,
    continuousStatus,
    firstMonthDisplay,
    lastMonthDisplay,
    updateData,
    getLevelChange
  }
} 