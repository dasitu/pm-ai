<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>Excel图表查看器</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <v-file-input
              v-model="file"
              label="上传 Excel 文件"
              accept=".xlsx"
              @update:model-value="handleFileUpload"
            ></v-file-input>
          </v-col>
        </v-row>
        
        <v-row>
          <v-col cols="12">
            <project-gantt ref="ganttChart" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProjectGantt from './components/ProjectGantt.vue'

const file = ref<File | null>(null)
const ganttChart = ref<InstanceType<typeof ProjectGantt> | null>(null)

const handleFileUpload = async () => {
  if (file.value && ganttChart.value) {
    await ganttChart.value.handleFile(file.value)
  }
}
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
</style> 