export class errorHandler extends Error {
  constructor(statusCode, message) {  // Fixed parameter order
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}