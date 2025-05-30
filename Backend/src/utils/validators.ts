import { NextFunction, Request, Response, RequestHandler } from "express";

/**
 * Validation utility functions
 */
export const validators = {
  // Email validation
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Email validation middleware
  validateEmail: ((req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    try {
      if (!validators.isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      next();
    } catch (error) {
      res.status(400).json({ error: 'Email validation failed' });
    }
  }) as RequestHandler,

  //Registration validation
  isValidRegistration: (email: string, password: string, role: string): boolean => {
    return validators.isValidEmail(email) && validators.isValidPassword(password) && validators.isValidRole(role);
  },

  // Registration validation middleware
  validateRegistration: ((req: Request, res: Response, next: NextFunction) => {
    const { email, password, name } = req.body;
    try {
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      if (!validators.isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      if (!validators.isValidPassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      next();
    } catch (error) {
      res.status(400).json({ error: 'Registration validation failed' });
    }
  }) as RequestHandler,

  //Password validation
  isValidPassword: (password: string): boolean => {
    return password.length >= 8;
  },

  // Password validation middleware
  validatePassword: (password: string): void => {
    if (!validators.isValidPassword(password)) {
      throw new Error('Password must be at least 8 characters long');
    }
  },

  // Login validation
  isValidLogin: (email: string, password: string): boolean => {
    return validators.isValidEmail(email) && validators.isValidPassword(password);
  },

  // Login validation middleware
  validateLogin: ((req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      if (!validators.isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      next();
    } catch (error) {
      res.status(400).json({ error: 'Login validation failed' });
    }
  }) as RequestHandler,

  // Password reset validation
  isValidatePasswordReset: (email: string, password: string, token: string): boolean => {
    return validators.isValidEmail(email) && validators.isValidPassword(password) && typeof token === 'string';
  },

  // Password reset validation middleware
  validatePasswordReset: (req: Request, res: Response, next: NextFunction) => {
    const { email, password, token } = req.body;
    if (!validators.isValidatePasswordReset(email, password, token)) {
      throw new Error('Invalid password reset details');
    }
  },

  // Phone number validation (Kenya format)
  isValidPhone: (phone: string): boolean => {
    const phoneRegex = /^(?:\+254|0)[17]\d{8}$/;
    return phoneRegex.test(phone);
  },

  // Postal code validation (Kenya format)
  isValidPostalCode: (code: string): boolean => {
    const postalCodeRegex = /^\d{5}$/;
    return postalCodeRegex.test(code);
  },

  // Price validation
  isValidPrice: (price: number): boolean => {
    return price > 0 && Number.isFinite(price);
  },

  // Role validation. The should be either admin or customer
  isValidRole: (role: string): boolean => {
    return role === 'admin' || role === 'customer';
  },

  // Status validation. The status should be either pending, processing, completed, or cancelled
  isValidStatus: (status: string): boolean => {
    return ['pending', 'processing', 'completed', 'cancelled'].includes(status);
  },

  // Order status validation middleware
  validateOrderStatus: (status: string): void => {
    if (!validators.isValidStatus(status)) {
      throw new Error('Invalid status. Status must be one of: pending, processing, completed, cancelled');
    }
  },

  // Role validation middleware
  validateRole: (role: string): void => {
    if (!validators.isValidRole(role)) {
      throw new Error('Invalid role. Role must be either "admin" or "customer"');
    }
  },


  
};
