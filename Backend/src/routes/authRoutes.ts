import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validators } from '../utils/validators';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

/**
 * Public Routes
 */

// Register new user
router.post('/register',
  validators.validateRegistration,
  authController.register
);

// Login user
router.post('/login',
  validators.validateLogin,
  authController.login
);

// Request password reset
router.post('/forgot-password',
  validators.validateEmail,
  authController.forgotPassword
);

// Reset password with token
router.post('/reset-password',
  validators.validatePasswordReset,
  authController.resetPassword
);

/**
 * Protected Routes
 */

// Logout user (requires auth)
router.post('/logout',
  authenticateToken,
  authController.logout
);

/**
 * Error Handler
 */
router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  console.error('Auth route error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

export default router;
