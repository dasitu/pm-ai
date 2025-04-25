<template>
  <div class="requirement-island-stats">
    <v-card>
      <v-card-title class="d-flex align-center">
        需求岛治理数据统计
        <v-spacer></v-spacer>
      </v-card-title>
      
      <!-- 文件上传区域 -->
      <v-card-text>
        <v-file-input
          v-model="files"
          multiple
          accept=".xlsx"
          label="上传月度数据文件（支持上传两个月份进行对比）"
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

        <!-- 处理步骤提示 -->
        <v-alert
          v-if="currentStep"
          type="info"
          class="mt-4"
          variant="tonal"
        >
          {{ currentStep }}
        </v-alert>
      </v-card-text>

      <!-- 统计结果展示区域 -->
      <v-card-text v-if="p1PooledRequirements.length > 0 || p1RejectedRequirements.length > 0 || p1DowngradedRequirements.length > 0">
        <v-row>
          <v-col cols="12">
            <v-expansion-panels>
              <!-- P1需求入池统计 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <span class="text-h6">共计{{ p1PooledCount }}个需求岛P1需求入池</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text v-if="p1PooledRequirements.length > 0">
                  <v-data-table
                    :headers="tableHeaders"
                    :items="p1PooledRequirements"
                    density="compact"
                  >
                    <template v-slot:item.原流程节点="{ item }">
                      <v-chip
                        :color="getStatusColor(item.原流程节点)"
                        size="small"
                        class="status-chip"
                      >
                        {{ item.原流程节点 }}
                      </v-chip>
                    </template>
                    <template v-slot:item.新流程节点="{ item }">
                      <v-chip
                        :color="getStatusColor(item.新流程节点)"
                        size="small"
                        class="status-chip"
                      >
                        {{ item.新流程节点 }}
                      </v-chip>
                    </template>
                  </v-data-table>
                </v-expansion-panel-text>
                <v-expansion-panel-text v-else>
                  <div class="text-center pa-4">暂无数据</div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- P1需求拒绝统计 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <span class="text-h6">共计拒绝{{ p1RejectedCount }}个需求岛P1需求</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text v-if="p1RejectedRequirements.length > 0">
                  <v-data-table
                    :headers="rejectedTableHeaders"
                    :items="p1RejectedRequirements"
                    density="compact"
                  >
                    <template v-slot:item.原流程节点="{ item }">
                      <v-chip
                        :color="getStatusColor(item.原流程节点)"
                        size="small"
                        class="status-chip"
                      >
                        {{ item.原流程节点 }}
                      </v-chip>
                    </template>
                  </v-data-table>
                </v-expansion-panel-text>
                <v-expansion-panel-text v-else>
                  <div class="text-center pa-4">暂无数据</div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- P1需求降级统计 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <span class="text-h6">共计降级{{ p1DowngradedCount }}个需求岛P1需求</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text v-if="p1DowngradedRequirements.length > 0">
                  <v-data-table
                    :headers="downgradedTableHeaders"
                    :items="p1DowngradedRequirements"
                    density="compact"
                  >
                    <template v-slot:item.原业务优先级="{ item }">
                      <v-chip
                        color="primary"
                        size="small"
                        class="status-chip"
                      >
                        {{ item.原业务优先级 }}
                      </v-chip>
                    </template>
                    <template v-slot:item.新业务优先级="{ item }">
                      <v-chip
                        color="warning"
                        size="small"
                        class="status-chip"
                      >
                        {{ item.新业务优先级 }}
                      </v-chip>
                    </template>
                  </v-data-table>
                </v-expansion-panel-text>
                <v-expansion-panel-text v-else>
                  <div class="text-center pa-4">暂无数据</div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'

interface Requirement {
  需求收集标题: string;
  业务优先级: string;
  产品优先级: string;
  投递产品线路径: string;
  入池产品线路径: string;
  提报人: string;
  提报部门: string;
  提报时间: string;
  流程节点: string;
  当前处理人: string;
  已入池收集周期: number;
  未入池停留时长: number;
  [key: string]: any;
}

const files = ref<File[]>([])
const statsData = ref<any[]>([])
const errorMessage = ref('')
const showError = ref(false)

// 月份名称
const previousMonthName = ref('')
const currentMonthName = ref('')

// 当前步骤
const currentStep = ref('')

// 统计数量
const p1PooledCount = ref(0)
const p1RejectedCount = ref(0)
const p1DowngradedCount = ref(0)

// 详细数据
const p1PooledRequirements = ref<any[]>([])
const p1RejectedRequirements = ref<any[]>([])
const p1DowngradedRequirements = ref<any[]>([])

