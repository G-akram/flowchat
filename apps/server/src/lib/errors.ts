export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'WORKSPACE_NOT_FOUND'
  | 'CHANNEL_NOT_FOUND'
  | 'MESSAGE_NOT_FOUND'
  | 'RATE_LIMITED';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly field?: string;

  constructor(code: ErrorCode, message: string, statusCode: number, field?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    if (field !== undefined) this.field = field;
    Error.captureStackTrace(this, this.constructor);
  }
}
