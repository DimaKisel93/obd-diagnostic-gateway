import { defineStore } from 'pinia'
import { ref, computed, onScopeDispose } from 'vue'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'
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
const WS_PATH = '/telemetry'

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

interface TelemetryDataEvent {
  readings: {
    pid: string
    name: string
    value: number | null
    unit: string
    timestamp: number
  }[]
  sessionId: string
  timestamp: number
}

interface SessionStatusEvent {
  sessionId: string | null
  status: 'started' | 'ended'
  adapter: string
  timestamp: number
}

export const useOBDStore = defineStore('obd', () => {
  const status = ref<ObdStatus>(createInitialState())
  const latestReadings = ref<ObdReading[]>([])
  const liveTelemetry = ref<LiveTelemetry>({
    rpm: null, speed: null, coolantTemp: null, throttle: null, load: null, timestamp: Date.now()
  })
  const history = ref<ObdReading[]>([])
  const monitoredPids = ref<string[]>(loadPersistedPids())
  const backendAvailable = ref<boolean>(true)

  let socket: Socket | null = null
  let currentSessionId: string | null = null
  let pollingCleanup: ReturnType<typeof setInterval> | null = null

  const isConnected = computed(() => status.value.connected)
  const connectionState = computed(() => status.value.state)
  const getLastError = computed(() => status.value.lastError)
  const getReadings = computed(() => latestReadings.value)
  const getLiveData = computed(() => ({ ...liveTelemetry.value }))
  const getHistory = computed(() => history.value)

  function mapSocketReadings(payload: TelemetryDataEvent['readings']): ObdReading[] {
    return payload.map((r) => ({
      pid: r.pid,
      value: r.value,
      timestamp: r.timestamp,
    }))
  }

  function applyReadings(readings: ObdReading[]) {
    if (!readings || readings.length === 0) return
    latestReadings.value = readings
    liveTelemetry.value = mapToTelemetry(readings)
  }

  function clearLiveData() {
    latestReadings.value = []
    liveTelemetry.value = {
      rpm: null, speed: null, coolantTemp: null, throttle: null, load: null, timestamp: Date.now()
    }
  }

  function connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const baseUrl = window.location.origin
      socket = io(baseUrl + WS_PATH, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
      })

      socket.on('connect', () => {
        console.log('[OBD] WebSocket connected:', socket?.id)
      })

      socket.on('connect_error', (err) => {
        console.error('[OBD] WebSocket connection error:', err.message)
        reject(err)
      })

      socket.on('disconnect', (reason) => {
        console.log('[OBD] WebSocket disconnected:', reason)
        if (reason === 'io server disconnect') {
          socket?.connect()
        }
      })

      socket.on('telemetry:data', (event: TelemetryDataEvent) => {
        console.debug('[OBD] Received telemetry data:', event.readings.length, 'readings')
        const readings = mapSocketReadings(event.readings)
        applyReadings(readings)
      })

      socket.on('telemetry:session', (event: SessionStatusEvent) => {
        console.log('[OBD] Session event:', event.status, event.sessionId)
        if (event.status === 'started') {
          currentSessionId = event.sessionId
          if (currentSessionId && socket?.connected) {
            socket.emit('subscribe:session', { sessionId: currentSessionId })
          }
        } else if (event.status === 'ended') {
          currentSessionId = null
          clearLiveData()
        }
      })

      socket.on('telemetry:snapshot', (event: any) => {
        console.debug('[OBD] Received snapshot:', event.readings.length, 'readings')
        const readings = event.readings.map((r: any) => ({
          pid: r.pid,
          value: r.value,
          timestamp: r.recordedAt ? new Date(r.recordedAt).getTime() : Date.now(),
        }))
        applyReadings(readings)
      })

      const timeout = setTimeout(() => {
        if (!socket?.connected) {
          reject(new Error('WebSocket connection timeout'))
        }
      }, 5000)

      socket.once('connect', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  function disconnectWebSocket() {
    if (pollingCleanup) {
      clearInterval(pollingCleanup)
      pollingCleanup = null
    }
    if (socket) {
      if (currentSessionId) {
        socket.emit('unsubscribe:session', { sessionId: currentSessionId })
      }
      socket.disconnect()
      socket = null
    }
    currentSessionId = null
  }

  const fetchLiveSample = async (): Promise<void> => {
    try {
      const { data: readings } = await axios.get<ObdReading[]>(API_BASE + '/live/sample', {
        params: { pids: monitoredPids.value.join(',') },
      })
      if (!readings || readings.length === 0) return
      applyReadings(readings)
    } catch (error) {
      console.error('Failed to fetch live sample from backend:', error)
      applyReadings(generateMockReadings(monitoredPids.value))
    }
  }

  const startPollingFallback = (): Promise<void> => {
    return new Promise((resolve) => {
      fetchLiveSample()
      pollingCleanup = setInterval(fetchLiveSample, 1000)
      resolve()
    })
  }

  const initializeConnection = async (): Promise<void> => {
    disconnectWebSocket()
    try {
      status.value = { ...createInitialState(), state: 'connecting' }

      try {
        await axios.post(API_BASE + '/adapter/connect')
        const { data } = await axios.get<ObdStatus>(API_BASE + '/adapter')
        status.value = data
        backendAvailable.value = true
      } catch (err) {
        console.warn('Backend unavailable, using mock simulation:', err)
        backendAvailable.value = false
        await new Promise((resolve) => setTimeout(resolve, 500))
        status.value = { adapter: 'mock', state: 'connected', connected: true, lastError: null }
      }

      try {
        await connectWebSocket()
        const { data: session } = await axios.get<{ id: string | null }>(API_BASE + '/telemetry/session')
        if (session?.id) {
          currentSessionId = session.id
          if (socket?.connected) {
            socket.emit('subscribe:session', { sessionId: currentSessionId })
          }
        }
        status.value = { ...status.value, state: 'connected', connected: true, lastError: null }
      } catch (wsErr) {
        console.warn('WebSocket unavailable, falling back to polling:', wsErr)
        await startPollingFallback()
      }
    } catch (error) {
      disconnectWebSocket()
      backendAvailable.value = false
      status.value = { ...createInitialState(), state: 'error', lastError: error instanceof Error ? error.message : String(error) }
    }
  }

  const disconnect = (): void => {
    disconnectWebSocket()
    status.value = { ...createInitialState(), adapter: 'mock' }
    clearLiveData()
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
    disconnectWebSocket()
  })

  return {
    status, latestReadings, liveTelemetry, history, monitoredPids,
    isConnected, connectionState, getLastError, getReadings, getLiveData,
    getHistory, getPidLabel, getPidUnit,
    backendAvailable,
    initializeConnection, disconnect, fetchHistory, setMonitoredPids, resetMonitoredPids,
  }
})