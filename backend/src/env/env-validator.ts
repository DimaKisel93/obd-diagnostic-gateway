const REQUIRED_ENV_VARS = ['OBD_SERIAL_PORT'] as const;

function parsePositiveInt(
  value: unknown,
  name: string,
  max?: number,
): string {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0 || (max !== undefined && num > max)) {
    throw new Error(
      `${name} must be a positive integer${max !== undefined ? ` (1-${max})` : ''}`,
    );
  }
  return String(num);
}

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = config[key];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Set them in .env or the process environment.`,
    );
  }

  const result: Record<string, unknown> = { ...config };

  if (config.OBD_BAUD_RATE != null) {
    result.OBD_BAUD_RATE = parsePositiveInt(
      config.OBD_BAUD_RATE,
      'OBD_BAUD_RATE',
    );
  }

  if (config.PORT != null) {
    result.PORT = parsePositiveInt(config.PORT, 'PORT', 65535);
  }

  if (config.THROTTLE_TTL_MS != null) {
    result.THROTTLE_TTL_MS = parsePositiveInt(config.THROTTLE_TTL_MS, 'THROTTLE_TTL_MS');
  }

  if (config.THROTTLE_LIMIT != null) {
    result.THROTTLE_LIMIT = parsePositiveInt(config.THROTTLE_LIMIT, 'THROTTLE_LIMIT');
  }

  if (config.OBD_CB_FAILURE_THRESHOLD != null) {
    result.OBD_CB_FAILURE_THRESHOLD = parsePositiveInt(
      config.OBD_CB_FAILURE_THRESHOLD,
      'OBD_CB_FAILURE_THRESHOLD',
    );
  }

  if (config.OBD_CB_COOLDOWN_MS != null) {
    result.OBD_CB_COOLDOWN_MS = parsePositiveInt(
      config.OBD_CB_COOLDOWN_MS,
      'OBD_CB_COOLDOWN_MS',
    );
  }

  return result;
}