<template>
  <div class="project-gantt">
    <v-card>
      <v-card-title class="d-flex align-center">
        项目任务甘特图
        <v-spacer></v-spacer>
        <v-btn-toggle
          v-model="currentView"
          mandatory
          @update:model-value="switchView"
          density="compact"
          class="mr-4"
        >
          <v-btn value="project" size="small">
            <v-icon>mdi-view-grid</v-icon>
            项目视图
          </v-btn>
          <v-btn value="person" size="small">
            <v-icon>mdi-account-group</v-icon>
            人员视图
          </v-btn>
        </v-btn-toggle>
      </v-card-title>
      
      <!-- 筛选条件 -->
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedProject"
              :items="availableProjectTypes"
              label="项目类型"
              multiple
              chips
              clearable
              density="compact"
              @update:model-value="filterTasks"
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedPerson"
              :items="personList"
              label="负责人"
              multiple
              chips
              clearable
              density="compact"
              @update:model-value="filterTasks"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="selectedProjectName"
              :items="projectNameList"
              label="项目"
              multiple
              chips
              clearable
              density="compact"
              @update:model-value="filterTasks"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="selectedCustomer"
              :items="customerList"
              label="客户"
              multiple
              chips
              clearable
              density="compact"
              @update:model-value="filterTasks"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="selectedStatus"
              :items="statusList"
              label="状态"
              multiple
              chips
              clearable
              density="compact"
              @update:model-value="filterTasks"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 甘特图 -->
      <v-card-text>
        <div ref="ganttContainer" class="gantt-chart"></div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { read, utils } from 'xlsx'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import { gantt } from 'dhtmlx-gantt'

// 设置 dayjs 使用中文语言包
dayjs.locale('zh-cn')

interface Task {
  id: string | number
  text: string
  start_date: Date
  end_date: Date
  person: string
  projectType: string
  progress: number
  project?: string
  customer?: string
  priority?: string
  stage?: string
  status?: string
  workload?: number
  remainingWork?: number
  notes?: string
  parent?: string
  open?: boolean
}

// 不同工作表的数据接口
interface DeliveryProjectRow {
  '项目': string
  '客户': string
  '优先级': string
  '项目当前阶段': string
  '任务事项': string
  '负责人': string
  '任务状态': string
  '工作量（人天）': number
  '预计开始时间': string
  '预计完成时间': string
  '当前进展百分比（进行中必填）': number
  '备注': string
  '剩余工作量': number
}

interface PreSalesProjectRow {
  '客户': string
  '提交人': string
  '售前项目类型': string
  '待办任务事项': string
  '负责人': string
  '工作量（人天）': number
  '预计开始时间': string
  '计划完成时间': string
  '任务状态': string
}

interface UpcomingProjectRow {
  '客户': string
  '提交人': string
  '即将开始项目类型': string
  '预估大致规模': string
  '预计开始时间': string
}

interface TechnicalProjectRow {
  '任务/事项': string
  '负责人': string
  '工作量（人天）': number
  '计划完成时间': string
}

interface CompletedProjectRow {
  '项目': string
  '客户': string
  '项目状态': string
}

interface GanttTask extends Task {
  [key: string]: any
}

// 状态定义
const selectedProject = ref<string[]>([])
const selectedPerson = ref<string[]>([])
const selectedProjectName = ref<string[]>([])
const selectedCustomer = ref<string[]>([])
const selectedStatus = ref<string[]>([])
const tasks = ref<Task[]>([])
const projectTypes = ref<string[]>([])
const personList = ref<string[]>([])
const projectNameList = ref<string[]>([])
const customerList = ref<string[]>([])
const statusList = ref<string[]>([])
const ganttContainer = ref<HTMLElement | null>(null)
const currentView = ref('project')

// 计算可用的项目类型
const availableProjectTypes = computed(() => [
  '在途交付项目',
  '在途售前项目',
  '1个月内将来项目',
  '3个月内必要技术基建'
])

// 项目类型颜色映射
const projectColors: Record<string, string> = {
  '在途交付项目': '#FF4081',
  '在途售前项目': '#3F51B5',
  '1个月内将来项目': '#4CAF50',
  '3个月内必要技术基建': '#FFA726',
  '交付项目列表': '#7E57C2'
}

