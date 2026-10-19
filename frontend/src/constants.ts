export const DEFAULT_MAX = 100
export const DEFAULT_TIME = '1 min'

export const COLORS = {
  success: '#2ecc71',   
  warning: '#f39c12',   
  error: '#e74c3c',     
  info: '#3498db',    
  
  darkGrey: '#2c3e50',      
  lightGrey: '#ecf0f1',     
  mediumGrey: '#7f8c8d',  
  
  gaugeText: '#2c3e50',
  
  indicatorBackground: '#f8f9fa',
};

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
  
  trendUp: 'в†‘',
  trendDown: 'в†“',
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