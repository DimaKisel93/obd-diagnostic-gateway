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
        <div class="pid-toolbar">
          <span class="pid-counter" :class="{ active: selectedCount > 0 }">
            {{ selectedCount }} / {{ pidOptions.length }} selected
          </span>
          <button @click="selectAll" class="btn btn-small">Select All</button>
          <button @click="clearAll" class="btn btn-small">Clear</button>
        </div>
        <div class="pid-checkboxes">
          <label v-for="option in pidOptions" :key="option.value" class="pid-option">
            <input type="checkbox" :value="option.value" v-model="selectedPids" />
            <span class="pid-label">{{ option.label }}</span>
            <span class="pid-code">{{ option.value }}</span>
          </label>
        </div>
      </div>
    </div>
    
    <transition name="toast">
      <div v-if="toast.visible" class="toast">{{ toast.message }}</div>
    </transition>

    <div class="form-actions">
      <button @click="saveSettings" class="btn btn-primary">Save Settings</button>
      <button @click="resetSettings" class="btn btn-secondary">Reset to Defaults</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { useOBDStore } from '../stores/obd'
import { PID_OPTIONS } from '../constants'

const obdStore = useOBDStore()

const adapterMode = ref('mock')
const port = ref('')
const autoConnect = ref(true)
const autoPoll = ref(true)
const pollInterval = ref(1000)
const dbHost = ref('localhost')
const dbPort = ref(5432)
const dbName = ref('obd_gateway')

const pidOptions = PID_OPTIONS

const selectedPids = computed<string[]>({
  get: () => [...obdStore.monitoredPids],
  set: (pids: string[]) => obdStore.setMonitoredPids(pids),
})

const selectedCount = computed(() => selectedPids.value.length)

function selectAll() {
  selectedPids.value = pidOptions.map((option) => option.value)
}

function clearAll() {
  selectedPids.value = []
}

const toast = reactive({ visible: false, message: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string) {
  toast.message = message
  toast.visible = true

  if (toastTimer !== null) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.visible = false
    toastTimer = null
  }, 3000)
}

async function loadSettings() {
  try {
    const { data } = await axios.get('/api/adapter/mode')
    adapterMode.value = data.mode ?? 'mock'
  } catch (err) {
    console.warn('Failed to load adapter mode:', err)
  }
}

async function saveSettings() {
  obdStore.setMonitoredPids([...selectedPids.value])
  const pids = selectedPids.value.join(', ') || 'none'
  showToast(`Settings saved - monitoring ${selectedCount.value} PID(s): ${pids}`)

  try {
    await axios.post('/api/adapter/mode', { mode: adapterMode.value })
    showToast(`Adapter mode set to: ${adapterMode.value}`)
  } catch (err) {
    console.error('Failed to save adapter mode:', err)
    showToast('Failed to save adapter mode')
  }
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
  obdStore.resetMonitoredPids()
  showToast('Settings reset to defaults')
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.settings-view {
  background: var(--color-white);
  border-radius: 12px;
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-md);
  position: relative;
}

.view-header h2 {
  margin: 0;
  color: var(--color-dark);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

.settings-section {
  background: var(--color-indicator-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.settings-section h3 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 1.1rem;
  color: var(--color-dark);
  border-bottom: 2px solid var(--color-primary);
  padding-bottom: var(--spacing-sm);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  color: var(--color-medium);
  margin-bottom: var(--spacing-xs);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-light);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
}

.form-group input[type="checkbox"] {
  width: auto;
  margin-right: var(--spacing-sm);
}

.pid-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-sm);
}

.pid-counter {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-medium);
  margin-right: auto;
}

.pid-counter.active {
  color: var(--color-primary);
}

.pid-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--spacing-xs);
}

.pid-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.9rem;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-light);
  border-radius: var(--radius-md);
  background-color: var(--color-white);
}

.pid-option:hover {
  border-color: var(--color-primary);
}

.pid-option input[type="checkbox"] {
  width: auto;
  margin: 0;
  flex: 0 0 auto;
  cursor: pointer;
}

.pid-label {
  flex: 1 1 auto;
  min-width: 0;
}

.pid-code {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--color-medium);
  background-color: var(--color-light);
  padding: 0 var(--spacing-xs);
  border-radius: var(--radius-sm);
}

.btn-small {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.8rem;
  font-weight: 500;
  background-color: var(--color-indicator-bg);
  color: var(--color-dark);
  border: 1px solid var(--color-light);
}

.btn-small:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.toast {
  position: absolute;
  top: var(--spacing-md);
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-dark);
  color: var(--color-white);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 10;
  max-width: 90%;
  font-size: 0.9rem;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-light);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: var(--color-medium);
  color: var(--color-white);
}

.btn-secondary:hover {
  background: var(--color-light);
}
</style>