import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'

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

// Type for the store's return value
interface OBDStoreState {
  // State
  status: Ref<ObdStatus>
  latestReadings: Ref<ObdReading[]>
  liveTelemetry: Ref<LiveTelemetry>

  // Getters
  isConnected: ReturnType<typeof computed<boolean>>
  connectionState: ReturnType<typeof computed<ObdStatus['state']>>
  getLastError: ReturnType<typeof computed<string | null>>
  getReadings: ReturnType<typeof computed<ObdReading[]>>
  getLiveData: ReturnType<typeof computed<LiveTelemetry>>
  getPidLabel: (pid: string) => string
  getPidUnit: (pid: string) => string

  // Actions
  initializeConnection: () => Promise<void>
  disconnect: () => void
  fetchHistory: (pid: string, limit?: number) => Promise<void>
}

// Create the store
export const useOBDStore = defineStore('obd', (): OBDStoreState => {
  // State
  const status = ref<ObdStatus>(initialState)
  const latestReadings = ref<ObdReading[]>([])
  const liveTelemetry = ref<LiveTelemetry>({
    rpm: null,
    speed: null,
    coolantTemp: null,
    throttle: null,
    load: null,
    timestamp: Date.now(),
  })

  // Getters
  const isConnected = computed(() => status.value.connected)
  const connectionState = computed(() => status.value.state)
  const getLastError = computed(() => status.value.lastError)
  const getReadings = computed(() => latestReadings.value)
  const getLiveData = computed(() => ({ ...liveTelemetry.value }))

  // Actions
  async initializeConnection() {
    try {
      // Simulate connection - in production this would connect to WebSocket
      status.value = {
        ...initialState,
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

      // Mock live data after connection
      simulateLiveData()
    } catch (error) {
      status.value = {
        ...initialState,
        state: 'error',
        lastError: error instanceof Error ? error.message : String(error),
      }
    }
  }

  async disconnect() {
    status.value = {
      ...initialState,
      adapter: 'mock',
    }
  }

  // Subscribe to changes
  const $subscribe: Parameters<ReturnType<typeof defineStore>['$subscribe']>[0] = (
    callback,
    options,
  ) => {
    return { unsubscribe: fn() => {} }
  }

  // Mock live data simulation
  const simulateLiveData = () => {
    // Set up interval to update telemetry
    const intervalId = setInterval(() => {
      // Generate mock data
      const rpm = Math.floor(800 + Math.random() * 4000) // 800-4800 RPM
      const speed = Math.floor(20 + Math.random() * 120) // 20-140 km/h
      const coolantTemp = 90 + Math.random() * 20 // 90-110°C
      const throttle = Math.floor(10 + Math.random() * 40) // 10-50%

      latestReadings.value = [
        { pid: '0C', value: rpm, timestamp: Date.now() },
        { pid: '0D', value: speed, timestamp: Date.now() },
        { pid: '05', value: Math.round(coolantTemp), timestamp: Date.now() },
        { pid: '11', value: throttle, timestamp: Date.now() },
      ]

      liveTelemetry.value = {
        rpm,
        speed,
        coolantTemp: Math.round(coolantTemp),
        throttle,
        load: Math.floor(20 + Math.random() * 50),
        timestamp: Date.now(),
      }
    }, 1000)

    // Cleanup on store reset
    return () => clearInterval(intervalId)
  }

  // Fetch recent history from backend
  async fetchHistory(pid: string, limit: number = 60) {
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
      latestReadings.value = mockData
    } catch (error) {
      console.error('Failed to fetch history:', error)
    }
  }

  // Get human-readable label for PID
  const getPidLabel = (pid: string): string => {
    const labels: Record<string, string> = {
      '0C': 'Engine RPM',
      '0D': 'Vehicle Speed',
      '05': 'Coolant Temperature',
      '11': 'Throttle Position',
      '04': 'Engine Load',
      '0B': 'Intake MAP',
      '0F': 'Intake Air Temperature',
      '10': 'MAF Air Flow',
    }
    return labels[pid] || pid
  }

  // Get unit for PID
  const getPidUnit = (pid: string): string => {
    const units: Record<string, string> = {
      '0C': 'RPM',
      '0D': 'km/h',
      '05': '°C',
      '11': '%',
      '04': '%',
      '0B': 'kPa',
      '0F': '°C',
      '10': 'g/s',
    }
    return units[pid] || ''
  }

  return {
    // State
    status,
    latestReadings,
    liveTelemetry,

    // Getters
    isConnected,
    connectionState,
    getLastError,
    getReadings,
    getLiveData,
    getPidLabel,
    getPidUnit,

    // Actions
    initializeConnection,
    disconnect,
    fetchHistory,
  }
})

// Helper type for the store
export type { ObdStatus, ObdReading, LiveTelemetry, PidValue }