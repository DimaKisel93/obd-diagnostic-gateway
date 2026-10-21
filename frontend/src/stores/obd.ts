import { defineStore } from 'pinia'
import { ref, computed, onScopeDispose, ComputedRef } from 'vue'
import type { Ref } from 'vue'
import { DEFAULT_MONITORED_PIDS, PID_OPTIONS, SUPPORTED_PIDS } from '../constants'

// Types for the OBD store state
export interface ObdStatus {
  adapter: string
  state: 'disconnected' | 'connecting' | 'connected' | 'error'
  connected: boolean
  lastError: string | null
}

export interface ObdReading {
  pid: string
  value: number | null
  timestamp: number
}

export interface LiveTelemetry {
  rpm: number | null
  speed: number | null
  coolantTemp: number | null
  throttle: number | null
  load: number | null
  timestamp: number
}

export type PidValue = {
  pid: string
  value: number | null
  label: string
  unit: string
}

// Initial state
const initialState: ObdStatus = {
  adapter: 'mock',
  state: 'disconnected',
  connected: false,
  lastError: null,
}

const createInitialState = (): ObdStatus => ({ ...initialState })

const initialMonitoredPids = [...DEFAULT_MONITORED_PIDS]

const MONITORED_PIDS_STORAGE_KEY = 'obd.monitoredPids'

const loadPersistedPids = (): string[] => {
  if (typeof window === 'undefined') return [...initialMonitoredPids]

  try {
    const raw = window.localStorage.getItem(MONITORED_PIDS_STORAGE_KEY)
    if (!raw) return [...initialMonitoredPids]

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [...initialMonitoredPids]

    const valid = parsed.filter(
      (pid): pid is string => typeof pid === 'string' && SUPPORTED_PIDS.includes(pid)
    )
    return [...new Set(valid)]
  } catch {
    return [...initialMonitoredPids]
  }
}

const persistMonitoredPids = (pids: string[]): void => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MONITORED_PIDS_STORAGE_KEY, JSON.stringify(pids))
 
}

interface OBDStoreState {
  status: Ref<ObdStatus>
  latestReadings: Ref<ObdReading[]>
  liveTelemetry: Ref<LiveTelemetry>
  history: Ref<ObdReading[]>
  monitoredPids: Ref<string[]>
  isConnected: ComputedRef<boolean>
  connectionState: ComputedRef<ObdStatus['state']>
  getLastError: ComputedRef<string | null>
  getReadings: ComputedRef<ObdReading[]>
  getLiveData: ComputedRef<LiveTelemetry>
  getHistory: ComputedRef<ObdReading[]>
  getPidLabel: (pid: string) => string
  getPidUnit: (pid: string) => string

