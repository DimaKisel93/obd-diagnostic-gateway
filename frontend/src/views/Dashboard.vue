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

// PIDs we want to display
const DEFAULT_LIVE_PIDS = ['0C', '0D', '05', '11'] // RPM, Speed, Coolant Temp, Throttle

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
  // Subscribe to live updates from the store
  obdStore.$subscribe((mutation, state) => {
    if (mutation.type === 'direct' && mutation.storeId === 'obd') {
      // Update telemetry data when live readings change
      if (state.latestReadings && Array.isArray(state.latestReadings)) {
        const newData: Record<string, number> = {}
        state.latestReadings.forEach(reading => {
          if (reading.value !== null && reading.value !== undefined) {
            newData[reading.pid] = Number(reading.value)
          }
        })
        telemetryData.value = newData
      }
    }
  })
  
  // Initialize connection
  obdStore.initializeConnection()
})

onUnmounted(() => {
  // Cleanup subscription if needed
})
</script>

<style scoped>
.dashboard {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-header h2 {
  margin: 0;
  color: #2c3e50;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #e74c3c;
  transition: background-color 0.3s;
}

.status-indicator.connected {
  background-color: #2ecc71;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
  font-style: italic;
}
</style>