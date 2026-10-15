<template>
  <div class="status-indicator">
    <div class="dot" :class="{ 'active': isConnected, 'error': hasError, 'connecting': isConnecting }" />
    <span class="status-text">{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  state?: 'connected' | 'disconnected' | 'connecting' | 'error'
  connected?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  state: 'disconnected',
  connected: false,
  error: null,
})

const isConnected = computed(() => props.state === 'connected' || props.connected)
const isConnecting = computed(() => props.state === 'connecting')
const hasError = computed(() => props.state === 'error' || props.error !== null)

const statusText = computed(() => {
  if (props.state === 'connecting') return 'Connecting...'
  if (props.state === 'error') return props.error || 'Connection Error'
  if (isConnected.value) return 'Connected'
  return 'Disconnected'
})
</script>

<style scoped>
.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 20px;
  font-size: 0.9rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s;
}

.dot.active {
  background-color: #2ecc71;
  box-shadow: 0 0 8px rgba(46, 204, 113, 0.5);
}

.dot.error {
  background-color: #e74c3c;
  box-shadow: 0 0 8px rgba(231, 76, 60, 0.5);
}

.dot.connecting {
  background-color: #f39c12;
  animation: pulse 1.5s infinite;
}

.status-text {
  color: #2c3e50;
  font-weight: 500;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>