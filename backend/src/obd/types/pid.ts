/** Well-known OBD-II Mode 01 PIDs used by the gateway. */
export const ObdPid = {
  ENGINE_RPM: '0C',
  VEHICLE_SPEED: '0D',
  COOLANT_TEMP: '05',
  THROTTLE_POSITION: '11',
} as const;

export type ObdPidCode = (typeof ObdPid)[keyof typeof ObdPid];

export const DEFAULT_LIVE_PIDS: ObdPidCode[] = [
  ObdPid.ENGINE_RPM,
  ObdPid.VEHICLE_SPEED,
  ObdPid.COOLANT_TEMP,
  ObdPid.THROTTLE_POSITION,
];

export const PID_META: Record<
  ObdPidCode,
  { name: string; unit: string | null }
> = {
  [ObdPid.ENGINE_RPM]: { name: 'rpm', unit: 'rpm' },
  [ObdPid.VEHICLE_SPEED]: { name: 'speed', unit: 'km/h' },
  [ObdPid.COOLANT_TEMP]: { name: 'coolant_temp', unit: '°C' },
  [ObdPid.THROTTLE_POSITION]: { name: 'throttle', unit: '%' },
};
