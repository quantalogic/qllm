/**
 * @fileoverview Logger utility module providing consistent logging across browser and Node.js environments.
 * Features timestamp-based logging, configurable log levels, and environment-specific formatting.
 * 
 * @author QLLM Team
 * @module utils/logger
 */

/** 
 * Valid log levels for the logging system.
 * Levels follow standard severity order: debug < info < warn < error
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Universal logger class supporting both browser and Node.js environments.
 * Provides consistent logging interface with timestamp, log level, and colored output in Node.js.
 */
class Logger {
  private logLevel: LogLevel;

  /**
   * Creates a new Logger instance.
   * @param {LogLevel} logLevel - Initial logging level (default: 'info')
   */
  constructor(logLevel: LogLevel = 'info') {
    this.logLevel = logLevel;
  }

  /**
   * Generates ISO timestamp for log entries.
   * @returns {string} Current timestamp in ISO format
   * @private
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Core logging function that handles message formatting and output.
   * @param {LogLevel} level - Severity level of the log
   * @param {string} message - Main log message
   * @param {...any[]} args - Additional arguments to log
   * @private
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    if (levels[level] >= levels[this.logLevel]) {
      const timestamp = this.getTimestamp();
      const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      if (typeof window !== 'undefined') {
        // Browser environment
        switch (level) {
          case 'debug':
            console.debug(formattedMessage, ...args);
            break;
          case 'info':
            console.info(formattedMessage, ...args);
            break;
          case 'warn':
            console.warn(formattedMessage, ...args);
            break;
          case 'error':
            console.error(formattedMessage, ...args);
            break;
        }
      } else {
        // Node.js environment
        const colors: Record<LogLevel, string> = {
          debug: '\x1b[36m', // Cyan
          info: '\x1b[32m', // Green
          warn: '\x1b[33m', // Yellow
          error: '\x1b[31m', // Red
        };
        const resetColor = '\x1b[0m';
        console.log(`${colors[level]}${formattedMessage}${resetColor}`, ...args);
      }
    }
  }

  /**
   * Logs debug level messages.
   * @param {string} message - Debug message to log
   * @param {...any[]} args - Additional arguments to log
   */
  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  /**
   * Logs informational messages.
   * @param {string} message - Info message to log
   * @param {...any[]} args - Additional arguments to log
   */
  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  /**
   * Logs warning messages.
   * @param {string} message - Warning message to log
   * @param {...any[]} args - Additional arguments to log
   */
  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  /**
   * Logs error messages.
   * @param {string} message - Error message to log
   * @param {...any[]} args - Additional arguments to log
   */
  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  /**
   * Updates the logger's minimum logging level.
   * Messages below this level will be ignored.
   * @param {LogLevel} level - New minimum logging level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

/**
 * Default logger instance configured with 'info' level.
 * @const {Logger}
 */
export const logger = new Logger();

export default logger;
