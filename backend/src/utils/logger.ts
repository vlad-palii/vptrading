import { config } from '../config/index.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[config.logging.level as LogLevel] ?? LOG_LEVELS.info;

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, component: string, message: string, data?: unknown): string {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}]`;

  if (data !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevel;
}

export function createLogger(component: string) {
  return {
    debug(message: string, data?: unknown) {
      if (shouldLog('debug')) {
        console.debug(formatMessage('debug', component, message, data));
      }
    },

    info(message: string, data?: unknown) {
      if (shouldLog('info')) {
        console.info(formatMessage('info', component, message, data));
      }
    },

    warn(message: string, data?: unknown) {
      if (shouldLog('warn')) {
        console.warn(formatMessage('warn', component, message, data));
      }
    },

    error(message: string, error?: unknown) {
      if (shouldLog('error')) {
        const errorData = error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error;
        console.error(formatMessage('error', component, message, errorData));
      }
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
