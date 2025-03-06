<template>
  <v-card class="mb-6">
    <v-card-title>上传Excel文件</v-card-title>
    <v-card-text>
      <v-file-input
        v-model="file"
        accept=".xlsx, .xls"
        label="选择Excel文件"
        prepend-icon="mdi-file-excel"
        @update:model-value="handleFileChange"
        show-size
        :error="!!error"
        :error-messages="error"
      ></v-file-input>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as XLSX from 'xlsx'
import { useChartStore } from '../stores/chart'

const file = ref<File | null>(null)
const error = ref('')
const chartStore = useChartStore()

const handleFileChange = (newFile: File | null) => {
  error.value = ''
  if (!newFile) {
    chartStore.setData([])
    return
  }

  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const data = e.target?.result
      if (!data) {
        error.value = '文件读取失败'
        return
      }
      
      const workbook = XLSX.read(data, { type: 'binary' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet)
      
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        console.log('解析的数据:', jsonData)
        chartStore.setData(jsonData)
      } else {
        error.value = '文件中没有找到有效数据'
      }
    } catch (err) {
      console.error('解析Excel文件时出错:', err)
      error.value = '文件解析失败，请确保上传了正确的Excel文件'
    }
  }

  reader.onerror = () => {
    error.value = '文件读取失败'
    console.error('读取文件时出错')
  }

  try {
    reader.readAsBinaryString(newFile)
  } catch (err) {
    error.value = '无法读取文件'
    console.error('读取文件时出错:', err)
  }
}
</script> 