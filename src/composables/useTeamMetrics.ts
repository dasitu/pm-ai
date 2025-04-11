import { ref } from 'vue'
import type { TeamMetrics, TableItem } from '@/types'
import { read, utils } from 'xlsx'
import { parseMonthFromFileName } from '@/utils/fileUtils'

export function useTeamMetrics() {
  const files = ref<File[]>([])
  const teamList = ref<string[]>([])
  const monthList = ref<string[]>([])
  const metricList = ref<string[]>([])
  const selectedTeams = ref<string[]>([])
  const selectedLevelChanges = ref<string[]>([])
  const metricsData = ref<TeamMetrics[]>([])

  // 处理文件上传
  const handleFiles = async (uploadedFiles: File[]) => {
    try {
      if (!uploadedFiles || uploadedFiles.length === 0) return
      
      const newData: TeamMetrics[] = []
      
      for (const file of uploadedFiles) {
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result)
            } else {
              reject(new Error('读取文件失败'))
            }
          }
          reader.onerror = () => reject(reader.error)
          reader.readAsArrayBuffer(file)
        })
        
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
      
      return newData
    } catch (error) {
      console.error('处理文件时出错:', error)
      throw error
    }
  }

  // 处理团队数据
  function processTeamData(data: any[], month: string, newData: TeamMetrics[]) {
    data.forEach(row => {
      if (!row['敏捷组名称']) {
        console.warn('跳过没有敏捷组名称的行:', row)
        return
      }
      
      let agileLevel = row['敏捷组评估等级'] || '未知'
      agileLevel = agileLevel.trim()
      
      const teamMetrics: TeamMetrics = {
        teamName: row['敏捷组名称'],
        month: month,
        agileLevel: agileLevel,
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

  // 更新选项列表
  function updateLists(data: TeamMetrics[]) {
    teamList.value = [...new Set(data.map(item => item.teamName))]
    monthList.value = [...new Set(data.map(item => item.month))]
    
    const metrics = new Set<string>()
    data.forEach(item => {
      Object.keys(item.metrics).forEach(metric => metrics.add(metric))
    })
    metricList.value = Array.from(metrics)
  }

  return {
    files,
    teamList,
    monthList,
    metricList,
    selectedTeams,
    selectedLevelChanges,
    metricsData,
    handleFiles,
    updateLists
  }
} 