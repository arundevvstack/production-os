export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogPayload {
  message: string;
  context?: Record<string, any>;
  error?: Error | unknown;
  timestamp?: string;
  source?: string;
}

/**
 * DP Creative OS - Centralized Logger
 * In production, this can easily be hooked up to DataDog, Sentry, or generic stdout scrapers.
 */
export const Logger = {
  info: (message: string, context?: Record<string, any>) => {
    log('INFO', { message, context });
  },
  warn: (message: string, context?: Record<string, any>) => {
    log('WARN', { message, context });
  },
  error: (message: string, error?: Error | unknown, context?: Record<string, any>) => {
    log('ERROR', { message, error, context });
  },
  debug: (message: string, context?: Record<string, any>) => {
    if (process.env.NODE_ENV !== 'production') {
      log('DEBUG', { message, context });
    }
  }
};

function log(level: LogLevel, payload: LogPayload) {
  const timestamp = new Date().toISOString();
  
  const logEntry: Record<string, any> = {
    level,
    timestamp,
    message: payload.message,
  };

  if (payload.context) {
    logEntry.context = payload.context;
  }

  if (payload.error) {
    logEntry.error = payload.error instanceof Error ? {
      message: payload.error.message,
      stack: payload.error.stack,
      name: payload.error.name
    } : payload.error;
  }

  // Structured JSON logging for production observability
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(logEntry));
  } else {
    // Human readable for local development
    const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : level === 'DEBUG' ? '\x1b[34m' : '\x1b[32m';
    const reset = '\x1b[0m';
    
    console.log(`${color}[${level}]${reset} ${timestamp} - ${logEntry.message}`);
    if (logEntry.context) {
      console.log(`  Context:`, JSON.stringify(logEntry.context, null, 2));
    }
    if (logEntry.error) {
      console.error(`  Error:`, logEntry.error);
    }
  }
}
