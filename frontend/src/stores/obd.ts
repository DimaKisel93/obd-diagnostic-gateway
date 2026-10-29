import { defineStore } from 'pinia'
import { ref, computed, onScopeDispose, ComputedRef } from 'vue'
import type { Ref } from 'vue'
import axios from 'axios'
import { DEFAULT_MONITORED_PIDS, PID_OPTIONS, SUPPORTED_PIDS } from '../constants'

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

const API_BASE = '/api'
const POLL_INTERVAL_MS = 1000

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
    const valid = parsed.filter((pid): pid is string => typeof pid === 'string' && SUPPORTED_PIDS.includes(pid))
    return [...new Set(valid)]
  } catch {
    return [...initialMonitoredPids]
  }
}

const persistMonitoredPids = (pids: string[]): void => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(MONITORED_PIDS_STORAGE_KEY, JSON.stringify(pids))
}

const generateMockReadings = (pids: string[]): ObdReading[] => {
  const now = Date.now()
  return pids.map((pid) => {
    let value: number
    switch (pid) {
      case '0C': value = Math.floor(800 + Math.random() * 4000); break
      case '0D': value = Math.floor(20 + Math.random() * 120); break
      case '05': value = Math.round(90 + Math.random() * 20); break
      case '11': value = Math.floor(10 + Math.random() * 40); break
      case '04': value = Math.floor(20 + Math.random() * 50); break
      case '0B': value = Math.round(30 + Math.random() * 70); break
      case '0F': value = Math.round(20 + Math.random() * 30); break
      case '10': value = Math.round(0.2 + Math.random() * 1.8); break
      default: value = 0
    }
    return { pid, value, timestamp: now }
  })
}

const mapToTelemetry = (readings: ObdReading[]): LiveTelemetry => ({
  rpm: readings.find((r) => r.pid === '0C')?.value ?? null,
  speed: readings.find((r) => r.pid === '0D')?.value ?? null,
  coolantTemp: readings.find((r) => r.pid === '05')?.value ?? null,
  throttle: readings.find((r) => r.pid === '11')?.value ?? null,
  load: readings.find((r) => r.pid === '04')?.value ?? null,
  timestamp: Date.now(),
})

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
  const liveTelemetry = ref<LiveTelemetry>({ rpm: null, speed: null, coolantTemp: null, throttle: null, load: null, timestamp: Date.now() })
  const history = ref<ObdReading[]>([])
  const monitoredPids = ref<string[]>(loadPersistedPids())

  let stopPolling: (() => void) | null = null

  const isConnected = computed(() => status.value.connected)
  const connectionState = computed(() => status.value.state)
  const getLastError = computed(() => status.value.lastError)
  const getReadings = computed(() => latestReadings.value)
  const getLiveData = computed(() => ({ ...liveTelemetry.value }))
  const getHistory = computed(() => history.value)

  const fetchLiveSample = async (): Promise<void> => {
    try {
      const { data: readings } = await axios.get<ObdReading[]>(`${API_BASE}/live/sample`, {
        params: { pids: monitoredPids.value.join(',') },
      })
      if (!readings || readings.length === 0) return
      latestReadings.value = readings
      liveTelemetry.value = mapToTelemetry(readings)
    } catch (error) {
      console.error('Failed to fetch live sample from backend:', error)
      latestReadings.value = generateMockReadings(monitoredPids.value)
      liveTelemetry.value = mapToTelemetry(latestReadings.value)
    }
  }

  const startBackendPolling = (): (() => void) => {
    fetchLiveSample()
    const intervalId = setInterval(fetchLiveSample, POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }
const initializeConnection = async (): Promise<void> => {
    stopPolling?.()
    try {
      status.value = { ...createInitialState(), state: 'connecting' }
      try {
        await axios.post(`${API_BASE}/adapter/connect`)
        const { data } = await axios.get<ObdStatus>(`${API_BASE}/adapter`)
        status.value = data
      } catch (err) {
        console.warn('Backend unavailable, using mock simulation:', err)
        await new Promise((resolve) => setTimeout(resolve, 500))
        status.value = { adapter: 'mock', state: 'connected', connected: true, lastError: null }
      }
      stopPolling = startBackendPolling()
    } catch (error) {
      stopPolling?.()
      stopPolling = null
      status.value = { ...createInitialState(), state: 'error', lastError: error instanceof Error ? error.message : String(error) }
    }
  }

  const disconnect = (): void => {
    stopPolling?.()
    stopPolling = null
    status.value = { ...createInitialState(), adapter: 'mock' }
    latestReadings.value = []
    liveTelemetry.value = { rpm: null, speed: null, coolantTemp: null, throttle: null, load: null, timestamp: Date.now() }
  }

  const setMonitoredPids = (pids: string[]): void => {
    monitoredPids.value = [...pids]
    persistMonitoredPids(monitoredPids.value)
    fetchLiveSample()
  }

  const resetMonitoredPids = (): void => {
    setMonitoredPids([...initialMonitoredPids])
  }

  const fetchHistory = async (pid: string, limit: number = 60): Promise<void> => {
    try {
      const { data: items } = await axios.get<ObdReading[]>(`${API_BASE}/live/history`, { params: { pid, limit } })
      history.value = items ?? []
    } catch (error) {
      console.error('Failed to fetch history:', error)
      history.value = [...Array(limit)].map((_, i) => ({
        pid,
        value: Math.random() * 100,
        timestamp: Date.now() - i * 1000,
      }))
    }
  }

  const getPidLabel = (pid: string): string => {
    return PID_OPTIONS.find((option) => option.value === pid)?.label ?? pid
  }

  const getPidUnit = (pid: string): string => {
    return PID_OPTIONS.find((option) => option.value === pid)?.unit ?? ''
  }

  onScopeDispose(() => {
    stopPolling?.()
    stopPolling = null
  })

  return {
    status, latestReadings, liveTelemetry, history, monitoredPids,
    isConnected, connectionState, getLastError, getReadings, getLiveData,
    getHistory, getPidLabel, getPidUnit,
    initializeConnection, disconnect, fetchHistory, setMonitoredPids, resetMonitoredPids,
  }
})