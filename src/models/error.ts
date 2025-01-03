export class ValidationError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

export class AuthenticationError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = 401;
  }
}

export class NotFoundError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

export class ConflictError extends Error {
  statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
  }
}
