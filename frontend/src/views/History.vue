<template>
  <div class="history-view">
    <div class="view-header">
      <h2>Telemetry History</h2>
      <div class="filters">
        <select v-model="selectedPid">
          <option value="">All PIDs</option>
          <option value="0C">RPM</option>
          <option value="0D">Speed</option>
          <option value="05">Coolant Temp</option>
          <option value="11">Throttle</option>
        </select>
        <input type="date" v-model="dateFilter" />
        <button @click="loadHistory" class="btn">Load</button>
      </div>
    </div>
    
    <div class="chart-container" v-if="historyData.length > 0">
      <trend-chart
        :title="selectedPid ? getPidLabel(selectedPid) : 'All Telemetry'"
        :data="historyData"
        :max="getMaxValue()"
        time="Last 60 readings"
      />
    </div>
    
    <div class="data-table" v-if="historyData.length > 0">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>PID</th>
            <th>Value</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in historyData" :key="index">
            <td>{{ item.timestamp }}</td>
            <td>{{ item.pid }}</td>
            <td>{{ item.value }}</td>
            <td>{{ item.unit }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-else class="empty-state">
      <p>No historical data available</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TrendChart from '../components/TrendChart.vue'

const selectedPid = ref('')
const dateFilter = ref('')
const historyData = ref<any[]>([])

function getPidLabel(pid: string): string {
  const labels: Record<string, string> = {
    '0C': 'RPM',
    '0D': 'Speed',
    '05': 'Coolant Temp',
    '11': 'Throttle',
  }
  return labels[pid] || pid
}

function getMaxValue(): number {
  if (selectedPid.value === '0C') return 8000
  if (selectedPid.value === '0D') return 250
  if (selectedPid.value === '05') return 120
  if (selectedPid.value === '11') return 100
  return 100
}

function loadHistory() {
  // Mock data for now
  historyData.value = []
  for (let i = 0; i < 60; i++) {
    historyData.value.push({
      timestamp: new Date(Date.now() - i * 1000).toLocaleTimeString(),
      pid: selectedPid.value || '0C',
      value: Math.random() * 100,
      unit: 'RPM',
    })
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-view {
  background: var(--color-white);
  border-radius: 12px;
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.view-header h2 {
  margin: 0;
  color: var(--color-dark);
}

.filters {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.filters select,
.filters input {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-light);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}

.btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.9rem;
}

.btn:hover {
  background: #2980b9;
}

.chart-container {
  margin-bottom: var(--spacing-lg);
}

.data-table {
  overflow-x: auto;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-light);
}

.data-table th {
  background: var(--color-indicator-bg);
  font-weight: 600;
  color: var(--color-dark);
}

.data-table tr:hover {
  background: var(--color-indicator-bg);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-medium);
  font-style: italic;
}
</style>