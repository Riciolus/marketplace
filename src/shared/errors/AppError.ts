export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  // statusCode === 5xx hide error message
  public readonly expose: boolean;

  constructor(message: string, statusCode: number, code: string, expose = true) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.expose = expose;

    // Fix prototype chain (important in TS when extending Error)
    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace?.(this);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}