const tableHeaders = [
  { title: '变更类型', key: 'changeType', align: 'start' as const },
  { title: '需求收集标题', key: '需求收集标题' },
  { title: '业务优先级', key: '业务优先级' },
  { title: '产品优先级', key: '产品优先级' },
  { title: '投递产品线路径', key: '投递产品线路径' },
  { title: '入池产品线路径', key: '入池产品线路径' },
  { title: '提报人', key: '提报人' },
  { title: '提报部门', key: '提报部门' },
  { title: '提报时间', key: '提报时间' },
  { 
    title: '流程节点',
    key: '流程节点',
    children: [
      { title: '', key: '原流程节点' },
      { title: '', key: '新流程节点' }
    ]
  },
  { title: '当前处理人', key: '当前处理人' },
  { title: '已入池收集周期（天）', key: '已入池收集周期（天）' },
  { title: '未入池停留时长（天）', key: '未入池停留时长（天）' }
]

const rejectedTableHeaders = [
  { title: '变更类型', key: 'changeType', align: 'start' as const },
  { title: '需求收集标题', key: '需求收集标题' },
  { title: '业务优先级', key: '业务优先级' },
  { title: '产品优先级', key: '产品优先级' },
  { title: '投递产品线路径', key: '投递产品线路径' },
  { title: '入池产品线路径', key: '入池产品线路径' },
  { title: '提报人', key: '提报人' },
  { title: '提报部门', key: '提报部门' },
  { title: '提报时间', key: '提报时间' },
  { title: '原流程节点', key: '原流程节点' },
  { title: '当前处理人', key: '当前处理人' }
]

const downgradedTableHeaders = computed(() => [
  { title: '需求收集标题', key: '需求收集标题' },
  { title: '产品优先级', key: '产品优先级' },
  { title: '投递产品线路径', key: '投递产品线路径' },
  { title: '入池产品线路径', key: '入池产品线路径' },
  { title: '提报人', key: '提报人' },
  { title: '提报部门', key: '提报部门' },
  { title: '提报时间', key: '提报时间' },
  { 
    title: '业务优先级变化',
    key: '业务优先级',
    children: [
      { title: previousMonthName.value, key: '原业务优先级' },
      { title: currentMonthName.value, key: '新业务优先级' }
    ]
  }
])

