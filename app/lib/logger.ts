import winston from 'winston';
import path from 'path';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write all logs with level 'info' and below to producer-connect.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'producer-connect.log'),
      level: 'info'
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error'
    })
  ]
});

// Helper functions for different log levels
export const logInfo = (message: string, meta: object = {}) => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: unknown) => {
  logger.error(message, { error: error instanceof Error ? error.message : error });
};

export const logDebug = (message: string, meta: object = {}) => {
  logger.debug(message, meta);
};

export const logWarning = (message: string, meta: object = {}) => {
  logger.warn(message, meta);
};

// Performance timer helpers
const timers: Record<string, number> = {};

export const startTimer = (label: string) => {
  timers[label] = performance.now();
  if (process.env.DEBUG_TIMERS === 'true') {
    logInfo(`⏱️ Started timer: ${label}`);
  }
};

export const endTimer = (label: string) => {
  if (!timers[label]) {
    logWarning(`Timer ${label} does not exist`);
    return;
  }
  
  const duration = performance.now() - timers[label];
  delete timers[label];
  
  if (process.env.DEBUG_TIMERS === 'true') {
    logInfo(`⏱️ ${label} completed in ${duration.toFixed(2)}ms`);
  }
  
  return duration;
};

// Export the logger instance for advanced usage
export default logger; 