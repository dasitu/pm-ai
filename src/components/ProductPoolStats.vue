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

        <!-- 进度条 -->
        <v-progress-linear
          v-if="isProcessing"
          indeterminate
          color="primary"
          class="mt-4"
        ></v-progress-linear>

        <!-- 任务提示消息 -->
        <v-alert
          v-if="currentTask"
          type="info"
          class="mt-4"
          closable
          @click:close="currentTask = ''"
        >
          {{ currentTask }}
        </v-alert>
      </v-card-text>

      <!-- 统计结果展示区域 -->
      <v-card-text v-if="dispatchedP0Requirements.length > 0 || 
                        dispatchedP1Requirements.length > 0 || 
                        cancelledP0Requirements.length > 0 || 
                        downgradedP0Requirements.length > 0 || 
                        cancelledP1Requirements.length > 0 || 
                        downgradedP1Requirements.length > 0">
        <v-row>
          <v-col cols="12">
            <v-expansion-panels>
              <!-- P0需求派发进敏捷组 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <span class="text-h6">派发进敏捷组的P0需求数量：{{ dispatchedP0Count }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text v-if="dispatchedP0Requirements.length > 0">
                  <v-data-table
                    :headers="dispatchedTableHeaders"
                    :items="dispatchedP0Requirements"
                    density="compact"
                  ></v-data-table>
                </v-expansion-panel-text>
                <v-expansion-panel-text v-else>
                  <div class="text-center pa-4">暂无数据</div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- P1需求派发进敏捷组 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <span class="text-h6">派发进敏捷组的P1需求数量：{{ dispatchedP1Count }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text v-if="dispatchedP1Requirements.length > 0">
                  <v-data-table
                    :headers="dispatchedTableHeaders"
                    :items="dispatchedP1Requirements"
                    density="compact"
                  ></v-data-table>
                </v-expansion-panel-text>
                <v-expansion-panel-text v-else>
                  <div class="text-center pa-4">暂无数据</div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- P0需求作废 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <span class="text-h6">P0需求作废数量：{{ cancelledP0Count }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text v-if="cancelledP0Requirements.length > 0">
                  <v-data-table
                    :headers="cancelledTableHeaders"
                    :items="cancelledP0Requirements"
                    density="compact"
                  ></v-data-table>
                </v-expansion-panel-text>
                <v-expansion-panel-text v-else>
                  <div class="text-center pa-4">暂无数据</div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- P0需求降级 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <span class="text-h6">P0需求降级数量：{{ downgradedP0Count }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text v-if="downgradedP0Requirements.length > 0">
                  <v-data-table
                    :headers="downgradedTableHeaders"
                    :items="downgradedP0Requirements"
                    density="compact"
                  ></v-data-table>
                </v-expansion-panel-text>
                <v-expansion-panel-text v-else>
                  <div class="text-center pa-4">暂无数据</div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- P1需求作废 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <span class="text-h6">P1需求作废数量：{{ cancelledP1Count }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text v-if="cancelledP1Requirements.length > 0">
                  <v-data-table
                    :headers="cancelledTableHeaders"
                    :items="cancelledP1Requirements"
                    density="compact"
                  ></v-data-table>
                </v-expansion-panel-text>
                <v-expansion-panel-text v-else>
                  <div class="text-center pa-4">暂无数据</div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- P1需求降级 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <div class="d-flex align-center">
                    <span class="text-h6">P1需求降级数量：{{ downgradedP1Count }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text v-if="downgradedP1Requirements.length > 0">
                  <v-data-table
                    :headers="downgradedTableHeaders"
                    :items="downgradedP1Requirements"
                    density="compact"
                  ></v-data-table>
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
import { ref } from 'vue'
import * as XLSX from 'xlsx'

const files = ref<File[]>([])
const statsData = ref<any[]>([])
const errorMessage = ref('')
const showError = ref(false)
const isProcessing = ref(false)
const currentTask = ref('')

// 统计数量
const dispatchedP0Count = ref(0)
const dispatchedP1Count = ref(0)
const cancelledP0Count = ref(0)
const downgradedP0Count = ref(0)
const cancelledP1Count = ref(0)
const downgradedP1Count = ref(0)

// 详细数据
const dispatchedP0Requirements = ref<any[]>([])
const dispatchedP1Requirements = ref<any[]>([])
const cancelledP0Requirements = ref<any[]>([])
const downgradedP0Requirements = ref<any[]>([])
const cancelledP1Requirements = ref<any[]>([])
const downgradedP1Requirements = ref<any[]>([])

// 派发前的状态
const preDispatchStatus = ['派发前', '分析中', '待调研', '待规划', '待排期']
// 派发后的状态
const postDispatchStatus = ['待开发', '开发中', '待验证', '验证不通过', '已完成']
// 作废状态
const cancelledStatus = ['已作废']

// 更新表头
const dispatchedTableHeaders = ref([
  { title: '变更类型', key: 'changeType', align: 'start' as const },
  { title: '需求标题', key: '需求标题' },
  { title: '需求来源', key: '需求来源' },
  { 
    title: '需求状态',
    key: '需求状态',
    children: [
      { title: '', key: '原需求状态' },
      { title: '', key: '新需求状态' }
    ]
  },
  { title: '产品优先级', key: '产品优先级' },
  { title: '需求负责人', key: '需求负责人' },
  { title: '入池产品线', key: '入池产品线' },
  { title: '入池时间', key: '入池时间' },
  { title: '关联敏捷组时间', key: '关联敏捷组时间' },
  { title: '需求池停留天数', key: '需求池停留天数' },
  { title: '未派发需求停留时长（天）', key: '未派发需求停留时长（天）' },
  { title: '已派发需求产品设计周期（天）', key: '已派发需求产品设计周期（天）' }
])

const cancelledTableHeaders = ref([
  { title: '变更类型', key: 'changeType', align: 'start' as const },
  { title: '需求标题', key: '需求标题' },
  { title: '需求来源', key: '需求来源' },
  { 
    title: '需求状态',
    key: '需求状态',
    children: [
      { title: '', key: '原需求状态' },
      { title: '', key: '新需求状态' }
    ]
  },
  { title: '产品优先级', key: '产品优先级' },
  { title: '需求负责人', key: '需求负责人' },
  { title: '入池产品线', key: '入池产品线' },
  { title: '入池时间', key: '入池时间' },
  { title: '关联敏捷组时间', key: '关联敏捷组时间' },
  { title: '需求池停留天数', key: '需求池停留天数' },
  { title: '未派发需求停留时长（天）', key: '未派发需求停留时长（天）' },
  { title: '已派发需求产品设计周期（天）', key: '已派发需求产品设计周期（天）' }
])

const downgradedTableHeaders = ref([
  { title: '变更类型', key: 'changeType', align: 'start' as const },
  { title: '需求标题', key: '需求标题' },
  { title: '需求来源', key: '需求来源' },
  { title: '需求状态', key: '需求状态' },
  { 
    title: '产品优先级',
    key: '产品优先级',
    children: [
      { title: '', key: '原产品优先级' },
      { title: '', key: '新产品优先级' }
    ]
  },
  { title: '需求负责人', key: '需求负责人' },
  { title: '入池产品线', key: '入池产品线' },
  { title: '入池时间', key: '入池时间' },
  { title: '关联敏捷组时间', key: '关联敏捷组时间' },
  { title: '需求池停留天数', key: '需求池停留天数' },
  { title: '未派发需求停留时长（天）', key: '未派发需求停留时长（天）' },
  { title: '已派发需求产品设计周期（天）', key: '已派发需求产品设计周期（天）' }
])

interface Requirement {
  需求标题: string;
  需求来源: string;
  需求状态: string;
  业务优先级: string;
  产品优先级: string;
  需求负责人: string;
  入池产品线: string;
  入池时间: string;
  关联敏捷组时间: string;
  需求池停留天数: number;
  未派发需求停留时长: number;
  已派发需求产品设计周期: number;
  [key: string]: any;
}

const compareAndProcessData = (data: any[]) => {
  currentTask.value = '开始比较数据...'
  console.log('开始比较数据...')
  if (data.length !== 2) {
    currentTask.value = '需要上传两个月份的数据文件进行对比'
    console.error('需要上传两个月份的数据文件进行对比')
    return
  }

  const [previousMonth, currentMonth] = data
  currentTask.value = `上月数据条数: ${previousMonth.length}, 本月数据条数: ${currentMonth.length}`
  console.log(`上月数据条数: ${previousMonth.length}`)
  console.log(`本月数据条数: ${currentMonth.length}`)

  const [previousMonthName, currentMonthName] = files.value.map(file => {
    const match = file.name.match(/(\d{4})(\d{2})/)
    return match ? `${match[1]}年${match[2]}月` : '未知月份'
  })
  currentTask.value = `对比月份: ${previousMonthName} vs ${currentMonthName}`
  console.log(`对比月份: ${previousMonthName} vs ${currentMonthName}`)

  // 更新表头
  if (dispatchedTableHeaders.value[3].children) {
    dispatchedTableHeaders.value[3].children[0].title = previousMonthName
    dispatchedTableHeaders.value[3].children[1].title = currentMonthName
  }

  if (cancelledTableHeaders.value[3].children) {
    cancelledTableHeaders.value[3].children[0].title = previousMonthName
    cancelledTableHeaders.value[3].children[1].title = currentMonthName
  }

  if (downgradedTableHeaders.value[4].children) {
    downgradedTableHeaders.value[4].children[0].title = previousMonthName
    downgradedTableHeaders.value[4].children[1].title = currentMonthName
  }

  // 1. 统计P0需求派发进敏捷组
  currentTask.value = '开始统计P0需求派发进敏捷组...'
  console.log('开始统计P0需求派发进敏捷组...')
  dispatchedP0Requirements.value = currentMonth.filter((req: Requirement) => {
    const isP0 = req['产品优先级'] === 'P0'
    const isDispatched = postDispatchStatus.includes(req['需求状态'])
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    const wasPreDispatch = previousReq && preDispatchStatus.includes(previousReq['需求状态'])
    return isP0 && isDispatched && wasPreDispatch
  }).map((req: Requirement) => {
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    return {
      ...req,
      '原需求状态': previousReq ? previousReq['需求状态'] : '',
      '新需求状态': req['需求状态'],
      '产品优先级': 'P0',
      changeType: 'P0需求派发进敏捷组'
    }
  })
  currentTask.value = `P0需求派发进敏捷组数量: ${dispatchedP0Requirements.value.length}`
  console.log(`P0需求派发进敏捷组数量: ${dispatchedP0Requirements.value.length}`)

  // 2. 统计P1需求派发进敏捷组
  currentTask.value = '开始统计P1需求派发进敏捷组...'
  console.log('开始统计P1需求派发进敏捷组...')
  dispatchedP1Requirements.value = currentMonth.filter((req: Requirement) => {
    const isP1 = req['产品优先级'] === 'P1'
    const isDispatched = postDispatchStatus.includes(req['需求状态'])
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    const wasPreDispatch = previousReq && preDispatchStatus.includes(previousReq['需求状态'])
    return isP1 && isDispatched && wasPreDispatch
  }).map((req: Requirement) => {
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    return {
      ...req,
      '原需求状态': previousReq ? previousReq['需求状态'] : '',
      '新需求状态': req['需求状态'],
      '产品优先级': 'P1',
      changeType: 'P1需求派发进敏捷组'
    }
  })
  currentTask.value = `P1需求派发进敏捷组数量: ${dispatchedP1Requirements.value.length}`
  console.log(`P1需求派发进敏捷组数量: ${dispatchedP1Requirements.value.length}`)

  // 3. 统计P0需求作废
  currentTask.value = '开始统计P0需求作废...'
  console.log('开始统计P0需求作废...')
  cancelledP0Requirements.value = currentMonth.filter((req: Requirement) => {
    const isP0 = req['产品优先级'] === 'P0'
    const isCancelled = cancelledStatus.includes(req['需求状态'])
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    const wasNotCancelled = previousReq && !cancelledStatus.includes(previousReq['需求状态'])
    return isP0 && isCancelled && wasNotCancelled
  }).map((req: Requirement) => {
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    return {
      ...req,
      '原需求状态': previousReq ? previousReq['需求状态'] : '',
      '新需求状态': req['需求状态'],
      '产品优先级': 'P0',
      changeType: 'P0需求作废'
    }
  })
  currentTask.value = `P0需求作废数量: ${cancelledP0Requirements.value.length}`
  console.log(`P0需求作废数量: ${cancelledP0Requirements.value.length}`)

  // 4. 统计P0需求降级
  currentTask.value = '开始统计P0需求降级...'
  console.log('开始统计P0需求降级...')
  downgradedP0Requirements.value = currentMonth.filter((req: Requirement) => {
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    if (!previousReq) return false

    // 检查是否从P0降级到P1或更低
    const wasP0 = previousReq['产品优先级'] === 'P0'
    const isLowerPriority = req['产品优先级'] !== 'P0'
    return wasP0 && isLowerPriority
  }).map((req: Requirement) => {
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    return {
      ...req,
      '需求状态': req['需求状态'],
      '原产品优先级': previousReq ? previousReq['产品优先级'] : '',
      '新产品优先级': req['产品优先级'],
      changeType: 'P0需求降级'
    }
  })
  currentTask.value = `P0需求降级数量: ${downgradedP0Requirements.value.length}`
  console.log(`P0需求降级数量: ${downgradedP0Requirements.value.length}`)

  // 5. 统计P1需求作废
  currentTask.value = '开始统计P1需求作废...'
  console.log('开始统计P1需求作废...')
  cancelledP1Requirements.value = currentMonth.filter((req: Requirement) => {
    const isP1 = req['产品优先级'] === 'P1'
    const isCancelled = cancelledStatus.includes(req['需求状态'])
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    const wasNotCancelled = previousReq && !cancelledStatus.includes(previousReq['需求状态'])
    return isP1 && isCancelled && wasNotCancelled
  }).map((req: Requirement) => {
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    return {
      ...req,
      '原需求状态': previousReq ? previousReq['需求状态'] : '',
      '新需求状态': req['需求状态'],
      '产品优先级': 'P1',
      changeType: 'P1需求作废'
    }
  })
  currentTask.value = `P1需求作废数量: ${cancelledP1Requirements.value.length}`
  console.log(`P1需求作废数量: ${cancelledP1Requirements.value.length}`)

  // 6. 统计P1需求降级
  currentTask.value = '开始统计P1需求降级...'
  console.log('开始统计P1需求降级...')
  downgradedP1Requirements.value = currentMonth.filter((req: Requirement) => {
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    if (!previousReq) return false

    // 检查是否从P1降级到P2或更低
    const wasP1 = previousReq['产品优先级'] === 'P1'
    const isLowerPriority = req['产品优先级'] !== 'P0' && req['产品优先级'] !== 'P1'
    return wasP1 && isLowerPriority
  }).map((req: Requirement) => {
    const previousReq = previousMonth.find((prevReq: Requirement) => 
      prevReq['需求标题'] === req['需求标题'] && 
      prevReq['入池时间'] === req['入池时间']
    )
    return {
      ...req,
      '需求状态': req['需求状态'],
      '原产品优先级': previousReq ? previousReq['产品优先级'] : '',
      '新产品优先级': req['产品优先级'],
      changeType: 'P1需求降级'
    }
  })
  currentTask.value = `P1需求降级数量: ${downgradedP1Requirements.value.length}`
  console.log(`P1需求降级数量: ${downgradedP1Requirements.value.length}`)

  // 更新统计数据
  dispatchedP0Count.value = dispatchedP0Requirements.value.length
  dispatchedP1Count.value = dispatchedP1Requirements.value.length
  cancelledP0Count.value = cancelledP0Requirements.value.length
  downgradedP0Count.value = downgradedP0Requirements.value.length
  cancelledP1Count.value = cancelledP1Requirements.value.length
  downgradedP1Count.value = downgradedP1Requirements.value.length

  currentTask.value = '所有统计完成，更新显示...'
  console.log('所有统计完成，更新显示...')
}

const handleFileUpload = async (files: File | File[] | null) => {
  currentTask.value = '开始处理文件上传...'
  console.log('开始处理文件上传...')
  let uploadFiles: File[] = []
  
  if (Array.isArray(files)) {
    uploadFiles = files
  } else if (files instanceof File) {
    uploadFiles = [files]
  }
  
  if (!uploadFiles || uploadFiles.length === 0) {
    currentTask.value = '没有上传文件'
    console.log('没有上传文件')
    statsData.value = []
    return
  }

  if (uploadFiles.length !== 2) {
    currentTask.value = '文件数量不正确，需要2个文件'
    console.log('文件数量不正确，需要2个文件')
    errorMessage.value = '请上传两个月份的数据文件进行对比'
    showError.value = true
    return
  }

  try {
    currentTask.value = '开始处理文件...'
    console.log('开始处理文件...')
    isProcessing.value = true
    const processedData = []
    for (const file of uploadFiles) {
      currentTask.value = `处理文件: ${file.name}`
      console.log(`处理文件: ${file.name}`)
      const data = await readExcelFile(file)
      currentTask.value = `文件 ${file.name} 解析完成，数据条数: ${data.length}`
      console.log(`文件 ${file.name} 解析完成，数据条数: ${data.length}`)
      processedData.push(data)
    }
    
    showError.value = false
    currentTask.value = '开始比较和处理数据...'
    console.log('开始比较和处理数据...')
    compareAndProcessData(processedData)
    currentTask.value = '数据处理完成'
    console.log('数据处理完成')
  } catch (error) {
    currentTask.value = `处理文件时发生错误: ${error}`
    console.error('处理文件时发生错误:', error)
    errorMessage.value = '处理文件时发生错误，请确保文件格式正确'
    showError.value = true
  } finally {
    isProcessing.value = false
  }
}

const readExcelFile = (file: File): Promise<Requirement[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        currentTask.value = `开始解析文件: ${file.name}`
        console.log(`开始解析文件: ${file.name}`)
        const data = e.target?.result
        if (!data) {
          currentTask.value = '文件读取失败'
          throw new Error('文件读取失败')
        }
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Requirement[]
        currentTask.value = `文件 ${file.name} 解析完成，数据条数: ${jsonData.length}`
        console.log(`文件 ${file.name} 解析完成，数据条数: ${jsonData.length}`)
        resolve(jsonData)
      } catch (error) {
        currentTask.value = `Excel解析错误: ${error}`
        console.error('Excel解析错误:', error)
        reject(error)
      }
    }
    reader.onerror = (error) => {
      currentTask.value = `文件读取错误: ${error}`
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