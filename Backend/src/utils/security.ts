/**
 * Security utility functions
 */
import crypto from 'crypto';

export const security = {
  // Generate random token
  generateToken: (bytes: number = 32): string => {
    return crypto.randomBytes(bytes).toString('hex');
  },

  // Sanitize user input
  sanitizeInput: (input: string): string => {
    return input.replace(/[<>]/g, '');
  },

  // Hash sensitive data
  hashData: (data: string): string => {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
};