const compareAndProcessData = (data: any[]) => {
  if (data.length !== 2) {
    currentStep.value = '需要上传两个月份的数据文件进行对比'
    return
  }

  // 从文件名解析月份信息
  const monthsInfo = files.value.map((file, index) => {
    const match = file.name.match(/(\d{4})(\d{2})/)
    if (!match) {
      return { index, year: 0, month: 0, data: data[index] }
    }
    return {
      index,
      year: parseInt(match[1]),
      month: parseInt(match[2]),
      data: data[index]
    }
  })

  // 按时间排序，确保较早的月份在前
  monthsInfo.sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year
    }
    return a.month - b.month
  })

  // 获取排序后的数据
  const [previousMonth, currentMonth] = monthsInfo.map(info => info.data)
  const prevMonthName = `${monthsInfo[0].year}年${String(monthsInfo[0].month).padStart(2, '0')}月`
  const currMonthName = `${monthsInfo[1].year}年${String(monthsInfo[1].month).padStart(2, '0')}月`
  
  // 更新月份名称
  previousMonthName.value = prevMonthName
  currentMonthName.value = currMonthName
  
  currentStep.value = `正在对比 ${prevMonthName} 和 ${currMonthName} 的数据...`

  // 1. 统计P1需求入池
  p1PooledRequirements.value = currentMonth.filter((req: Requirement) => {
    const isP1 = req['业务优先级']?.toString().trim() === 'P1'
    const isPooled = req['流程节点']?.toString().trim() === '入需求池'
    
    // 查找上个月的数据
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求收集标题']?.toString().trim() === req['需求收集标题']?.toString().trim() && 
      prevReq['提报时间']?.toString().trim() === req['提报时间']?.toString().trim()
    )
    
    // 检查是否从其他状态变为入池
    const wasNotPooled = previousReq && previousReq['流程节点']?.toString().trim() !== '入需求池'
    
    if (isP1 && isPooled && wasNotPooled) {
      console.log('找到P1需求入池', {
        标题: req['需求收集标题'],
        提报时间: req['提报时间'],
        原状态: previousReq['流程节点'],
        新状态: req['流程节点']
      })
    }
    
    return isP1 && isPooled && wasNotPooled
  }).map((req: Requirement) => {
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求收集标题']?.toString().trim() === req['需求收集标题']?.toString().trim() && 
      prevReq['提报时间']?.toString().trim() === req['提报时间']?.toString().trim()
    )
    return {
      ...req,
      '原流程节点': previousReq ? previousReq['流程节点']?.toString().trim() : '',
      '新流程节点': req['流程节点']?.toString().trim(),
      changeType: 'P1需求入池'
    }
  })
  console.log('P1需求入池统计完成', {
    数量: p1PooledRequirements.value.length,
    详情: p1PooledRequirements.value.map(req => ({
      标题: req['需求收集标题'],
      提报时间: req['提报时间']
    }))
  })

  // 2. 统计P1需求拒绝
  p1RejectedRequirements.value = previousMonth.filter((prevReq: Requirement) => {
    const isP1 = prevReq['业务优先级']?.toString().trim() === 'P1'
    
    // 检查本月是否还存在这个需求
    const existsInCurrentMonth = currentMonth.some((currReq: Requirement) => 
      currReq['需求收集标题']?.toString().trim() === prevReq['需求收集标题']?.toString().trim() && 
      currReq['提报时间']?.toString().trim() === prevReq['提报时间']?.toString().trim()
    )
    
    if (isP1 && !existsInCurrentMonth) {
      console.log('找到P1需求拒绝', {
        标题: prevReq['需求收集标题'],
        提报时间: prevReq['提报时间'],
        原状态: prevReq['流程节点']
      })
    }
    
    return isP1 && !existsInCurrentMonth
  }).map((req: Requirement) => ({
    ...req,
    '原流程节点': req['流程节点']?.toString().trim(),
    '新流程节点': '已拒绝',
    changeType: 'P1需求拒绝'
  }))
  console.log('P1需求拒绝统计完成', {
    数量: p1RejectedRequirements.value.length,
    详情: p1RejectedRequirements.value.map(req => ({
      标题: req['需求收集标题'],
      提报时间: req['提报时间']
    }))
  })

  // 3. 统计P1需求降级
  const p1RequirementsInPreviousMonth = previousMonth.filter((prevReq: Requirement) => 
    prevReq['业务优先级']?.toString().trim() === 'P1'
  )

  p1DowngradedRequirements.value = p1RequirementsInPreviousMonth
    .filter((prevReq: Requirement) => {
      const currentReq = currentMonth.find((currReq: Requirement) => 
        currReq['需求收集标题']?.toString().trim() === prevReq['需求收集标题']?.toString().trim() && 
        currReq['提报时间']?.toString().trim() === prevReq['提报时间']?.toString().trim()
      )
      
      if (!currentReq) {
        return false
      }
      
      const currentPriority = currentReq['业务优先级']?.toString().trim()
      const isDowngraded = currentPriority === 'P2' || currentPriority === 'P3'
      
      return isDowngraded
    })
    .map((prevReq: Requirement) => {
      const currentReq = currentMonth.find((currReq: Requirement) => 
        currReq['需求收集标题']?.toString().trim() === prevReq['需求收集标题']?.toString().trim() && 
        currReq['提报时间']?.toString().trim() === prevReq['提报时间']?.toString().trim()
      )
      return {
        ...prevReq,
        '原业务优先级': 'P1',
        '新业务优先级': currentReq ? currentReq['业务优先级']?.toString().trim() : ''
      }
    })

  // 更新统计数据
  p1PooledCount.value = p1PooledRequirements.value.length
  p1RejectedCount.value = p1RejectedRequirements.value.length
  p1DowngradedCount.value = p1DowngradedRequirements.value.length

  console.log('最终统计结果', {
    入池数量: p1PooledCount.value,
    拒绝数量: p1RejectedCount.value,
    降级数量: p1DowngradedCount.value
  })

  currentStep.value = '统计完成'
}

const handleFileUpload = async (files: File | File[] | null) => {
  currentStep.value = '开始处理文件上传...'
  let uploadFiles: File[] = []
  
  if (Array.isArray(files)) {
    uploadFiles = files
  } else if (files instanceof File) {
    uploadFiles = [files]
  }
  
  if (!uploadFiles || uploadFiles.length === 0) {
    currentStep.value = '没有上传文件'
    statsData.value = []
    return
  }

  if (uploadFiles.length !== 2) {
    currentStep.value = '请上传两个月份的数据文件进行对比'
    errorMessage.value = '请上传两个月份的数据文件进行对比'
    showError.value = true
    return
  }

  // 检查文件名格式
  const isValidFileName = uploadFiles.every(file => {
    const match = file.name.match(/(\d{4})(\d{2})/)
    if (!match) {
      errorMessage.value = `文件名格式错误：${file.name}，请使用YYYYMM格式（例如：202403）`
      showError.value = true
      return false
    }
    return true
  })

  if (!isValidFileName) {
    return
  }

  try {
    const processedData: any[] = []
    for (const file of uploadFiles) {
      currentStep.value = `正在处理文件: ${file.name}...`
      const data = await readExcelFile(file) as any[]
      processedData.push(data)
    }
    
    showError.value = false
    compareAndProcessData(processedData)
  } catch (error) {
    currentStep.value = '处理文件时发生错误'
    errorMessage.value = '处理文件时发生错误，请确保文件格式正确'
    showError.value = true
  }
}

