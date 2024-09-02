import { logger } from '../logger';

export class ErrorManager {
  /**
   * Throws a custom error with a specific error type and message.
   * @param errorType The type of error to throw
   * @param message The error message
   * @throws {Error} A custom error with the specified type and message
   */
  static throwError(errorType: string, message: string): never {
    logger.error(`${errorType}: ${message}`);
    throw new Error(`${errorType}: ${message}`);
  }

  /**
   * Throws an error of the specified class with the given message.
   *
   * @param ErrorClass - The class of the error to be thrown. It should be a constructor function that takes a message string.
   * @param message - The message to be included in the error.
   * @throws {Error} - Throws an instance of the specified ErrorClass with the provided message.
   */
  static throw(ErrorClass: new (message: string) => Error, message: string): never {
    // Log the error message with the class name
    logger.error(`${ErrorClass.name}: ${message}`);

    // Create an instance of the specified error class with the message
    const error = new ErrorClass(message);

    // Throw the created error
    throw error;
  }

  /*
   * Logs a warning message without throwing an error.
   * @param warningType The type of warning
   * @param message The warning message
   */
  static logWarning(warningType: string, message: string): void {
    logger.warn(`${warningType}: ${message}`);
  }

  /**
   * Handles an error by logging it and optionally rethrowing.
   * @param error The error to handle
   * @param rethrow Whether to rethrow the error after logging
   * @throws {Error} The original error if rethrow is true
   */
  static handleError(error: Error, rethrow: boolean = false): void {
    logger.error(`Unhandled error: ${error.message}`);
    logger.debug(error.stack || '');

    if (rethrow) {
      throw error;
    }
  }

  /**
   * Asserts a condition and throws an error if it's false.
   * @param condition The condition to assert
   * @param errorType The type of error to throw if the condition is false
   * @param message The error message to use if the condition is false
   * @throws {Error} A custom error if the condition is false
   */
  static assert(condition: boolean, errorType: string, message: string): void {
    if (!condition) {
      this.throwError(errorType, message);
    }
  }
}
