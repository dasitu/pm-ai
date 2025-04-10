<template>
  <div class="product-pool-stats">
    <v-card>
      <v-card-title class="d-flex align-center">
        产品需求池治理数据统计
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
                    派发进敏捷组的P0需求数量：{{ dispatchedP0Count }}
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    派发进敏捷组的P1需求数量：{{ dispatchedP1Count }}
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    处理的P0需求数量（作废或降级）：{{ processedP0Count }}
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    处理的P1需求数量（作废或降级）：{{ processedP1Count }}
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

// 统计数量
const dispatchedP0Count = ref(0)
const dispatchedP1Count = ref(0)
const processedP0Count = ref(0)
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

const compareAndProcessData = (data: any[]) => {
  if (data.length !== 2) {
    console.error('需要上传两个月份的数据文件进行对比')
    return
  }

  const [previousMonth, currentMonth] = data

  // 1. 统计派发到敏捷组的P0需求
  const dispatchedP0Requirements = currentMonth.filter((req: Requirement) => {
    const isP0 = req['业务优先级'] === 'P0'
    const isNewDispatch = !previousMonth.some((prevReq: Requirement) => 
      prevReq['需求收集标题'] === req['需求收集标题']
    )
    return isP0 && isNewDispatch
  }).map((req: Requirement) => ({
    ...req,
    '原业务优先级': '',
    '新业务优先级': 'P0',
    changeType: '新派发P0需求'
  }))

  // 2. 统计派发到敏捷组的P1需求
  const dispatchedP1Requirements = currentMonth.filter((req: Requirement) => {
    const isP1 = req['业务优先级'] === 'P1'
    const isNewDispatch = !previousMonth.some((prevReq: Requirement) => 
      prevReq['需求收集标题'] === req['需求收集标题']
    )
    return isP1 && isNewDispatch
  }).map((req: Requirement) => ({
    ...req,
    '原业务优先级': '',
    '新业务优先级': 'P1',
    changeType: '新派发P1需求'
  }))

  // 3. 统计处理的P0需求（作废或降级）
  const processedP0Requirements = previousMonth.filter((prevReq: Requirement) => {
    if (prevReq['业务优先级'] !== 'P0') return false

    const currentReq = currentMonth.find((curr: Requirement) => 
      curr['需求收集标题'] === prevReq['需求收集标题']
    )

    return !currentReq || // 作废（在本月找不到）
           (currentReq && currentReq['业务优先级'] !== 'P0') // 降级
  }).map((prevReq: Requirement) => {
    const currentReq = currentMonth.find((curr: Requirement) => 
      curr['需求收集标题'] === prevReq['需求收集标题']
    )
    return {
      ...prevReq,
      '原业务优先级': 'P0',
      '新业务优先级': currentReq ? currentReq['业务优先级'] : '作废',
      changeType: currentReq ? 'P0需求降级' : 'P0需求作废'
    }
  })

  // 4. 统计处理的P1需求（作废或降级）
  const processedP1Requirements = previousMonth.filter((prevReq: Requirement) => {
    if (prevReq['业务优先级'] !== 'P1') return false

    const currentReq = currentMonth.find((curr: Requirement) => 
      curr['需求收集标题'] === prevReq['需求收集标题']
    )

    return !currentReq || // 作废（在本月找不到）
           (currentReq && currentReq['业务优先级'] !== 'P1') // 降级
  }).map((prevReq: Requirement) => {
    const currentReq = currentMonth.find((curr: Requirement) => 
      curr['需求收集标题'] === prevReq['需求收集标题']
    )
    return {
      ...prevReq,
      '原业务优先级': 'P1',
      '新业务优先级': currentReq ? currentReq['业务优先级'] : '作废',
      changeType: currentReq ? 'P1需求降级' : 'P1需求作废'
    }
  })

  // 更新统计数据
  dispatchedP0Count.value = dispatchedP0Requirements.length
  dispatchedP1Count.value = dispatchedP1Requirements.length
  processedP0Count.value = processedP0Requirements.length
  processedP1Count.value = processedP1Requirements.length

  // 准备表格数据
  statsData.value = [
    ...dispatchedP0Requirements,
    ...dispatchedP1Requirements,
    ...processedP0Requirements,
    ...processedP1Requirements
  ]
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
.product-pool-stats {
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

.v-list-item {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.v-list-item:last-child {
  border-bottom: none;
}

.v-list {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  overflow: hidden;
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
</style> 