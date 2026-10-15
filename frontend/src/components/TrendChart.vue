<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>{{ title }}</h3>
      <span class="chart-time">{{ time }}</span>
    </div>
    
    <div class="chart-content">
      <div class="trend-line" v-if="hasData">
        <div 
          class="bar"
          v-for="(value, index) in data"
          :key="index"
          :style="{ height: `${(value / max) * 100}%` }"
          :class="{ warning: isWarning(value), danger: isDanger(value) }"
        ></div>
      </div>
      <div v-else class="no-data">
        <span>No data points available</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  data: number[]
  max?: number
  time?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Chart',
  data: [],
  max: 100,
  time: '1 min',
})

const hasData = computed(() => props.data.length > 0)

const isWarning = computed(() => (value: number) => {
  const normalized = value / props.max
  return normalized >= 0.6 && normalized < 0.85
})

const isDanger = computed(() => (value: number) => {
  const normalized = value / props.max
  return normalized >= 0.85
})

const formattedTime = computed(() => {
  return props.time
})
</script>

<style scoped>
.chart-container {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
}

.chart-time {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.chart-content {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 150px;
  gap: 4px;
  padding: 0.5rem 0;
}

.trend-line {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  gap: 4px;
}

.bar {
  flex: 1;
  background-color: #3498db;
  border-radius: 2px 2px 0 0;
  min-height: 4px;
  transition: height 0.3s, background-color 0.3s;
}

.bar.warning {
  background-color: #f39c12;
}

.bar.danger {
  background-color: #e74c3c;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  width: 100%;
  color: #7f8c8d;
  font-style: italic;
}
</style>