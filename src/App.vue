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
                <v-tab value="requirement-island">需求岛治理数据统计</v-tab>
                <v-tab value="product-pool">产品需求池治理数据统计</v-tab>
                <v-tab value="agile-team">敏捷走查结果对比统计</v-tab>
                <v-tab value="documentation">功能说明文档</v-tab>
              </v-tabs>

              <v-window v-model="activeTab">
                <v-window-item value="team-metrics">
                  <team-metrics ref="teamMetricsChart" />
                </v-window-item>
                <v-window-item value="maturity-score">
                  <maturity-score-distribution ref="maturityScoreChart" />
                </v-window-item>
                <v-window-item value="requirement-island">
                  <requirement-island-stats ref="requirementIslandStats" />
                </v-window-item>
                <v-window-item value="product-pool">
                  <product-pool-stats ref="productPoolStats" />
                </v-window-item>
                <v-window-item value="agile-team">
                  <agile-team-stats ref="agileTeamStats" />
                </v-window-item>
                <v-window-item value="documentation">
                  <documentation />
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
import TeamMetrics from './components/TeamMetrics.vue'
import MaturityScoreDistribution from './components/MaturityScoreDistribution.vue'
import RequirementIslandStats from './components/RequirementIslandStats.vue'
import ProductPoolStats from './components/ProductPoolStats.vue'
import AgileTeamStats from './components/AgileTeamStats.vue'
import Documentation from './components/Documentation.vue'

const activeTab = ref('team-metrics')
const teamMetricsChart = ref<InstanceType<typeof TeamMetrics> | null>(null)
const maturityScoreChart = ref<InstanceType<typeof MaturityScoreDistribution> | null>(null)
const requirementIslandStats = ref<InstanceType<typeof RequirementIslandStats> | null>(null)
const productPoolStats = ref<InstanceType<typeof ProductPoolStats> | null>(null)
const agileTeamStats = ref<InstanceType<typeof AgileTeamStats> | null>(null)
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