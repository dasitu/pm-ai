<template>
  <div class="team-metrics-analysis">
    <v-card>
      <v-card-title class="d-flex align-center">
        团队度量指标分析
        <v-spacer></v-spacer>
      </v-card-title>
      
      <!-- 文件上传区域 -->
      <v-card-text>
        <v-file-input
          v-model="files"
          multiple
          accept=".xlsx"
          label="上传月度数据文件"
          prepend-icon="mdi-file-excel"
          @update:model-value="handleFileUpload"
          hide-details
        ></v-file-input>
      </v-card-text>

      <!-- 饼图区域 -->
      <v-card-text v-if="metricsData.length > 0">
        <h3 class="text-subtitle-1 mb-4">敏捷组评估等级分布</h3>
        <v-row>
          <v-col v-for="(chartData, index) in monthlyAgileLevelCharts" :key="index" cols="12" md="4">
            <v-card elevation="2" class="pa-2">
              <v-card-title class="text-subtitle-2">{{ chartData.month }}</v-card-title>
              <v-chart class="level-chart" :option="chartData.option" autoresize />
              <!-- 添加等级分布表格 -->
              <v-table density="compact" class="mt-2 level-table">
                <thead>
                  <tr>
                    <th>等级</th>
                    <th>团队数量</th>
                    <th>占比</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, itemIndex) in chartData.levelData" :key="itemIndex">
                    <td>
                      <v-chip
                        :color="getColorByLevel(item.level)"
                        size="x-small"
                        class="text-white"
                      >{{ item.level }}</v-chip>
                    </td>
                    <td class="text-right">{{ item.count }}</td>
                    <td class="text-right">{{ item.percent }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 筛选条件 -->
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedTeams"
              :items="teamList"
              label="选择团队"
              multiple
              chips
              clearable
              density="compact"
              @update:model-value="filterData"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedLevelChanges"
              :items="levelChangeOptions"
              label="等级变化"
              multiple
              chips
              clearable
              density="compact"
              @update:model-value="filterData"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>

      <!-- 状态变化和警告区域 -->
      <v-card-text v-if="statusChanges.length > 0 || continuousStatus.length > 0">
        <v-card flat>
          <v-tabs
            v-model="activeTab"
            color="primary"
            class="mb-4"
          >
            <v-tab value="changes">状态变化</v-tab>
            <v-tab value="warnings">连续状态警告</v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="mt-4">
            <!-- 状态变化表格 -->
            <v-window-item value="changes">
              <v-data-table
                :headers="changeHeaders"
                :items="statusChanges"
                density="compact"
              >
                <template v-slot:item.team="{ item }">
                  <a href="#" @click.prevent="selectTeam((item as unknown as TableItem).raw?.team)">
                    {{ (item as unknown as TableItem).raw?.team || '-' }}
                  </a>
                </template>
                <template v-slot:item.metric="{ item }">
                  <span>{{ (item as unknown as TableItem).raw?.metric || '-' }}</span>
                </template>
                <template v-slot:item.from="{ item }">
                  <v-chip
                    v-if="(item as unknown as TableItem).raw && (item as unknown as TableItem).raw.from"
                    :color="getStatusColor((item as unknown as TableItem).raw.from)"
                    size="small"
                  >
                    {{ (item as unknown as TableItem).raw.from }}
                  </v-chip>
                  <span v-else>-</span>
                </template>
                <template v-slot:item.to="{ item }">
                  <v-chip
                    v-if="(item as unknown as TableItem).raw && (item as unknown as TableItem).raw.to"
                    :color="getStatusColor((item as unknown as TableItem).raw.to)"
                    size="small"
                  >
                    {{ (item as unknown as TableItem).raw.to }}
                  </v-chip>
                  <span v-else>-</span>
                </template>
                <template v-slot:item.metrics="{ item }">
                  <div v-if="(item as unknown as TableItem).raw && (item as unknown as TableItem).raw.metrics && Array.isArray((item as unknown as TableItem).raw.metrics!) && (item as unknown as TableItem).raw.metrics!.length > 0">
                    <v-table density="compact" class="metrics-table">
                      <thead>
                        <tr>
                          <th>指标</th>
                          <th>{{ firstMonthDisplay }}</th>
                          <th>{{ lastMonthDisplay }}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(metricChange, index) in (item as unknown as TableItem).raw?.metrics || []" :key="index">
                          <td>{{ metricChange.metric }}</td>
                          <td>
                            <v-chip :color="getStatusColor(metricChange.from)" size="x-small">
                              {{ metricChange.from }}
                            </v-chip>
                          </td>
                          <td>
                            <v-chip :color="getStatusColor(metricChange.to)" size="x-small">
                              {{ metricChange.to }}
                            </v-chip>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>
                  <span v-else>-</span>
                </template>
                <template v-slot:item.levelChange="{ item }">
                  <v-chip
                    v-if="(item as unknown as TableItem).raw?.levelChange"
                    :color="getLevelChangeColor((item as unknown as TableItem).raw?.levelChange || '')"
                    size="small"
                  >
                    {{ (item as unknown as TableItem).raw?.levelChange }}
                  </v-chip>
                  <span v-else>-</span>
                </template>
              </v-data-table>
            </v-window-item>

            <!-- 连续状态警告表格 -->
            <v-window-item value="warnings">
              <v-data-table
                :headers="warningHeaders"
                :items="continuousStatus"
                density="compact"
                class="mt-4"
                :sort-by="[{ key: 'team', order: 'asc' }]"
              >
                <template v-slot:item.team="{ item }">
                  <a href="#" @click.prevent="selectTeam(item.team)">
                    {{ item.team || '-' }}
                  </a>
                </template>
                <template v-slot:item.metric="{ item }">
                  <span>{{ item.metric || '-' }}</span>
                </template>
                <template v-slot:item.status="{ item }">
                  <v-chip
                    v-if="item && item.status"
                    :color="getStatusColor(item.status)"
                    size="small"
                  >
                    {{ item.status }}
                  </v-chip>
                  <span v-else>-</span>
                </template>
                <template v-slot:item.startMonth="{ item }">
                  <span>{{ item.startMonth || '-' }}</span>
                </template>
                <template v-slot:item.endMonth="{ item }">
                  <span>{{ item.endMonth || '-' }}</span>
                </template>
                <template v-slot:item.duration="{ item }">
                  <v-chip
                    v-if="item && item.duration"
                    :color="getDurationColor(item.duration)"
                    size="small"
                  >
                    {{ item.duration }}个月
                  </v-chip>
                  <span v-else>-</span>
                </template>
              </v-data-table>
            </v-window-item>
          </v-window>
        </v-card>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { TeamMetrics, TableItem, ContinuousStatus } from '@/types'
import { useTeamMetrics } from '@/composables/useTeamMetrics'
import { useStatusAnalysis } from '@/composables/useStatusAnalysis'
import { useCharts } from '@/composables/useCharts'
import VChart from 'vue-echarts'

const files = ref<File[]>([])
const teamList = ref<string[]>([])
const monthList = ref<string[]>([])
const selectedTeams = ref<string[]>([])
const selectedLevelChanges = ref<string[]>([])
const metricsData = ref<TeamMetrics[]>([])
const activeTab = ref('changes')
const statusChanges = ref<TableItem[]>([])
const continuousStatus = ref<ContinuousStatus[]>([])
const firstMonthDisplay = ref('')
const lastMonthDisplay = ref('')

const {
  statsData,
  isLoading,
  errorMessage,
  showError,
  readExcelFile
} = useTeamMetrics()

const {
  getStatusColor,
  updateData
} = useStatusAnalysis(metricsData, monthList, selectedTeams, selectedLevelChanges, statsData.value)

const {
  monthlyAgileLevelCharts,
  updateCharts,
  getColorByLevel
} = useCharts(metricsData, monthList, selectedTeams)

// 等级变化类型
const levelChangeOptions = ['升级', '降级', '不变']

// 表格配置
const changeHeaders = ref([
  { title: '团队', key: 'team' },
  { title: '指标', key: 'metric' },
  { title: '原状态', key: 'from' },
  { title: '新状态', key: 'to' },
  { title: '指标变化', key: 'metrics' },
  { title: '等级变化', key: 'levelChange' }
])

const warningHeaders = [
  { title: '团队', key: 'team', sortable: true },
  { title: '指标', key: 'metric', sortable: true },
  { title: '状态', key: 'status' },
  { title: '开始月份', key: 'startMonth' },
  { title: '结束月份', key: 'endMonth' },
  { title: '持续时间', key: 'duration' }
]

// 获取持续时间颜色
function getDurationColor(duration: number): string {
  if (duration >= 6) return 'error'
  if (duration >= 4) return 'warning'
  return 'success'
}

// 获取等级变化颜色
function getLevelChangeColor(change: string): string {
  switch (change) {
    case '升级':
      return 'success'
    case '降级':
      return 'error'
    default:
      return 'grey'
  }
}

// 处理文件上传
const handleFileUpload = async (files: File | File[]) => {
  try {
    isLoading.value = true
    const fileArray = Array.isArray(files) ? files : [files]
    if (fileArray.length === 0) return

    for (const file of fileArray) {
      await readExcelFile(file)
    }
    updateCharts()
    updateData()
  } catch (error) {
    console.error('处理文件时出错:', error)
    showError.value = true
    errorMessage.value = error instanceof Error ? error.message : '处理文件时出错'
  } finally {
    isLoading.value = false
  }
}

// 过滤数据
function filterData() {
  updateCharts()
  updateData()
}

// 选择团队
function selectTeam(team: string) {
  selectedTeams.value = [team]
  filterData()
}

// 暴露方法供父组件调用
defineExpose({
  getColorByLevel
})
</script>

<style>
.team-metrics-analysis {
  width: 100%;
  height: 100%;
  min-height: 600px;
  padding: 20px;
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

/* 表格样式 */
.v-data-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
}

.v-data-table .v-data-table-header {
  background-color: #f5f5f5;
}

.v-data-table .v-data-table-footer {
  background-color: #f5f5f5;
}

/* 指标变化表格样式 */
.metrics-table {
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  margin: 0;
  padding: 0;
  width: 100%;
}

.metrics-table th {
  background-color: #f5f5f5;
  font-size: 0.8rem;
  padding: 2px 4px !important;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.metrics-table td {
  font-size: 0.8rem;
  padding: 2px 4px !important;
  text-align: center;
  vertical-align: middle;
}

/* 饼图样式 */
.level-chart {
  height: 300px;
  width: 100%;
}

/* 标签页样式 */
.v-tabs {
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.v-window {
  margin-top: 16px;
}
</style> 