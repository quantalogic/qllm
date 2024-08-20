import { logger } from './logger';
import { QllmError } from '../../types/errors';

/**
 * Custom error class for application-specific errors.
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error manager class for handling and throwing errors consistently across the application.
 */
export class ErrorManager {
  /**
   * Handles an error by logging it and potentially performing additional error-specific actions.
   * @param errorType The type or category of the error.
   * @param message The error message.
   */
  static handleError(errorType: string, message: string): void {
    logger.error(`${errorType}: ${message}`);
    // Additional error handling logic can be added here
    // For example, you could send error reports to a monitoring service
  }

  /**
   * Throws an error with a consistent format.
   * @param errorType The type or category of the error.
   * @param message The error message.
   * @throws An AppError with the formatted error message.
   */
  static throwError(errorType: string, message: string): never {
    throw new AppError(errorType, message);
  }

  /**
   * Creates a formatted error message.
   * @param errorType The type or category of the error.
   * @param message The error message.
   * @returns A formatted error message string.
   */
  static formatErrorMessage(errorType: string, message: string): string {
    return `${errorType}: ${message}`;
  }

  /**
   * Wraps a function to catch and handle any errors it might throw.
   * @param fn The function to wrap.
   * @param errorType The type of error to use if the function throws.
   * @returns A new function that catches and handles errors.
   */
  static wrapWithErrorHandler<T extends (...args: any[]) => any>(
    fn: T,
    errorType: string,
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>): ReturnType<T> => {
      try {
        return fn(...args);
      } catch (error) {
        this.handleError(errorType, error instanceof Error ? error.message : String(error));
        throw error;
      }
    };
  }
}

/**
 * A function to handle errors globally.
 * @param error The error to handle.
 */
export function handleError(error: unknown): void {
  if (error instanceof AppError) {
    logger.error(`${error.name} (${error.code}): ${error.message}`);
  } else if (error instanceof Error) {
    logger.error(`Unexpected error: ${error.message}`);
    logger.debug(`Stack trace:\n${error.stack}`);
  } else {
    logger.error(`An unknown error occurred: ${error}`);
  }
}

export class ErrorHandler {
  static handle(error: unknown): void {
    if (error instanceof QllmError) {
      logger.error(`${error.name}: ${error.message}`);
    } else if (error instanceof Error) {
      logger.error(`Unexpected error: ${error.message}`);
      logger.debug(`Stack trace:\n${error.stack}`);
    } else {
      logger.error(`An unknown error occurred: ${error}`);
    }
  }

  static throw(ErrorClass: new (message: string) => QllmError, message: string): never {
    const error = new ErrorClass(message);
    this.handle(error);
    throw error;
  }
}
