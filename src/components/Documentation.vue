<template>
  <div class="documentation">
    <v-card>
      <v-card-title class="d-flex align-center">
        功能说明文档
        <v-spacer></v-spacer>
      </v-card-title>

      <v-card-text>
        <v-expansion-panels>
          <!-- 团队度量指标分析 -->
          <v-expansion-panel>
            <v-expansion-panel-title>团队度量指标分析</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list>
                <v-list-item>
                  <v-list-item-title>文件名格式要求</v-list-item-title>
                  <v-list-item-subtitle>必须包含年月格式，如"202403"或"2024年3月"</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>必需字段</v-list-item-title>
                  <v-list-item-subtitle>
                    <ul>
                      <li>敏捷组名称（必填）</li>
                      <li>敏捷组评估等级（必填，如L1、L2、L3）</li>
                      <li>其他度量指标字段（根据实际需要）</li>
                    </ul>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>数据起始行</v-list-item-title>
                  <v-list-item-subtitle>从第1行开始读取数据</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 成熟度评估分数分布 -->
          <v-expansion-panel>
            <v-expansion-panel-title>成熟度评估分数分布</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list>
                <v-list-item>
                  <v-list-item-title>文件名格式要求</v-list-item-title>
                  <v-list-item-subtitle>无特殊要求</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>必需字段</v-list-item-title>
                  <v-list-item-subtitle>
                    <ul>
                      <li>第一行必须包含维度标题（如"1、需求管理维度得分"）</li>
                      <li>从第三列开始为各维度得分数据</li>
                      <li>得分数据必须为数值类型</li>
                    </ul>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>数据起始行</v-list-item-title>
                  <v-list-item-subtitle>从第2行开始读取数据（第1行为标题行）</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 需求岛治理数据统计 -->
          <v-expansion-panel>
            <v-expansion-panel-title>需求岛治理数据统计</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list>
                <v-list-item>
                  <v-list-item-title>文件名格式要求</v-list-item-title>
                  <v-list-item-subtitle>必须包含年月格式，如"202403"或"2024年3月"</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>必需字段</v-list-item-title>
                  <v-list-item-subtitle>
                    <ul>
                      <li>需求收集标题（必填）</li>
                      <li>业务优先级（必填，如P1）</li>
                      <li>产品优先级（必填）</li>
                      <li>投递产品线路径（必填）</li>
                      <li>入池产品线路径（必填）</li>
                      <li>提报人（必填）</li>
                      <li>提报部门（必填）</li>
                      <li>提报时间（必填）</li>
                      <li>流程节点（必填）</li>
                      <li>当前处理人（必填）</li>
                      <li>已入池收集周期（天）（必填）</li>
                      <li>未入池停留时长（天）（必填）</li>
                    </ul>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>数据起始行</v-list-item-title>
                  <v-list-item-subtitle>从第1行开始读取数据</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 产品需求池治理数据统计 -->
          <v-expansion-panel>
            <v-expansion-panel-title>产品需求池治理数据统计</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list>
                <v-list-item>
                  <v-list-item-title>文件名格式要求</v-list-item-title>
                  <v-list-item-subtitle>必须包含年月格式，如"202403"或"2024年3月"</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>必需字段</v-list-item-title>
                  <v-list-item-subtitle>
                    <ul>
                      <li>需求收集标题（必填）</li>
                      <li>业务优先级（必填，如P0、P1）</li>
                      <li>产品优先级（必填）</li>
                      <li>投递产品线路径（必填）</li>
                      <li>入池产品线路径（必填）</li>
                      <li>提报人（必填）</li>
                      <li>提报部门（必填）</li>
                      <li>提报时间（必填）</li>
                      <li>流程节点（必填）</li>
                      <li>当前处理人（必填）</li>
                      <li>已入池收集周期（天）（必填）</li>
                      <li>未入池停留时长（天）（必填）</li>
                    </ul>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>数据起始行</v-list-item-title>
                  <v-list-item-subtitle>从第1行开始读取数据</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 敏捷走查结果对比统计 -->
          <v-expansion-panel>
            <v-expansion-panel-title>敏捷走查结果对比统计</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list>
                <v-list-item>
                  <v-list-item-title>文件名格式要求</v-list-item-title>
                  <v-list-item-subtitle>必须包含年月格式，如"202403"或"2024年3月"</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>必需字段</v-list-item-title>
                  <v-list-item-subtitle>
                    <ul>
                      <li>PM（必填）</li>
                      <li>产品线（必填）</li>
                      <li>敏捷组（必填）</li>
                      <li>各维度走查结果（必填，格式为"维度名称-过程完成度"或"维度名称-最终状态分"）</li>
                    </ul>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>数据起始行</v-list-item-title>
                  <v-list-item-subtitle>从第4行开始读取数据（前3行为标题行）</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style scoped>
.documentation {
  padding: 16px;
}

.v-expansion-panel-text {
  padding: 0;
}

.v-list-item-subtitle ul {
  margin: 0;
  padding-left: 20px;
}

/* 添加新的样式 */
:deep(.v-expansion-panel-text__wrapper) {
  padding: 12px !important;
}

:deep(.v-list-item) {
  min-height: auto;
  padding: 8px 0;
}

:deep(.v-list-item__content) {
  padding: 4px 0;
}

:deep(.v-list-item-subtitle) {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  -webkit-line-clamp: unset !important;
  -webkit-box-orient: unset !important;
  line-height: 1.5;
}

:deep(.v-expansion-panel-title) {
  min-height: 48px;
  padding: 16px;
}

:deep(.v-expansion-panel-text) {
  overflow: visible !important;
}
</style> 