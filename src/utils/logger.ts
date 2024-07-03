import winston from 'winston';

/**
 * Logger class for consistent logging across the application.
 * Uses the Singleton pattern to ensure only one instance is created.
 */
class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  /**
   * Private constructor to prevent direct construction calls with the `new` operator.
   */
  private constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'cli.log' })
      ]
    });
  }

  /**
   * Gets the singleton instance of the Logger class.
   * @returns {Logger} The singleton instance of Logger.
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Logs an error message.
   * @param {string} message - The error message to log.
   */
  public error(message: string): void {
    this.logger.error(message);
  }

  /**
   * Logs a warning message.
   * @param {string} message - The warning message to log.
   */
  public warn(message: string): void {
    this.logger.warn(message);
  }

  /**
   * Logs an info message.
   * @param {string} message - The info message to log.
   */
  public info(message: string): void {
    this.logger.info(message);
  }

  /**
   * Logs a debug message.
   * @param {string} message - The debug message to log.
   */
  public debug(message: string): void {
    this.logger.debug(message);
  }

  /**
   * Sets the log level for the logger.
   * @param {string} level - The log level to set (e.g., 'error', 'warn', 'info', 'debug').
   */
  public setLogLevel(level: string): void {
    this.logger.level = level;
  }
}

// Export a singleton instance of the Logger
export const logger = Logger.getInstance();