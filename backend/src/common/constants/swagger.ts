export const SWAGGER_TITLES = {
  API_TITLE: 'OBD Diagnostic Gateway API',
  API_DESCRIPTION: 'REST API for OBD-II diagnostic gateway with telemetry, diagnostics, and session management',
} as const;

export const SWAGGER_SUMMARIES = {
  HEALTH_CHECK: 'Health check endpoint',
} as const;

export const SWAGGER_DESCRIPTIONS = {
  HEALTH_CHECK_RESULT: 'Health check result',
} as const;

export const SWAGGER_TAGS = {
  HEALTH: 'Health check endpoint',
  OBD: 'OBD-II adapter management and diagnostics',
  TELEMETRY: 'Vehicle telemetry and live data polling',
  SESSIONS: 'Diagnostic session management',
} as const;

export const SWAGGER_ADAPTER_STATUS_SUMMARY = 'Adapter status endpoint';
export const SWAGGER_ADAPTER_STATUS_DESCRIPTION = 'Adapter status and poller status';
export const SWAGGER_ADAPTER_MODE_SUMMARY = 'Current adapter mode';
export const SWAGGER_MODE_DESCRIPTION = 'Current adapter mode';
export const SWAGGER_SET_MODE_SUMMARY = 'Set adapter mode';
export const SWAGGER_MODE_UPDATED_DESCRIPTION = 'Mode updated successfully';
export const SWAGGER_CONNECT_SUMMARY = 'Connect to OBD adapter';
export const SWAGGER_CONNECTION_ESTABLISHED_DESCRIPTION = 'Connection established';
export const SWAGGER_DISCONNECT_SUMMARY = 'Disconnect from OBD adapter';
export const SWAGGER_DISCONNECTED_DESCRIPTION = 'Disconnected successfully';

export const SWAGGER_POLLER_STATUS_SUMMARY = 'Get poller status';
export const SWAGGER_POLLER_STATUS_DESCRIPTION = 'Poller current status';
export const SWAGGER_START_SUMMARY = 'Start the telemetry poller';
export const SWAGGER_POLLER_STARTED_DESCRIPTION = 'Poller started';
export const SWAGGER_STOP_SUMMARY = 'Stop the telemetry poller';
export const SWAGGER_POLLER_STOPPED_DESCRIPTION = 'Poller stopped';

export const SWAGGER_LIVE_SAMPLE_SUMMARY = 'Get fresh OBD-II sample from adapter';
export const SWAGGER_LIVE_SAMPLE_DESCRIPTION = 'Live reading from the adapter';
export const SWAGGER_SNAPSHOT_SUMMARY = 'Get last persisted value per PID from database';
export const SWAGGER_SNAPSHOT_DESCRIPTION = 'Latest snapshot from database';
export const SWAGGER_HISTORY_SUMMARY = 'Get recent persisted telemetry rows, newest first';
export const SWAGGER_HISTORY_DESCRIPTION = 'Recent telemetry history from database';

export const SWAGGER_OBD_STATUS_SUMMARY = 'Get OBD adapter status';
export const SWAGGER_OBD_STATUS_DESCRIPTION = 'Adapter status and connection info';
export const SWAGGER_OBD_SAMPLE_SUMMARY = 'Get a one-shot live sample from the OBD adapter';
export const SWAGGER_OBD_SAMPLE_DESCRIPTION = 'Live reading from the OBD adapter';

export const SWAGGER_TELEMETRY_STATUS_SUMMARY = 'Get poller status (telemetry alias)';
export const SWAGGER_TELEMETRY_STATUS_DESCRIPTION = 'Poller current status';
export const SWAGGER_TELEMETRY_START_SUMMARY = 'Start the telemetry poller (telemetry alias)';
export const SWAGGER_TELEMETRY_STOP_SUMMARY = 'Stop the telemetry poller (telemetry alias)';
export const SWAGGER_TELEMETRY_SESSION_SUMMARY = 'Get the currently active session (telemetry alias)';
export const SWAGGER_TELEMETRY_SESSION_DESCRIPTION = 'Active session details';
export const SWAGGER_TELEMETRY_LATEST_SUMMARY = 'Get latest telemetry rows stored in PostgreSQL';
export const SWAGGER_TELEMETRY_LATEST_DESCRIPTION = 'Latest telemetry rows';

export const SWAGGER_SESSIONS_LIST_SUMMARY = 'List diagnostic sessions with pagination';
export const SWAGGER_SESSIONS_LIST_DESCRIPTION = 'Paginated list of diagnostic sessions';
export const SWAGGER_SESSIONS_ACTIVE_SUMMARY = 'Get the currently active diagnostic session';
export const SWAGGER_SESSIONS_ACTIVE_DESCRIPTION = 'Currently active diagnostic session details';
export const SWAGGER_SESSIONS_GET_ONE_SUMMARY = 'Get a single diagnostic session by ID';
export const SWAGGER_SESSIONS_GET_ONE_DESCRIPTION = 'Diagnostic session details';
export const SWAGGER_SESSIONS_HISTORY_SUMMARY = 'Retrieve historical readings for a session';
export const SWAGGER_SESSIONS_HISTORY_DESCRIPTION = 'Historical telemetry rows for the session';
export const SWAGGER_SESSIONS_END_SUMMARY = 'End a diagnostic session manually';
export const SWAGGER_SESSIONS_END_DESCRIPTION = 'Session ended successfully';

export const SWAGGER_QUERY_LIMIT_DESCRIPTION = 'Maximum number of latest readings to return';
export const SWAGGER_QUERY_PID_DESCRIPTION = 'Filter by OBD PID (e.g. "0C")';

export const SWAGGER_DATA_SOURCE_ADAPTER = 'adapter' 
export const SWAGGER_DATA_SOURCE_DATABASE = 'database'