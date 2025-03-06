<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>Excel图表查看器</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container>
        <excel-uploader />
        <chart-display />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import ExcelUploader from './components/ExcelUploader.vue'
import ChartDisplay from './components/ChartDisplay.vue'
</script>

<style scoped>
.v-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}
</style> 