const readExcelFile = (file: File) => {
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
        
        // 正确获取表头信息
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
        const headers = []
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col }) // 第一行是表头
          const cell = worksheet[cellAddress]
          if (cell && cell.v) {
            headers.push(String(cell.v).trim())
          }
        }

        // 从第二行开始获取数据
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: headers, range: 1 })

        // 验证必需字段是否存在于表头中
        const requiredFields = [
          '需求收集标题',
          '业务优先级',
          '产品优先级',
          '投递产品线路径',
          '入池产品线路径',
          '提报人',
          '提报部门',
          '提报时间',
          '流程节点',
          '已入池收集周期（天）'
        ]

        // 规范化处理函数
        const normalizeField = (field: string) => {
          return field.trim().replace(/\u200B/g, '').replace(/\uFEFF/g, '')
        }

        // 规范化处理后的表头
        const normalizedHeaders = headers.map(normalizeField)

        // 只检查表头是否包含必需字段（使用规范化后的比较）
        const missingRequiredFields = requiredFields.filter(field => {
          const normalizedField = normalizeField(field)
          return !normalizedHeaders.some(header => header === normalizedField)
        })
        
        // 添加详细的调试日志
        console.log(`===== 开始检查文件: ${file.name} =====`)
        console.log(`文件 ${file.name} 的原始表头:`, headers)
        console.log(`文件 ${file.name} 的规范化表头:`, normalizedHeaders)
        console.log('所有必需字段:', requiredFields)
        
        // 检查每个必需字段在表头中是否存在
        console.log(`文件 ${file.name} 的字段检查结果:`)
        requiredFields.forEach(field => {
          const normalizedField = normalizeField(field)
          const found = normalizedHeaders.some(header => header === normalizedField)
          console.log(`检查字段 "${field}":`, {
            文件名: file.name,
            存在: found,
            原始字段: field,
            规范化后: normalizedField
          })
        })
        
        // 检查表头中是否存在相似但不完全匹配的字段
        console.log(`文件 ${file.name} 的相似字段匹配:`)
        requiredFields.forEach(required => {
          const normalizedRequired = normalizeField(required)
          const similarFields = normalizedHeaders.filter(header => 
            header !== normalizedRequired && 
            (header.includes(normalizedRequired) || normalizedRequired.includes(header))
          )
          if (similarFields.length > 0) {
            console.log(`必需字段 "${required}" 的相似字段:`, similarFields)
          }
        })
        
        if (missingRequiredFields.length > 0) {
          console.error(`文件 ${file.name} 缺少必需字段:`, missingRequiredFields)
          throw new Error(`文件 ${file.name} 缺少必需字段: ${missingRequiredFields.join(', ')}`)
        }

        // 检查可选字段是否存在，如果不存在则添加空值
        const optionalFields = [
          '当前处理人',
          '未入池停留时长（天）'
        ]
        
        optionalFields.forEach(field => {
          const normalizedField = normalizeField(field)
          if (!normalizedHeaders.includes(normalizedField)) {
            jsonData.forEach((row: unknown) => {
              if (row && typeof row === 'object') {
                (row as Record<string, any>)[field] = ''
              }
            })
          }
        })

        // 添加更详细的日志输出
        console.log('Excel文件解析结果', {
          文件名: file.name,
          表头: headers,
          规范化表头: normalizedHeaders,
          数据行数: jsonData.length,
          前3行数据: jsonData.slice(0, 3),
          可选字段处理: optionalFields.map(field => ({
            字段名: field,
            是否存在: normalizedHeaders.includes(normalizeField(field))
          }))
        })
        console.log(`===== 文件 ${file.name} 检查完成 =====\n`)

        resolve(jsonData)
      } catch (error) {
        console.error('Excel解析错误:', error)
        reject(error)
      }
    }
    reader.onerror = (error) => {
      console.error('文件读取错误:', error)
      reject(error)
    }
    reader.readAsArrayBuffer(file)
  })
}

// 添加状态颜色映射函数
const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    '入需求池': 'success',
    '已拒绝': 'error',
    '产品审核': 'warning',
    '提交反馈': 'info',
    '待处理': 'grey',
    '处理中': 'primary',
    '已完成': 'success',
    '已作废': 'error'
  }
  return statusColors[status] || 'grey'
}
</script>

<style scoped>
.requirement-island-stats {
  padding: 16px;
}

.status-chip {
  min-width: 100px;
  justify-content: center;
}
</style> 