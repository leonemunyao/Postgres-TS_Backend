/**
 * Error handling utility functions
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = {
  // Database errors
  handleDBError: (error: any): AppError => {
    if (error.code === 'P2002') {
      return new AppError(409, 'Record already exists');
    }
    return new AppError(500, 'Database error occurred');
  },

  // Validation errors
  handleValidationError: (errors: string[]): AppError => {
    return new AppError(400, `Validation failed: ${errors.join(', ')}`);
  }
};
