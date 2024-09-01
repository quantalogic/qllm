import { DetailedError, EnclaveErrorCode } from '../types';

export class ErrorHandler {
  handleError(error: Error): DetailedError {
    const detailedError: DetailedError = {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      code: this.getErrorCode(error),
      timestamp: new Date().toISOString()
    };
    return detailedError;
  }

  private getErrorCode(error: Error): EnclaveErrorCode {
    if (error instanceof RangeError) return 'RESOURCE_LIMIT_EXCEEDED';
    if (error instanceof TypeError) return 'TYPE_ERROR';
    if (error instanceof SyntaxError) return 'SYNTAX_ERROR';
    if (error.message.includes('Access denied')) return 'ACCESS_DENIED';
    return 'UNKNOWN_ERROR';
  }

  isEnclaveError(error: Error): boolean {
    return error instanceof Error && 'code' in error;
  }
}

export class EnclaveError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'EnclaveError';
  }
}

/**
 * Custom error for when an AI tool is not found
 */
export class AIToolNotFoundError extends EnclaveError {
  constructor(toolName: string) {
    super(`AI Tool '${toolName}' not found`, 'UNKNOWN_ERROR');
  }
}

/**
 * Custom error for invalid parameters
 */
export class InvalidParametersError extends EnclaveError {
  constructor(toolName: string, errors: string[]) {
    super(`Invalid parameters for tool '${toolName}': ${errors.join(', ')}`, 'TYPE_ERROR');
  }
}