  initializeConnection: () => Promise<void>
  disconnect: () => void
  fetchHistory: (pid: string, limit?: number) => Promise<void>
  setMonitoredPids: (pids: string[]) => void
  resetMonitoredPids: () => void
}
export const useOBDStore = defineStore('obd', (): OBDStoreState => {

  const status = ref<ObdStatus>(createInitialState())
  const latestReadings = ref<ObdReading[]>([])
  const liveTelemetry = ref<LiveTelemetry>({
    rpm: null,
    speed: null,
    coolantTemp: null,
    throttle: null,
    load: null,
    timestamp: Date.now(),
  })
  const history = ref<ObdReading[]>([])
  const monitoredPids = ref<string[]>(loadPersistedPids())

  let stopSimulation: (() => void) | null = null
  let runSimulationTick: (() => void) | null = null

  const setMonitoredPids = (pids: string[]) => {

    monitoredPids.value = [...pids]
    persistMonitoredPids(monitoredPids.value)
    runSimulationTick?.()
  }

  const resetMonitoredPids = () => {
    setMonitoredPids([...initialMonitoredPids])
  }

  const isConnected = computed(() => status.value.connected)
  const connectionState = computed(() => status.value.state)
  const getLastError = computed(() => status.value.lastError)
  const getReadings = computed(() => latestReadings.value)
  const getLiveData = computed(() => ({ ...liveTelemetry.value }))
  const getHistory = computed(() => history.value)

  const initializeConnection = async () => {

    stopSimulation?.()

    try {
      // Simulate connection - in production this would connect to WebSocket
      status.value = {
        ...createInitialState(),
        state: 'connecting',
      }

      // Simulate connection after a brief delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      status.value = {
        adapter: 'mock',
        state: 'connected',
        connected: true,
        lastError: null,
      }

      stopSimulation = simulateLiveData()
    } catch (error) {
      stopSimulation?.()
      stopSimulation = null
      status.value = {
        ...createInitialState(),
        state: 'error',
        lastError: error instanceof Error ? error.message : String(error),
      }
    }
  }

  const disconnect = () => {
    stopSimulation?.()
    stopSimulation = null

    status.value = {
      ...createInitialState(),
      adapter: 'mock',
    }

    latestReadings.value = []
    liveTelemetry.value = {
      rpm: null,
      speed: null,
      coolantTemp: null,
      throttle: null,
      load: null,
      timestamp: Date.now(),
    }
  }

  const simulateLiveData = (): (() => void) => {
    const tick = () => {
      const pidsToSimulate = monitoredPids.value
      const readings = []
      const telemetry: LiveTelemetry = { rpm: null, speed: null, coolantTemp: null, throttle: null, load: null, timestamp: Date.now() }

      for (const pid of pidsToSimulate) {
        let value: number

        if (pid === '0C') {
          // Engine RPM
          value = Math.floor(800 + Math.random() * 4000)
        } else if (pid === '0D') {
          // Vehicle Speed
          value = Math.floor(20 + Math.random() * 120)
        } else if (pid === '05') {
          // Coolant Temp
          value = Math.round(90 + Math.random() * 20)
        } else if (pid === '11') {
          // Throttle Position
          value = Math.floor(10 + Math.random() * 40)
        } else if (pid === '04') {
          // Engine Load
          value = Math.floor(20 + Math.random() * 50)
        } else if (pid === '0B') {
          // Intake MAP
          value = Math.round(30 + Math.random() * 70)
        } else if (pid === '0F') {
          // Intake Air Temp
          value = Math.round(20 + Math.random() * 30)
        } else if (pid === '10') {
          // MAF Air Flow
          value = Math.round(0.2 + Math.random() * 1.8)
        } else {
          continue
        }

        readings.push({ pid, value, timestamp: Date.now() })

        switch (pid) {
          case '0C': telemetry.rpm = value; break
          case '0D': telemetry.speed = value; break
          case '05': telemetry.coolantTemp = value; break
          case '11': telemetry.throttle = value; break
          case '04': telemetry.load = value; break
        }
      }

      latestReadings.value = readings
      liveTelemetry.value = telemetry
    }

    runSimulationTick = tick

    const intervalId = setInterval(tick, 1000)
    return () => {
      clearInterval(intervalId)
      runSimulationTick = null
    }
  }

  // Fetch recent history from backend
  const fetchHistory = async (pid: string, limit: number = 60) => {
    try {
      // Would fetch from API in production
      const mockData: ObdReading[] = []
      for (let i = 0; i < limit; i++) {
        mockData.push({
          pid,
          value: Math.random() * 100,
          timestamp: Date.now() - i * 1000,
        })
      }
      history.value = mockData
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  // Get human-readable label for PID
  const getPidLabel = (pid: string): string => {
    return PID_OPTIONS.find((option) => option.value === pid)?.label ?? pid
  }

  // Get unit for PID
  const getPidUnit = (pid: string): string => {
    return PID_OPTIONS.find((option) => option.value === pid)?.unit ?? ''
  }

  onScopeDispose(() => {
    stopSimulation?.()
    stopSimulation = null
  })

  return {
    // State
    status,
    latestReadings,
    liveTelemetry,
    history,
    monitoredPids,

    // Getters
    isConnected,
    connectionState,
    getLastError,
    getReadings,
    getLiveData,
    getHistory,
    getPidLabel,
    getPidUnit,

    // Actions
    initializeConnection,
    disconnect,
    fetchHistory,
    setMonitoredPids,
    resetMonitoredPids,
  }
})
