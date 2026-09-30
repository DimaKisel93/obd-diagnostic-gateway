import { ObdReading } from '../types/telemetry';

/**
 * Hardware-agnostic OBD-II adapter contract.
 * Implementations: MockElm327Adapter (dev/demo), Elm327Adapter (real USB/BT later).
 */
export interface ObdAdapter {
  readonly name: string;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  /** Read a single Mode 01 PID (e.g. "0C" for RPM). */
  readPid(pid: string): Promise<ObdReading>;

  /** Read several PIDs sequentially. */
  readPids(pids: string[]): Promise<ObdReading[]>;
}

export const OBD_ADAPTER = Symbol('OBD_ADAPTER');
