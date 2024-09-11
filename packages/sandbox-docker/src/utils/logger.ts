import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private logFile: string;

  constructor(private config: { debugMode: boolean }) {
    this.logFile = path.join(process.cwd(), 'enclave.log');
  }

  private log(level: string, message: string, error?: Error) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');

    if (error && this.config.debugMode) {
      console.error(error);
      fs.appendFileSync(this.logFile, `${error.stack}\n`);
    }
  }

  info(message: string) {
    this.log('INFO', message);
  }

  warn(message: string) {
    this.log('WARN', message);
  }

  error(message: string, error?: Error) {
    this.log('ERROR', message, error);
  }

  debug(message: string) {
    if (this.config.debugMode) {
      this.log('DEBUG', message);
    }
  }
}