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
import { DEFAULT_MAX, DEFAULT_TIME } from '../constants'

interface Props {
  title: string
  data: number[]
  max?: number
  time?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Chart',
  data: () => [],
  max: DEFAULT_MAX,
  time: DEFAULT_TIME,
})

const hasData = computed(() => props.data.length > 0)

const isWarning = (value: number) => {
  if (props.max <= 0) {
    return false;
  }
  const normalized = value / props.max
  return normalized >= 0.6 && normalized < 0.85
}

const isDanger = (value: number) => {
  if (props.max <= 0) {
    return false;
  }
  const normalized = value / props.max
  return normalized >= 0.85
}

const formattedTime = computed(() => {
  return props.time
})
</script>

<style scoped>
.chart-container {
  background: var(--color-white);
  border-radius: 12px;
  padding: var(--spacing-md);
  box-shadow: var(--shadow-md);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.chart-header h3 {
  margin: 0;
  color: var(--color-dark);
  font-size: 1rem;
}

.chart-time {
  font-size: 0.8rem;
  color: var(--color-medium);
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
  background-color: var(--color-primary);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  min-height: 4px;
  transition: height 0.3s, background-color 0.3s;
}

.bar.warning {
  background-color: var(--color-warning);
}

.bar.danger {
  background-color: var(--color-error);
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 150px;
  width: 100%;
  color: var(--color-medium);
  font-style: italic;
}
</style>