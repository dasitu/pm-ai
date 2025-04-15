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
      </v-card-text>

      <!-- 统计结果展示区域 -->
      <v-card-text v-if="statsData.length > 0">
        <v-row>
          <v-col cols="12" md="6">
            <v-card elevation="2" class="pa-4">
              <h3 class="text-h6 mb-4">本次集中清理统计</h3>
              <v-list>
                <v-list-item>
                  <v-list-item-title>
                    新增需求岛P1需求入池数量：{{ newP1Count }}
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    处理需求岛P1需求数量（拒绝或降级）：{{ processedP1Count }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 详细数据表格 -->
      <v-card-text v-if="statsData.length > 0">
        <v-data-table
          :headers="tableHeaders"
          :items="statsData"
          density="compact"
          class="mt-4"
        >
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as XLSX from 'xlsx'

const files = ref<File[]>([])
const statsData = ref<any[]>([])
const errorMessage = ref('')
const showError = ref(false)

// 使用计算属性替代直接修改值
const newP1Count = ref(0)
const processedP1Count = ref(0)

const tableHeaders = [
  { title: '变更类型', key: 'changeType', align: 'start' as const },
  { title: '需求收集标题', key: '需求收集标题' },
  { title: '原业务优先级', key: '原业务优先级' },
  { title: '新业务优先级', key: '新业务优先级' },
  { title: '产品优先级', key: '产品优先级' },
  { title: '投递产品线路径', key: '投递产品线路径' },
  { title: '入池产品线路径', key: '入池产品线路径' },
  { title: '提报人', key: '提报人' },
  { title: '提报部门', key: '提报部门' },
  { title: '提报时间', key: '提报时间' },
  { title: '流程节点', key: '流程节点' },
  { title: '当前处理人', key: '当前处理人' },
  { title: '已入池收集周期（天）', key: '已入池收集周期（天）' },
  { title: '未入池停留时长（天）', key: '未入池停留时长（天）' }
]

const compareAndProcessData = (data: any[]) => {
  if (data.length !== 2) {
    console.error('需要上传两个月份的数据文件进行对比')
    return
  }

  const [previousMonth, currentMonth] = data
  const testRequirements = ['纯测试P1新增', '使用切角小程序，板件A通过@来获取板件B的尺寸']

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

  // 打印测试需求的原始数据
  previousMonth.forEach((req: Requirement) => {
    if (testRequirements.includes(req['需求收集标题'])) {
      console.log('上月数据中的测试需求:', {
        标题: req['需求收集标题'],
        优先级: req['业务优先级'],
        产品优先级: req['产品优先级']
      })
    }
  })

  currentMonth.forEach((req: Requirement) => {
    if (testRequirements.includes(req['需求收集标题'])) {
      console.log('本月数据中的测试需求:', {
        标题: req['需求收集标题'],
        优先级: req['业务优先级'],
        产品优先级: req['产品优先级']
      })
    }
  })

  // 1. 统计新增的P1需求
  const newP1Requirements = currentMonth.filter((req: Requirement) => {
    const isP1 = req['业务优先级'] === 'P1'
    const isNewEntry = !previousMonth.some((prevReq: Requirement) => 
      prevReq['需求收集标题'] === req['需求收集标题']
    )
    
    if (testRequirements.includes(req['需求收集标题'])) {
      console.log(`检查新增P1 - ${req['需求收集标题']}:`, {
        是否P1: isP1,
        是否新增: isNewEntry
      })
    }
    return isP1 && isNewEntry
  }).map((req: Requirement) => ({
    ...req,
    '原业务优先级': '',
    '新业务优先级': 'P1',
    changeType: '新增P1需求'
  }))

  // 2. 统计升级到P1的需求
  const upgradedToP1Requirements = previousMonth.filter((prevReq: Requirement) => {
    if (prevReq['业务优先级'] === 'P1') return false

    const currentReq = currentMonth.find((curr: Requirement) => 
      curr['需求收集标题'] === prevReq['需求收集标题']
    )

    const isUpgraded = currentReq && currentReq['业务优先级'] === 'P1'
    
    if (testRequirements.includes(prevReq['需求收集标题']) && currentReq) {
      console.log(`检查优先级升级 - ${prevReq['需求收集标题']}:`, {
        原优先级: prevReq['业务优先级'],
        现优先级: currentReq['业务优先级'],
        是否升级到P1: isUpgraded
      })
    }
    
    return isUpgraded
  }).map((prevReq: Requirement) => {
    return {
      ...prevReq,
      '原业务优先级': prevReq['业务优先级'],
      '新业务优先级': 'P1',
      changeType: '升级到P1'
    }
  })

  // 3. 统计从P1降级的需求
  const downgradedFromP1Requirements = previousMonth.filter((prevReq: Requirement) => {
    if (prevReq['业务优先级'] !== 'P1') return false

    const currentReq = currentMonth.find((curr: Requirement) => 
      curr['需求收集标题'] === prevReq['需求收集标题']
    )

    const isDowngraded = currentReq && currentReq['业务优先级'] !== 'P1'
    
    if (testRequirements.includes(prevReq['需求收集标题']) && currentReq) {
      console.log(`检查优先级降级 - ${prevReq['需求收集标题']}:`, {
        原优先级: prevReq['业务优先级'],
        现优先级: currentReq ? currentReq['业务优先级'] : '未找到',
        是否从P1降级: isDowngraded
      })
    }
    
    return isDowngraded
  }).map((prevReq: Requirement) => {
    const currentReq = currentMonth.find((curr: Requirement) => 
      curr['需求收集标题'] === prevReq['需求收集标题']
    )
    return {
      ...prevReq,
      '原业务优先级': 'P1',
      '新业务优先级': currentReq ? currentReq['业务优先级'] : '作废',
      changeType: '从P1降级'
    }
  })

  // 4. 统计删除的P1需求（在本月找不到的上月P1需求）
  const deletedP1Requirements = previousMonth.filter((prevReq: Requirement) => {
    if (prevReq['业务优先级'] !== 'P1') return false

    const isDeleted = !currentMonth.some((curr: Requirement) => 
      curr['需求收集标题'] === prevReq['需求收集标题']
    )
    
    if (testRequirements.includes(prevReq['需求收集标题'])) {
      console.log(`检查需求删除 - ${prevReq['需求收集标题']}:`, {
        原优先级: prevReq['业务优先级'],
        是否删除: isDeleted
      })
    }
    
    return isDeleted
  }).map((prevReq: Requirement) => ({
    ...prevReq,
    '原业务优先级': 'P1',
    '新业务优先级': '作废',
    changeType: '删除P1需求'
  }))

  // 更新统计数据
  newP1Count.value = newP1Requirements.length
  // 处理的P1需求包括：升级、降级和删除的需求
  processedP1Count.value = upgradedToP1Requirements.length + 
                          downgradedFromP1Requirements.length + 
                          deletedP1Requirements.length

  // 准备表格数据
  statsData.value = [
    ...newP1Requirements,
    ...upgradedToP1Requirements,
    ...downgradedFromP1Requirements,
    ...deletedP1Requirements
  ]

  // 只打印测试需求的最终结果
  statsData.value.forEach(req => {
    if (testRequirements.includes(req['需求收集标题'])) {
      console.log('最终结果中的测试需求:', {
        标题: req['需求收集标题'],
        类型: req['changeType'],
        优先级: req['业务优先级']
      })
    }
  })
}

const handleFileUpload = async (files: File | File[] | null) => {
  let uploadFiles: File[] = []
  
  if (Array.isArray(files)) {
    uploadFiles = files
  } else if (files instanceof File) {
    uploadFiles = [files]
  }
  
  if (!uploadFiles || uploadFiles.length === 0) {
    statsData.value = []
    return
  }

  if (uploadFiles.length !== 2) {
    errorMessage.value = '请上传两个月份的数据文件进行对比'
    showError.value = true
    return
  }

  try {
    const processedData = []
    for (const file of uploadFiles) {
      const data = await readExcelFile(file)
      processedData.push(data)
    }
    
    showError.value = false
    compareAndProcessData(processedData)
  } catch (error) {
    console.error('处理文件时发生错误:', error)
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // 验证必需字段是否存在
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

        const optionalFields = [
          '当前处理人',
          '未入池停留时长（天）'
        ]

        const firstRow = jsonData[0] || {}
        const missingRequiredFields = requiredFields.filter(field => !Object.prototype.hasOwnProperty.call(firstRow, field))
        
        if (missingRequiredFields.length > 0) {
          console.error('缺少必需字段:', missingRequiredFields)
          throw new Error(`文件缺少必需字段: ${missingRequiredFields.join(', ')}`)
        }

        // 检查可选字段是否存在，如果不存在则添加空值
        optionalFields.forEach(field => {
          if (!Object.prototype.hasOwnProperty.call(firstRow, field)) {
            jsonData.forEach((row: unknown) => {
              if (row && typeof row === 'object') {
                (row as Record<string, any>)[field] = ''
              }
            })
          }
        })

        // 添加更详细的日志输出
        console.log('Excel文件解析结果:', {
          文件名: file.name,
          表头: Object.keys(jsonData[0] || {}),
          前3行数据: jsonData.slice(0, 3),
          可选字段处理: optionalFields.map(field => ({
            字段名: field,
            是否存在: Object.prototype.hasOwnProperty.call(firstRow, field),
            示例值: (firstRow as Record<string, any>)[field]
          }))
        })

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
</script>

<style scoped>
.requirement-island-stats {
  padding: 16px;
}
</style> 