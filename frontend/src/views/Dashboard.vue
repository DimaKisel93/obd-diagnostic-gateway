<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>Live Telemetry</h2>
      <div class="connection-status">
        <span class="status-indicator" :class="[{ connected: isConnected }]"></span>
        <span>{{ connectionText }}</span>
      </div>
    </div>
    
    <div class="grid" v-if="telemetryData && Object.keys(telemetryData).length > 0">
      <telemetry-card
        v-for="(value, pid) in telemetryData"
        :key="pid"
        :pid="pid"
        :value="value"
        :label="getPidLabel(pid)"
        :unit="getPidUnit(pid)"
      />
    </div>
    
    <div v-else class="empty-state">
      <p>No telemetry data available. Ensure the backend is running and connected.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useOBDStore } from '../stores/obd'
import TelemetryCard from '../components/TelemetryCard.vue'

const obdStore = useOBDStore()
const telemetryData = ref<Record<string, number>>({})
let unsubscribe: (() => void) | null = null

const isConnected = computed(() => obdStore.status.connected)
const connectionText = computed(() => {
  switch (obdStore.status.state) {
    case 'connected': return 'Connected'
    case 'connecting': return 'Connecting...'
    case 'error': return `Error: ${obdStore.status.lastError}`
    default: return 'Disconnected'
  }
})

// Get human-readable label for PID
function getPidLabel(pid: string): string {
  const labels: Record<string, string> = {
    '0C': 'Engine RPM',
    '0D': 'Vehicle Speed',
    '05': 'Coolant Temp',
    '11': 'Throttle Pos',
    '04': 'Load Percentage',
    '0B': 'Intake MAP',
    '0F': 'Intake Temp',
    '10': 'MAF Air Flow'
  }
  return labels[pid] || pid
}

// Get unit for PID
function getPidUnit(pid: string): string {
  const units: Record<string, string> = {
    '0C': 'RPM',
    '0D': 'km/h',
    '05': '°C',
    '11': '%',
    '04': '%',
    '0B': 'kPa',
    '0F': '°C',
    '10': 'g/s'
  }
  return units[pid] || ''
}

onMounted(() => {
  unsubscribe = obdStore.$subscribe((mutation, state) => {
    if (state.latestReadings && Array.isArray(state.latestReadings)) {
      const newData: Record<string, number> = {}
      for (const reading of state.latestReadings) {
        if (reading.value != null) {
          newData[reading.pid] = Number(reading.value)
        }
      }
      telemetryData.value = newData
    }
  })

  obdStore.initializeConnection()
})

onUnmounted(() => {
   unsubscribe?.()
})
</script>

<style scoped>
.dashboard {
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.dashboard-header h2 {
  margin: 0;
  color: var(--color-dark);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.9rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--color-error);
  transition: background-color 0.3s;
}

.status-indicator.connected {
  background-color: var(--color-success);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-medium);
  font-style: italic;
}
</style>