<template>
  <div class="gauge-container">
    <div class="gauge-wrapper">
      <svg class="gauge" :width="size" :height="size" viewBox="0 0 100 100">
        <!-- Background arc -->
        <path 
          class="gauge-background"
          d="M 10,80 
             A 35,35 0 0,1 90,80"
          stroke="var(--color-light)"
          stroke-width="10"
          fill="none"
        />
        
        <!-- Value arc -->
        <path 
          ref="valueArc"
          class="gauge-value"
          d="M 10,80 
             A 35,35 0 0,1 {{ arcEndX }},{{ arcEndY }}"
          stroke="{{ gaugeColor }}"
          stroke-width="10"
          fill="none"
          stroke-linecap="round"
        />
        
        <!-- Center dot -->
        <circle 
          cx="50" 
          cy="80" 
          r="5" 
          fill="var(--color-dark)"
        />
        
        <!-- Value text -->
        <text 
          x="50" 
          y="95" 
          text-anchor="middle"
          class="gauge-value-text"
          fill="var(--color-dark)"
        >
          {{ formattedValue }}
        </text>
        
        <!-- Label text -->
        <text 
          x="50" 
          y="110" 
          text-anchor="middle"
          class="gauge-label-text"
          fill="var(--color-medium)"
        >
          {{ label }}
        </text>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, withDefaults } from 'vue'
import { DEFAULT_MAX } from '../constants'

interface Props {
  value: number | null
  min: number
  max: number
  label: string
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  value: 0,
  min: 0,
  max: DEFAULT_MAX,
  label: '',
  size: 200,
})

// Calculate angle for the gauge arc (0-180 degrees range)
const angle = computed(() => {
  if (props.value === null) return 0
  const clamped = Math.max(props.min, Math.min(props.max, props.value))
  const normalized = (clamped - props.min) / (props.max - props.min)
  return normalized * 180 // 0-180 degrees
})

// Calculate end point of the arc
const arcEndX = computed(() => {
  const rad = (angle.value) * Math.PI / 180
  return 50 + 35 * Math.cos(rad)
})

const arcEndY = computed(() => {
  const rad = (angle.value) * Math.PI / 180
  return 50 - 35 * Math.sin(rad) // SVG y-axis is inverted
})

// Color based on value
const gaugeColor = computed(() => {
  const normalized = angle.value / 180
  if (normalized < 0.3) return 'var(--color-success)' 
  if (normalized < 0.7) return 'var(--color-warning)' 
  return 'var(--color-error)' 
})

const formattedValue = computed(() => {
  if (props.value === null) return '--'
  return props.value.toFixed(0)
})
</script>

<style scoped>
.gauge-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-md);
}

.gauge-wrapper {
  width: 100%;
  max-width: 300px;
}

.gauge {
  transition: all 0.3s ease;
}

.gauge-background {
  transition: stroke 0.3s;
}

.gauge-value {
  transition: stroke-dasharray 0.3s, stroke-dashoffset 0.3s;
}

.gauge-value-text {
  font-size: 2rem;
  font-weight: bold;
  transition: fill 0.3s;
}

.gauge-label-text {
  font-size: 1rem;
  transition: fill 0.3s;
}
</style>