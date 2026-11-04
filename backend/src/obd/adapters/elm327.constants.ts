export const ELM327_CONST = {
  CMD_RESET: 'ATZ',
  CMD_ECHO_OFF: 'ATE0',
  CMD_LINEFEEDS_OFF: 'ATL0',
  CMD_HEADERS_OFF: 'ATH0',
  CMD_AUTO_PROTOCOL: 'ATSP0',
  CMD_CAN_FORMAT_OFF: 'ATCAF0',
  CMD_FLOW_CONTROL_OFF: 'ATFCSD0',
  CMD_FLOW_CONTROL_MODE_OFF: 'ATFCSM0',
  CMD_SUPPORTED_PIDS: '0100',
  CMD_SET_PROTOCOL_AUTO: 'ATSP0',
  RESPONSE_PROMPT: '>',
  RESPONSE_ERROR: 'ERROR',
  RESPONSE_UNABLE_PREFIX: 'UNABLE',
  RESPONSE_STOPPED_PREFIX: 'STOPPED',
  RESPONSE_NO_DATA: 'NO DATA',
  RESPONSE_PREFIX_MODE_01: '41',
  RESPONSE_PREFIX_MODE_03: '43',
  DEFAULT_BAUD_RATE: 38400,
  RESPONSE_TIMEOUT_MS: 5000,
  INIT_DELAY_RESET_MS: 1000,
  INIT_DELAY_AT_MS: 100,
  INIT_DELAY_PROTOCOL_MS: 300,
  INIT_DELAY_SUPPORTED_PIDS_MS: 300,
  ERR_NOT_CONFIGURED: 'OBD_SERIAL_PORT is not configured. Set it in .env (e.g., COM3 or /dev/ttyUSB0)',
  ERR_PORT_NOT_INITIALIZED: 'Port not initialized',
  ERR_NOT_CONNECTED: 'Not connected',
  ERR_ALREADY_CONNECTED: 'Already connected',
  ERR_CONNECTION_TIMEOUT: 'Connection timeout after %sms',
  ERR_COMMAND_TIMEOUT: 'Command "%s" timeout after %sms',
  ERR_OPEN_FAILED: 'Failed to open serial port: %s',
  ERR_PORT_ERROR: 'Serial port error: %s',
  ERR_INIT_FAILED: 'ELM327 initialization failed: %s',
  ERR_NO_VALID_RESPONSE: 'No valid response for PID %s: %s',
  ERR_INVALID_RESPONSE_FORMAT: 'Invalid response format for PID %s: %s',
  ERR_INSUFFICIENT_DATA: 'Insufficient data bytes for PID %s',
  ERR_PID_NOT_CONNECTED: 'ELM327 adapter is not connected. Call connect() first.',
} as const;

export interface InitCommand {
  cmd: string;
  desc: string;
  delay: number;
}