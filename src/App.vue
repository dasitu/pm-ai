<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>Excel图表查看器</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-tabs
                v-model="activeTab"
                color="primary"
                class="mb-4"
              >
                <v-tab value="team-metrics">团队度量指标分析</v-tab>
                <v-tab value="maturity-score">成熟度评估分数分布</v-tab>
              </v-tabs>

              <v-window v-model="activeTab">
                <v-window-item value="team-metrics">
                  <project-gantt ref="ganttChart" />
                </v-window-item>
                <v-window-item value="maturity-score">
                  <maturity-score-distribution ref="maturityScoreChart" />
                </v-window-item>
              </v-window>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProjectGantt from './components/ProjectGantt.vue'
import MaturityScoreDistribution from './components/MaturityScoreDistribution.vue'

const activeTab = ref('team-metrics')
const ganttChart = ref<InstanceType<typeof ProjectGantt> | null>(null)
const maturityScoreChart = ref<InstanceType<typeof MaturityScoreDistribution> | null>(null)
</script>

<style scoped>
.v-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.v-application {
  background: #f5f5f5;
}

.v-tabs {
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.v-window {
  margin-top: 16px;
}
</style> 