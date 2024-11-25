/**
 * @fileoverview Error management utility providing centralized error handling, logging, and custom error types.
 * Includes functionality for throwing typed errors, logging warnings, and handling unhandled errors.
 * 
 * @author QLLM Team
 * @module utils/error
 */

import { logger } from '../logger';

/**
 * Centralized error management class providing utilities for error handling, logging, and assertions.
 * Integrates with the logger module for consistent error tracking and reporting.
 */
export class ErrorManager {
  /**
   * Throws a custom error with a specific error type and message.
   * Logs the error before throwing for tracking purposes.
   * 
   * @param {string} errorType - Classification or category of the error
   * @param {string} message - Detailed error message
   * @throws {Error} Custom error with type prefix and message
   * 
   * @example
   * ```typescript
   * ErrorManager.throwError('ValidationError', 'Invalid input format');
   * // Throws: Error: ValidationError: Invalid input format
   * ```
   */
  static throwError(errorType: string, message: string): never {
    logger.error(`${errorType}: ${message}`);
    throw new Error(`${errorType}: ${message}`);
  }

  /**
   * Throws an error using a specific error class.
   * Provides type-safe error creation and consistent logging.
   * 
   * @param {new (message: string) => Error} ErrorClass - Constructor for the error type to throw
   * @param {string} message - Detailed error message
   * @throws {Error} Instance of the specified error class
   * 
   * @example
   * ```typescript
   * ErrorManager.throw(FileNotFoundError, 'Config file missing');
   * // Throws: FileNotFoundError: Config file missing
   * ```
   */
  static throw(ErrorClass: new (message: string) => Error, message: string): never {
    // Log the error message with the class name
    logger.error(`${ErrorClass.name}: ${message}`);

    // Create an instance of the specified error class with the message
    const error = new ErrorClass(message);

    // Throw the created error
    throw error;
  }

  /**
   * Logs a warning message without throwing an error.
   * Useful for non-critical issues that should be tracked but don't require stopping execution.
   * 
   * @param {string} warningType - Classification or category of the warning
   * @param {string} message - Detailed warning message
   * 
   * @example
   * ```typescript
   * ErrorManager.logWarning('Performance', 'Operation took longer than expected');
   * ```
   */
  static logWarning(warningType: string, message: string): void {
    logger.warn(`${warningType}: ${message}`);
  }

  /**
   * Handles an error by logging it and optionally rethrowing.
   * Provides stack trace in debug mode for better error tracking.
   * 
   * @param {Error} error - The error to handle
   * @param {boolean} [rethrow=false] - Whether to rethrow the error after logging
   * @throws {Error} The original error if rethrow is true
   * 
   * @example
   * ```typescript
   * try {
   *   riskyOperation();
   * } catch (error) {
   *   ErrorManager.handleError(error, true); // Log and rethrow
   * }
   * ```
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
   * Useful for validating assumptions and invariants in code.
   * 
   * @param {boolean} condition - The condition to check
   * @param {string} errorType - Classification of the error to throw if condition is false
   * @param {string} message - Error message to use if condition is false
   * @throws {Error} Custom error if the condition is false
   * 
   * @example
   * ```typescript
   * ErrorManager.assert(user.isAdmin, 'AuthError', 'Admin access required');
   * ```
   */
  static assert(condition: boolean, errorType: string, message: string): void {
    if (!condition) {
      this.throwError(errorType, message);
    }
  }
}

/**
 * Custom error class for file not found scenarios.
 * Used when attempting to access a file that doesn't exist.
 */
export class FileNotFoundError extends Error {
  /**
   * Creates a new FileNotFoundError.
   * @param {string} path - Path to the file that wasn't found
   */
  constructor(path: string) {
      super(`File not found: ${path}`);
      this.name = 'FileNotFoundError';
  }
}

/**
 * Custom error class for file access issues.
 * Used when permission issues or other access problems occur.
 */
export class FileAccessError extends Error {
  /**
   * Creates a new FileAccessError.
   * @param {string} path - Path to the file that couldn't be accessed
   * @param {string} message - Additional details about the access error
   */
  constructor(path: string, message: string) {
      super(`Failed to access file ${path}: ${message}`);
      this.name = 'FileAccessError';
  }
}