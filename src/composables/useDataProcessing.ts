import { ref } from 'vue'
import { read, utils } from 'xlsx'
import type { TeamMetrics, TableItem, ContinuousStatus } from '@/types'

export function useDataProcessing() {
  const metricsData = ref<TeamMetrics[]>([])
  const teamList = ref<string[]>([])
  const monthList = ref<string[]>([])
  const statusChanges = ref<Array<{ raw: TableItem['raw'] }>>([])
  const continuousStatus = ref<ContinuousStatus[]>([])

  const getStatusColor = (status: string): string => {
    if (!status) return 'grey'
    const statusStr = String(status).trim().toUpperCase()
    if (statusStr.startsWith('GREEN') || statusStr.includes('L1')) return 'success'
    if (statusStr.startsWith('YELLOW') || statusStr.includes('L2')) return 'warning'
    if (statusStr.startsWith('RED') || statusStr.includes('L3')) return 'error'
    return 'grey'
  }

  const getDurationColor = (duration: number): string => {
    if (duration >= 6) return 'error'
    if (duration >= 4) return 'warning'
    return 'success'
  }

  const getLevelChangeColor = (change: string): string => {
    switch (change) {
      case '升级': return 'success'
      case '降级': return 'error'
      case '不变': return 'info'
      default: return 'grey'
    }
  }

  const getLevelChange = (from: string, to: string): string => {
    const fromStr = String(from || '').trim()
    const toStr = String(to || '').trim()
    const fromLevelMatch = fromStr.match(/L(\d)/)
    const toLevelMatch = toStr.match(/L(\d)/)
    
    if (!fromLevelMatch || !toLevelMatch) return '不变'
    
    const fromLevel = parseInt(fromLevelMatch[1])
    const toLevel = parseInt(toLevelMatch[1])
    
    if (fromLevel > toLevel) return '升级'
    if (fromLevel < toLevel) return '降级'
    return '不变'
  }

  const parseMonthFromFileName = (fileName: string): string => {
    const match = fileName.match(/(\d{4})(\d{2})/)
    return match ? `${match[1]}年${match[2]}月` : '未知月份'
  }

  const processTeamData = (data: any[], month: string, newData: TeamMetrics[]) => {
    data.forEach(row => {
      if (!row['敏捷组名称']) {
        console.warn('跳过没有敏捷组名称的行:', row)
        return
      }
      
      const agileLevel = (row['敏捷组评估等级'] || '未知').trim()
      
      const teamMetrics: TeamMetrics = {
        teamName: row['敏捷组名称'],
        month,
        agileLevel,
        metrics: {}
      }
      
      Object.keys(row).forEach(key => {
        if (key !== '敏捷组名称' && key !== '敏捷组评估等级') {
          teamMetrics.metrics[key] = row[key]
        }
      })
      
      newData.push(teamMetrics)
    })
  }

  const updateLists = (data: TeamMetrics[]) => {
    teamList.value = [...new Set(data.map(item => item.teamName))]
    monthList.value = [...new Set(data.map(item => item.month))]
  }

  const analyzeTeamStatusChanges = (selectedTeams: string[], selectedLevelChanges: string[]) => {
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
    
    const changes: Array<{ raw: TableItem['raw'] }> = []
    const allMonths = [...monthList.value].sort()
    
    if (allMonths.length < 2) return []
    
    const lastTwoMonths = allMonths.slice(-2)
    const firstMonth = lastTwoMonths[0]
    const lastMonth = lastTwoMonths[1]
    
    const teamData = new Map<string, TeamMetrics[]>()
    metricsData.value.forEach((item: TeamMetrics) => {
      if (selectedTeams.length > 0 && !selectedTeams.includes(item.teamName)) return
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
        teamChanges.set(team, { team, metrics: [] })
      }
      
      const levelChange = teamFirstMonth.agileLevel !== teamLastMonth.agileLevel
        ? getLevelChange(teamFirstMonth.agileLevel, teamLastMonth.agileLevel)
        : '不变'
      
      teamChanges.get(team)!.agileLevel = {
        from: teamFirstMonth.agileLevel,
        to: teamLastMonth.agileLevel,
        month: teamLastMonth.month,
        levelChange
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
        if (selectedLevelChanges.length > 0 && !selectedLevelChanges.includes(change.agileLevel.levelChange)) {
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

  const detectContinuousStatus = (selectedTeams: string[], months: number = 3) => {
    const continuousStatus: ContinuousStatus[] = []
    
    const teamData = new Map<string, TeamMetrics[]>()
    metricsData.value.forEach((item: TeamMetrics) => {
      if (selectedTeams.length > 0 && !selectedTeams.includes(item.teamName)) return
      
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
          if (duration >= months && currentStatus.toUpperCase().includes('L3')) {
            continuousStatus.push({
              team,
              metric: '敏捷组评估等级',
              status: currentStatus,
              startMonth,
              endMonth: data[i].month,
              duration
            })
          }
        } else {
          currentStatus = data[i].agileLevel
          startMonth = data[i].month
          duration = 1
        }
      }
      
      if (data.length > 0 && data[0].metrics) {
        Object.keys(data[0].metrics).forEach(metric => {
          currentStatus = data[0].metrics[metric]
          startMonth = data[0].month
          duration = 1
          
          for (let i = 1; i < data.length; i++) {
            if (data[i].metrics[metric] === currentStatus) {
              duration++
              if (duration >= months && currentStatus.toUpperCase().includes('RED')) {
                continuousStatus.push({
                  team,
                  metric,
                  status: currentStatus,
                  startMonth,
                  endMonth: data[i].month,
                  duration
                })
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

  const handleFiles = async (uploadedFiles: any) => {
    try {
      if (!uploadedFiles) return
      
      const newData: TeamMetrics[] = []
      const files = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles]
      
      for (const file of files) {
        const data = await file.arrayBuffer()
        const workbook = read(data)
        const month = parseMonthFromFileName(file.name)
        
        if (workbook.SheetNames.length > 0) {
          try {
            const sheetName = workbook.SheetNames[0]
            const sheet = workbook.Sheets[sheetName]
            const jsonData = utils.sheet_to_json(sheet)
            processTeamData(jsonData, month, newData)
          } catch (sheetError) {
            console.error(`处理工作表时出错:`, sheetError)
          }
        }
      }
      
      metricsData.value = newData
      updateLists(newData)
      
    } catch (error) {
      console.error('处理文件时出错:', error)
      alert('处理文件时出错: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  const updateData = (selectedTeams: string[], selectedLevelChanges: string[]) => {
    statusChanges.value = analyzeTeamStatusChanges(selectedTeams, selectedLevelChanges)
    continuousStatus.value = detectContinuousStatus(selectedTeams)
  }

  return {
    metricsData,
    teamList,
    monthList,
    statusChanges,
    continuousStatus,
    getStatusColor,
    getDurationColor,
    getLevelChangeColor,
    handleFiles,
    updateData
  }
} 