// 日期格式转换函数
function parseChineseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  
  try {
    // 处理 "2025年1月7日 00:00" 格式
    if (dateStr.includes('年')) {
      const match = dateStr.match(/(\d+)年(\d+)月(\d+)日/)
      if (match) {
        const [_, year, month, day] = match
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
    }
    
    // 处理标准格式（如果有的话）
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date
    }
    
    return null
  } catch {
    return null
  }
}

// 初始化甘特图
onMounted(() => {
  if (ganttContainer.value) {
    // 基本配置
    gantt.config.date_format = "%Y-%m-%d"
    gantt.config.scale_height = 50
    gantt.config.row_height = 40
    gantt.config.min_column_width = 40
    
    // 禁用拖放功能
    gantt.config.drag_move = false
    gantt.config.drag_progress = false
    gantt.config.drag_resize = false
    
    // 配置时间刻度
    gantt.config.scales = [
      { unit: "month", step: 1, format: "%Y年%m月" },
      { unit: "week", step: 1, format: "第%W周" },
      { unit: "day", step: 1, format: "%d日" }
    ]
    
    // 启用树形结构
    gantt.config.open_tree_initially = true
    gantt.config.layout = {
      css: "gantt_container",
      rows: [
        {
          cols: [
            {view: "grid", scrollX: "scrollHor", scrollY: "scrollVer"},
            {resizer: true, width: 1},
            {view: "timeline", scrollX: "scrollHor", scrollY: "scrollVer"},
            {view: "scrollbar", id: "scrollVer"}
          ]
        },
        {view: "scrollbar", id: "scrollHor", height: 20}
      ]
    }
    
    // 配置列
    gantt.config.columns = [
      { 
        name: "text", 
        label: currentView.value === 'project' ? "任务名称" : "人员/任务", 
        tree: true, 
        width: 200,
        resize: true
      },
      { 
        name: "project", 
        label: "项目", 
        align: "center", 
        width: 120,
        resize: true
      },
      { 
        name: "customer", 
        label: "客户", 
        align: "center", 
        width: 100,
        resize: true
      },
      { 
        name: "person", 
        label: "负责人", 
        align: "center", 
        width: 80,
        resize: true,
        template: (task: Task) => {
          return currentView.value === 'person' && !task.parent ? '' : task.person
        }
      },
      { 
        name: "status", 
        label: "状态", 
        align: "center", 
        width: 80,
        resize: true
      },
      { 
        name: "workload", 
        label: "工作量", 
        align: "center", 
        width: 80,
        resize: true,
        template: (task: Task) => {
          return task.workload ? task.workload + '人天' : ''
        }
      },
      { 
        name: "progress", 
        label: "进度", 
        align: "center", 
        width: 60,
        resize: true,
        template: (task: Task) => {
          return task.progress && !task.parent ? Math.round(task.progress * 100) + "%" : ''
        }
      }
    ]

    // 自定义任务样式
    gantt.templates.task_class = (_start: Date, _end: Date, task: GanttTask) => {
      if (task.parent) {
        return `project-${task.projectType.replace(/[^a-zA-Z]/g, '')}`
      } else {
        return 'person-group'
      }
    }

    // 自定义提示框
    gantt.templates.tooltip_text = (start: Date, end: Date, task: Task) => {
      let tooltip = `<b>任务:</b> ${task.text}<br/>`
      if (task.project) tooltip += `<b>项目:</b> ${task.project}<br/>`
      if (task.customer) tooltip += `<b>客户:</b> ${task.customer}<br/>`
      if (task.priority) tooltip += `<b>优先级:</b> ${task.priority}<br/>`
      tooltip += `<b>负责人:</b> ${task.person}<br/>`
      if (task.status) tooltip += `<b>状态:</b> ${task.status}<br/>`
      tooltip += `<b>开始时间:</b> ${dayjs(start).format('YYYY-MM-DD')}<br/>`
      tooltip += `<b>结束时间:</b> ${dayjs(end).format('YYYY-MM-DD')}<br/>`
      if (task.workload) tooltip += `<b>工作量:</b> ${task.workload}人天<br/>`
      if (task.progress) tooltip += `<b>进度:</b> ${Math.round(task.progress * 100)}%<br/>`
      if (task.notes) tooltip += `<b>备注:</b> ${task.notes}`
      return tooltip
    }

    // 初始化甘特图
    gantt.init(ganttContainer.value)
  }
})

// 清理
onUnmounted(() => {
  gantt.destructor()
})

