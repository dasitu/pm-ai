import { defineStore } from 'pinia'

interface ChartState {
  data: any[]
}

export const useChartStore = defineStore('chart', {
  state: (): ChartState => ({
    data: []
  }),
  
  actions: {
    setData(newData: any[]) {
      this.data = newData
    }
  }
}) 