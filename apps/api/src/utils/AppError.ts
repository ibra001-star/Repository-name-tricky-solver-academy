// A typed application error lets controllers throw with an HTTP status and
// machine-readable code, and lets the central error handler respond
// consistently without leaking stack traces to clients in production.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403, 'FORBIDDEN');
  }
  static paymentRequired(message = 'Payment required to access this resource') {
    return new AppError(message, 402, 'PAYMENT_REQUIRED');
  }
  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
  }
  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT');
  }
  static tooMany(message = 'Too many requests') {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS');
  }
  static internal(message = 'Internal server error') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}