// 文件处理函数
const handleFile = async (file: File) => {
  try {
    const data = await file.arrayBuffer()
    const workbook = read(data)
    
    const allTasks: Task[] = []
    const projects = new Set<string>()
    const persons = new Set<string>()
    const projectNames = new Set<string>()
    const customers = new Set<string>()
    const statuses = new Set<string>()
    
    // 处理每个工作表
    workbook.SheetNames.forEach(sheetName => {
      try {
        const sheet = workbook.Sheets[sheetName]
        const jsonData = utils.sheet_to_json(sheet)
        
        switch (sheetName) {
          case '在途交付项目':
            processDeliveryProjects(jsonData as DeliveryProjectRow[], allTasks, persons, projectNames, customers, statuses, sheetName)
            projects.add(sheetName)
            break
          case '在途售前项目':
            processPreSalesProjects(jsonData as PreSalesProjectRow[], allTasks, persons, projectNames, customers, statuses, sheetName)
            projects.add(sheetName)
            break
          case '1个月内将来项目':
            processUpcomingProjects(jsonData as UpcomingProjectRow[], allTasks, persons, projectNames, customers, statuses, sheetName)
            projects.add(sheetName)
            break
          case '3个月内必要技术基建':
            processTechnicalProjects(jsonData as TechnicalProjectRow[], allTasks, persons, projectNames, customers, statuses, sheetName)
            projects.add(sheetName)
            break
          case '交付项目列表':
            // 这个sheet可能只需要记录，不需要显示在甘特图上
            break
        }
      } catch (sheetError) {
        console.error(`处理工作表 ${sheetName} 时出错:`, sheetError)
      }
    })
    
    if (allTasks.length === 0) {
      throw new Error('没有找到有效的任务数据')
    }

    tasks.value = allTasks
    projectTypes.value = Array.from(projects)
    personList.value = Array.from(persons)
    projectNameList.value = Array.from(projectNames)
    customerList.value = Array.from(customers)
    statusList.value = Array.from(statuses)
    
    // 更新甘特图数据
    switchView(currentView.value)

    // 自动调整时间范围
    const minDate = new Date(Math.min(...allTasks.map(t => t.start_date.getTime())))
    const maxDate = new Date(Math.max(...allTasks.map(t => t.end_date.getTime())))
    
    gantt.config.start_date = minDate
    gantt.config.end_date = maxDate
    gantt.render()

  } catch (error) {
    console.error('处理文件时出错:', error)
    alert('处理文件时出错: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 处理在途交付项目
function processDeliveryProjects(data: DeliveryProjectRow[], allTasks: Task[], persons: Set<string>, projectNames: Set<string>, customers: Set<string>, statuses: Set<string>, sheetName: string) {
  data.forEach((row, index) => {
    try {
      // 检查必要字段
      const missingFields = []
      if (!row['任务事项']) missingFields.push('任务事项')
      if (!row['负责人']) missingFields.push('负责人')
      
      if (missingFields.length > 0) {
        console.warn(`行数据缺少必要字段 [${missingFields.join(', ')}]: `, row)
        return
      }

      // 处理日期
      let startDate: Date | null = null
      let endDate: Date | null = null
      
      if (row['预计开始时间']) {
        startDate = parseChineseDate(row['预计开始时间'])
      }
      if (row['预计完成时间']) {
        endDate = parseChineseDate(row['预计完成时间'])
      }
      
      // 如果没有日期信息，使用默认值
      if (!startDate) {
        startDate = new Date() // 默认从今天开始
      }
      if (!endDate) {
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 默认持续7天
      }

      const task: Task = {
        id: `delivery_${index}`,
        text: row['任务事项'],
        start_date: startDate,
        end_date: endDate,
        person: row['负责人'],
        projectType: sheetName,
        progress: row['当前进展百分比（进行中必填）'] ? row['当前进展百分比（进行中必填）'] / 100 : 0,
        project: row['项目'],
        customer: row['客户'],
        priority: row['优先级'],
        stage: row['项目当前阶段'],
        status: row['任务状态'],
        workload: row['工作量（人天）'],
        remainingWork: row['剩余工作量'],
        notes: row['备注']
      }
      
      allTasks.push(task)
      persons.add(row['负责人'])
      if (row['项目']) projectNames.add(row['项目'])
      if (row['客户']) customers.add(row['客户'])
      if (row['任务状态']) statuses.add(row['任务状态'])
    } catch (rowError) {
      console.error('处理行数据时出错:', rowError)
    }
  })
}

// 处理在途售前项目
function processPreSalesProjects(data: PreSalesProjectRow[], allTasks: Task[], persons: Set<string>, projectNames: Set<string>, customers: Set<string>, statuses: Set<string>, sheetName: string) {
  data.forEach((row, index) => {
    try {
      const missingFields = []
      if (!row['待办任务事项']) missingFields.push('待办任务事项')
      if (!row['负责人']) missingFields.push('负责人')
      
      if (missingFields.length > 0) {
        console.warn(`行数据缺少必要字段 [${missingFields.join(', ')}]: `, row)
        return
      }

      let startDate: Date | null = null
      let endDate: Date | null = null
      
      if (row['预计开始时间']) {
        startDate = parseChineseDate(row['预计开始时间'])
      }
      if (row['计划完成时间']) {
        endDate = parseChineseDate(row['计划完成时间'])
      }
      
      if (!startDate) {
        startDate = new Date()
      }
      if (!endDate) {
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      }

      const task: Task = {
        id: `presales_${index}`,
        text: row['待办任务事项'],
        start_date: startDate,
        end_date: endDate,
        person: row['负责人'],
        projectType: sheetName,
        progress: 0,
        customer: row['客户'],
        status: row['任务状态'],
        workload: row['工作量（人天）']
      }
      
      allTasks.push(task)
      persons.add(row['负责人'])
      if (row['客户']) customers.add(row['客户'])
      if (row['任务状态']) statuses.add(row['任务状态'])
    } catch (rowError) {
      console.error('处理行数据时出错:', rowError)
    }
  })
}

// 处理即将开始的项目
function processUpcomingProjects(data: UpcomingProjectRow[], allTasks: Task[], persons: Set<string>, projectNames: Set<string>, customers: Set<string>, statuses: Set<string>, sheetName: string) {
  data.forEach((row, index) => {
    try {
      const missingFields = []
      if (!row['即将开始项目类型']) missingFields.push('即将开始项目类型')
      
      if (missingFields.length > 0) {
        console.warn(`行数据缺少必要字段 [${missingFields.join(', ')}]: `, row)
        return
      }

      let startDate: Date | null = null
      
      if (row['预计开始时间']) {
        startDate = parseChineseDate(row['预计开始时间'])
      }
      
      if (!startDate) {
        startDate = new Date()
      }
      
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

      const task: Task = {
        id: `upcoming_${index}`,
        text: row['即将开始项目类型'],
        start_date: startDate,
        end_date: endDate,
        person: row['提交人'],
        projectType: sheetName,
        progress: 0,
        customer: row['客户']
      }
      
      allTasks.push(task)
      persons.add(row['提交人'])
      if (row['客户']) customers.add(row['客户'])
    } catch (rowError) {
      console.error('处理行数据时出错:', rowError)
    }
  })
}

// 处理技术基建项目
function processTechnicalProjects(data: TechnicalProjectRow[], allTasks: Task[], persons: Set<string>, projectNames: Set<string>, customers: Set<string>, statuses: Set<string>, sheetName: string) {
  data.forEach((row, index) => {
    try {
      const missingFields = []
      if (!row['任务/事项']) missingFields.push('任务/事项')
      if (!row['负责人']) missingFields.push('负责人')
      
      if (missingFields.length > 0) {
        console.warn(`行数据缺少必要字段 [${missingFields.join(', ')}]: `, row)
        return
      }

      let endDate: Date | null = null
      
      if (row['计划完成时间']) {
        endDate = parseChineseDate(row['计划完成时间'])
      }
      
      const startDate = new Date() // 从当前开始
      if (!endDate) {
        endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000) // 默认两周
      }

      const task: Task = {
        id: `technical_${index}`,
        text: row['任务/事项'],
        start_date: startDate,
        end_date: endDate,
        person: row['负责人'],
        projectType: sheetName,
        progress: 0,
        workload: row['工作量（人天）']
      }
      
      allTasks.push(task)
      persons.add(row['负责人'])
      if (row['任务/事项']) projectNames.add(row['任务/事项'])
    } catch (rowError) {
      console.error('处理行数据时出错:', rowError)
    }
  })
}

// 视图切换函数
function switchView(view: string) {
  // 重新组织数据结构
  const filteredTasks = tasks.value.filter(task => {
    const projectMatch = selectedProject.value.length === 0 || 
      selectedProject.value.includes(task.projectType)
    const personMatch = selectedPerson.value.length === 0 || 
      selectedPerson.value.includes(task.person)
    const projectNameMatch = selectedProjectName.value.length === 0 || 
      (task.project && selectedProjectName.value.includes(task.project))
    const customerMatch = selectedCustomer.value.length === 0 || 
      (task.customer && selectedCustomer.value.includes(task.customer))
    const statusMatch = selectedStatus.value.length === 0 || 
      (task.status && selectedStatus.value.includes(task.status))
    
    return projectMatch && personMatch && projectNameMatch && customerMatch && statusMatch
  })

  if (view === 'person') {
    // 按人员组织数据
    const personTasks: Task[] = []
    const personMap = new Map<string, Task>()
    
    // 为每个人创建一个父任务
    Array.from(personList.value).forEach(person => {
      const personTask: Task = {
        id: `person_${person}`,
        text: person,
        start_date: new Date(),
        end_date: new Date(),
        person: person,
        projectType: '人员',
        progress: 0,
        open: true // 默认展开
      }
      personMap.set(person, personTask)
      personTasks.push(personTask)
    })
    
    // 将任务分配到对应的人员下
    filteredTasks.forEach(task => {
      const parentTask = personMap.get(task.person)
      if (parentTask) {
        // 更新父任务的时间范围
        if (task.start_date < parentTask.start_date) {
          parentTask.start_date = task.start_date
        }
        if (task.end_date > parentTask.end_date) {
          parentTask.end_date = task.end_date
        }
        
        // 添加父任务ID
        const taskCopy = { ...task } as Task
        taskCopy.parent = parentTask.id.toString()
        personTasks.push(taskCopy)
      }
    })
    
    // 更新甘特图
    gantt.clearAll()
    gantt.parse({ data: personTasks })
  } else {
    // 项目视图 - 清除所有任务的父任务关系
    const projectTasks = filteredTasks.map(task => {
      const taskCopy = { ...task }
      delete taskCopy.parent
      return taskCopy
    })
    
    gantt.clearAll()
    gantt.parse({ data: projectTasks })
  }
}

// 过滤任务
const filterTasks = () => {
  switchView(currentView.value)
}

// 暴露文件处理函数供父组件调用
defineExpose({
  handleFile
})
</script>

<style>
.project-gantt {
  width: 100%;
  height: 100%;
  min-height: 600px;
  padding: 20px;
}

.gantt-chart {
  height: 500px;
  width: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 项目类型样式 */
.project-zaitoujiaofu .gantt_task_progress {
  background-color: #FF4081;
}

.project-zaitoushouqian .gantt_task_progress {
  background-color: #3F51B5;
}

.project-yigeyueneijianglaixixiang .gantt_task_progress {
  background-color: #4CAF50;
}

.project-sangeyueneibiyaojishujichu .gantt_task_progress {
  background-color: #FFA726;
}

.project-jiaofuxiangmuliebiao .gantt_task_progress {
  background-color: #7E57C2;
}

/* 甘特图主题定制 */
.gantt_task_line {
  border-radius: 24px;
  height: 24px !important;
  margin-top: 8px;
}

.gantt_task_progress {
  border-radius: 24px;
}

.gantt_grid_head_cell {
  font-weight: bold;
  color: #333;
}

.gantt_grid_data {
  font-size: 14px;
}

.gantt_task_content {
  font-size: 12px;
  color: white;
}

/* 工具提示样式 */
.gantt_tooltip {
  font-size: 14px;
  line-height: 1.5;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  padding: 12px;
}

/* 人员组样式 */
.person-group .gantt_task_progress {
  background-color: #78909C;
}

.person-group.gantt_task_line {
  background-color: #ECEFF1;
  border-color: #B0BEC5;
}

/* 调整树形结构样式 */
.gantt_tree_icon {
  margin-right: 5px;
}

.gantt_tree_indent {
  width: 20px;
}

.gantt_grid_data .gantt_cell {
  padding-left: 6px;
  padding-right: 6px;
}

/* 视图切换按钮样式 */
.v-btn-toggle {
  margin-right: 16px;
}

/* 调整按钮和选择器大小 */
.v-select {
  max-height: 40px;
}

.v-select .v-field__input {
  min-height: 36px !important;
  padding-top: 0 !important;
}

.v-select .v-chip {
  margin: 2px;
}
</style> 