// logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private logLevel: LogLevel;

  constructor(logLevel: LogLevel = 'info') {
    this.logLevel = logLevel;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

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
          info: '\x1b[32m',  // Green
          warn: '\x1b[33m',  // Yellow
          error: '\x1b[31m', // Red
        };
        const resetColor = '\x1b[0m';
        console.log(`${colors[level]}${formattedMessage}${resetColor}`, ...args);
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

export const logger = new Logger();

export default logger;