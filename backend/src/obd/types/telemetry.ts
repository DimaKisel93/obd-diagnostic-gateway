export interface ObdReading {
  pid: string;
  name: string;
  value: number;
  unit: string | null;
  recordedAt: Date;
}

export type ObdConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ObdStatus {
  adapter: string;
  state: ObdConnectionState;
  connected: boolean;
  lastError: string | null;
}
