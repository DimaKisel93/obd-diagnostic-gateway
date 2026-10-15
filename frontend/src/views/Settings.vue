<template>
  <div class="settings-view">
    <div class="view-header">
      <h2>Settings</h2>
    </div>
    
    <div class="settings-grid">
      <div class="settings-section">
        <h3>Adapter</h3>
        <div class="form-group">
          <label for="adapter">Adapter Mode</label>
          <select id="adapter" v-model="adapterMode">
            <option value="mock">Mock (Simulated)</option>
            <option value="elm327">Real ELM327 (J2534)</option>
            <option value="j2534">J2534 OpenPort 2.0</option>
          </select>
        </div>
        <div class="form-group" v-if="adapterMode === 'elm327'">
          <label for="port">Port</label>
          <select id="port" v-model="port">
            <option value="">Auto-detect</option>
            <option value="COM1">COM1</option>
            <option value="COM2">COM2</option>
            <option value="COM3">COM3</option>
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>Connection</h3>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="autoConnect" />
            Auto-connect on startup
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="autoPoll" />
            Automatic polling enabled
          </label>
        </div>
        <div class="form-group" v-if="autoPoll">
          <label for="pollInterval">Poll Interval (ms)</label>
          <input 
            id="pollInterval" 
            type="number" 
            v-model.number="pollInterval"
            min="100"
            max="10000"
          />
        </div>
      </div>
      
      <div class="settings-section">
        <h3>Data Storage</h3>
        <div class="form-group">
          <label for="dbHost">PostgreSQL Host</label>
          <input id="dbHost" type="text" v-model="dbHost" />
        </div>
        <div class="form-group">
          <label for="dbPort">Database Port</label>
          <input id="dbPort" type="number" v-model.number="dbPort" />
        </div>
        <div class="form-group">
          <label for="dbName">Database Name</label>
          <input id="dbName" type="text" v-model="dbName" />
        </div>
      </div>
      
      <div class="settings-section">
        <h3>PIDs to Monitor</h3>
        <div class="pid-checkboxes">
          <label v-for="pid in pidOptions" :key="pid.value" class="pid-option">
            <input type="checkbox" :value="pid.value" v-model="monitorPids" />
            <span>{{ pid.label }}</span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="form-actions">
      <button @click="saveSettings" class="btn btn-primary">Save Settings</button>
      <button @click="resetSettings" class="btn btn-secondary">Reset to Defaults</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const adapterMode = ref('mock')
const port = ref('')
const autoConnect = ref(true)
const autoPoll = ref(true)
const pollInterval = ref(1000)
const dbHost = ref('localhost')
const dbPort = ref(5432)
const dbName = ref('obd_gateway')
const monitorPids = ref(['0C', '0D', '05', '11'])

const pidOptions = [
  { value: '0C', label: 'Engine RPM' },
  { value: '0D', label: 'Vehicle Speed' },
  { value: '05', label: 'Engine Coolant Temp' },
  { value: '04', label: 'Engine Load' },
  { value: '0B', label: 'Intake MAP' },
  { value: '0F', label: 'Intake Air Temp' },
  { value: '11', label: 'Throttle Position' },
  { value: '10', label: 'MAF Air Flow' },
]

function saveSettings() {
  alert('Settings saved:\n' + 
        `Adapter: ${adapterMode.value}\n` +
        `Auto-connect: ${autoConnect.value}\n` +
        `Poll interval: ${pollInterval.value}ms\n` +
        `PIDs: ${monitorPids.value.join(', ')}`)
}

function resetSettings() {
  adapterMode.value = 'mock'
  port.value = ''
  autoConnect.value = true
  autoPoll.value = true
  pollInterval.value = 1000
  dbHost.value = 'localhost'
  dbPort.value = 5432
  dbName.value = 'obd_gateway'
  monitorPids.value = ['0C', '0D', '05', '11']
}
</script>

<style scoped>
.settings-view {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.view-header h2 {
  margin: 0;
  color: #2c3e50;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}

.settings-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.25rem;
}

.settings-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 0.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  color: #34495e;
  margin-bottom: 0.4rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.form-group input[type="checkbox"] {
  width: auto;
  margin-right: 0.5rem;
}

.pid-checkboxes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.pid-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}
</style>