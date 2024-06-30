import { logger } from './logger';

export class ErrorManager {
  static handleError(errorType: string, message: string): void {
    logger.error(`${errorType}: ${message}`);
    // Additional error handling logic can be added here
  }

  static throwError(errorType: string, message: string): never {
    this.handleError(errorType, message);
    throw new Error(`${errorType}: ${message}`);
  }
}