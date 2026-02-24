export class ApiError extends Error {
  readonly statusCode: number;
  readonly details?: Record<string, string[]>;

  constructor(statusCode: number, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
