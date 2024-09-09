import { DetailedError } from '../types';

export class ErrorHandler {
  handleError(error: Error): DetailedError {
    const detailedError: DetailedError = {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
    };

    if (this.isEnclaveError(error)) {
      detailedError.code = (error as any).code;
    }

    return detailedError;
  }

  isEnclaveError(error: Error): boolean {
    return error instanceof Error && 'code' in error;
  }
}