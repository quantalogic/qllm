import { logger } from './logger';

export class AppError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): void {
  if (error instanceof AppError) {
    logger.error(`${error.code}: ${error.message}`);
  } else if (error instanceof Error) {
    logger.error(`Unhandled error: ${error.message}`);
  } else {
    logger.error(`An unknown error occurred: ${error}`);
  }
}

export function throwAppError(message: string, code: string): never {
  throw new AppError(message, code);
}
