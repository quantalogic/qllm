import * as fs from 'fs';
import * as path from 'path';
import { LoggerConfig } from '../types';

export class Logger {
  private logFile: string;

  constructor(private config: LoggerConfig) {
    this.logFile = path.join(process.cwd(), 'enclave.log');
  }

  info(message: string): void {
    this.log('INFO', message);
  }

  warn(message: string): void {
    this.log('WARN', message);
  }

  error(message: string, error?: Error): void {
    this.log('ERROR', message, error);
  }

  debug(message: string): void {
    if (this.config.debugMode) {
      this.log('DEBUG', message);
    }
  }

  private log(level: string, message: string, error?: Error): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level}: ${message}`;
    console.log(logMessage);
    
    if (error) {
      console.error(error);
    }

    fs.appendFileSync(this.logFile, logMessage + '\n');
    if (error) {
      fs.appendFileSync(this.logFile, error.stack + '\n');
    }
  }
}