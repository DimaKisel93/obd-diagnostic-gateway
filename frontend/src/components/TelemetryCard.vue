<template>
  <div class="telemetry-card">
    <div class="telemetry-header">
      <h3>{{ label }}</h3>
      <span class="pid">{{ pid }}</span>
    </div>
    
    <div class="telemetry-value">
      <span class="value">{{ displayValue }}</span>
      <span class="unit">{{ unit }}</span>
    </div>
    
    <div class="telemetry-trend">
      <span :class="trendClass">
        {{ trendIcon }}
      </span>
      <span class="trend-value">{{ trendValue }}</span>
    </div>
    
    <div class="telemetry-footer">
      <div class="quality-indicator" :class="{ good: isGood }">
        {{ qualityText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  pid: string
  value: number | null
  label: string
  unit: string
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  label: '',
  unit: '',
})

const displayValue = computed(() => {
  if (props.value === null) return '--'
  if (props.pid === '05' || props.pid === '0F') {
    // Temperature values
    return props.value
  } else if (props.pid === '0C') {
    // RPM values
    return props.value.toLocaleString()
  } else if (props.pid === '0D') {
    // Speed
    return props.value
  } else {
    return props.value.toFixed(1)
  }
})

const trendClass = computed(() => {
  if (props.value === null) return ''
  return props.value >= 0 ? 'trend-up' : 'trend-down'
})

const trendIcon = computed(() => {
  if (props.value === null) return ''
  return props.value >= 0 ? '↑' : '↓'
})

const trendValue = computed(() => {
  if (props.value === null) return '0'
  return Math.abs(props.value).toFixed(1)
})

const isGood = computed(() => {
  if (props.value === null) return false
  if (props.pid === '05' || props.pid === '0F') {
    // Temperature: reasonable range 40-120°C
    return props.value >= 40 && props.value <= 120
  } else if (props.pid === '0C') {
    // RPM: reasonable range 500-8000
    return props.value >= 500 && props.value <= 8000
  } else if (props.pid === '0D') {
    // Speed: reasonable range 0-250
    return props.value >= 0 && props.value <= 250
  }
  return true
})

const qualityText = computed(() => {
  return isGood.value ? '✓' : '✗'
})
</script>

<style scoped>
.telemetry-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.telemetry-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.telemetry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.telemetry-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 600;
}

.pid {
  font-size: 0.75rem;
  color: #7f8c8d;
  background: #f5f7fa;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.telemetry-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

.value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
}

.unit {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.telemetry-trend {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  margin: 0.5rem 0;
}

.trend-up {
  color: #27ae60;
}

.trend-down {
  color: #e74c3c;
}

.trend-value {
  font-weight: 500;
}

.telemetry-footer {
  margin-top: 0.5rem;
}

.quality-indicator {
  font-size: 0.75rem;
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  background-color: #e74c3c;
  color: white;
}

.quality-indicator.good {
  background-color: #27ae60;
}
</style>