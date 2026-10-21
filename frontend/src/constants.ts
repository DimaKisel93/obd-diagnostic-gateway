export const DEFAULT_MAX = 100
export const DEFAULT_TIME = '1 min'

export const GAUGE_CONSTANTS = {
  arcRadius: 35,
  strokeWidth: 10,
  centerDotRadius: 5,
  angleRange: 180,
};

export const TELEMETRY_CONSTANTS = {
  temperature: {
    min: 40,
    max: 120,
    unit: '°C'
  },
  rpm: {
    min: 500,
    max: 8000,
    unit: 'RPM'
  },
  speed: {
    min: 0,
    max: 250,
    unit: 'km/h'
  },

  trendUp: '↑',
  trendDown: '↓',
};

export const OBD_CONSTANTS = {
  mockRpmRange: { min: 800, max: 4800 },
  mockSpeedRange: { min: 20, max: 140 },
  mockCoolantTempRange: { min: 90, max: 110 },
  mockThrottleRange: { min: 10, max: 50 },
  mockLoadRange: { min: 20, max: 70 },

  initialAdapter: 'mock',
  initialState: 'disconnected',
};

export interface PidOption {
  value: string
  label: string
  unit: string
}

/**
 * Every PID the gateway is able to monitor.
 * `value` is the raw OBD-II PID id (e.g. '0C' = Engine RPM).
 */
export const PID_OPTIONS: PidOption[] = [
  { value: '0C', label: 'Engine RPM', unit: 'RPM' },
  { value: '0D', label: 'Vehicle Speed', unit: 'km/h' },
  { value: '05', label: 'Coolant Temperature', unit: '°C' },
  { value: '04', label: 'Engine Load', unit: '%' },
  { value: '0B', label: 'Intake MAP', unit: 'kPa' },
  { value: '0F', label: 'Intake Air Temp', unit: '°C' },
  { value: '11', label: 'Throttle Position', unit: '%' },
  { value: '10', label: 'MAF Air Flow', unit: 'g/s' },
]

/** All valid PID ids - used to validate persisted/remote input. */
export const SUPPORTED_PIDS: string[] = PID_OPTIONS.map((option) => option.value)

/** PIDs that are monitored out of the box. */
export const DEFAULT_MONITORED_PIDS: string[] = ['0C', '0D', '05', '11'];