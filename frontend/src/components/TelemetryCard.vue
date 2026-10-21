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
import { TELEMETRY_CONSTANTS } from '../constants'

interface Props {
  pid: string
  value: number | null
  label: string
  unit: string
}

const { temperature: tempRange, rpm: rpmRange, speed: speedRange } = TELEMETRY_CONSTANTS

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
  return props.value >= 0 ? TELEMETRY_CONSTANTS.trendUp : TELEMETRY_CONSTANTS.trendDown
})

const trendValue = computed(() => {
  if (props.value === null) return '0'
  return Math.abs(props.value).toFixed(1)
})

const isGood = computed(() => {
  if (props.value === null) return false
  if (props.pid === '05' || props.pid === '0F') {
    // Temperature: reasonable range 40-120°C
    return props.value >= tempRange.min && props.value <= tempRange.max
  } else if (props.pid === '0C') {
    // RPM: reasonable range 500-8000
    return props.value >= rpmRange.min && props.value <= rpmRange.max
  } else if (props.pid === '0D') {
    // Speed: reasonable range 0-250
    return props.value >= speedRange.min && props.value <= speedRange.max
  }
  return true
})

const qualityText = computed(() => {
  return isGood.value ? '✓ OK' : '✗ Bad'
})
</script>

<style scoped>
.telemetry-card {
  background: var(--color-telemetry-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}

.telemetry-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.telemetry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xs);
}

.telemetry-header h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--color-telemetry-title);
  font-weight: 600;
}

.pid {
  font-size: 0.75rem;
  color: var(--color-medium);
  background: var(--color-light);
  padding: 0.2rem 0.4rem;
  border-radius: var(--radius-sm);
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
  color: var(--color-telemetry-value);
}

.unit {
  font-size: 0.9rem;
  color: var(--color-medium);
}

.telemetry-trend {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  margin: 0.5rem 0;
}

.trend-up {
  color: var(--color-trend-up);
}

.trend-down {
  color: var(--color-trend-down);
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
  border-radius: var(--radius-lg);
  background-color: var(--color-quality-bad);
  color: var(--color-white);
}

.quality-indicator.good {
  background-color: var(--color-quality-good);
}
</style>