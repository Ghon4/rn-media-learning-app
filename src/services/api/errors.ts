export type AppErrorKind = 'network' | 'http' | 'parse' | 'cancelled' | 'unknown';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly kind: AppErrorKind,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
