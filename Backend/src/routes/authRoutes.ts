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
  (req: Request, res: Response, next: NextFunction) => authController.register(req, res).catch(next)
);

// Login user
router.post('/login',
  validators.validateLogin,
  (req: Request, res: Response, next: NextFunction) => authController.login(req, res).catch(next)
);

// Request password reset
router.post('/forgot-password',
  validators.validateEmail,
  (req: Request, res: Response, next: NextFunction) => authController.forgotPassword(req, res).catch(next)
);

// Reset password with token
router.post('/reset-password',
  validators.validatePasswordReset,
  (req: Request, res: Response, next: NextFunction) => authController.resetPassword(req, res).catch(next)
);

/**
 * Protected Routes
 */

// Logout user (requires auth)
router.post('/logout',
  authenticateToken,
  (req: Request, res: Response, next: NextFunction) => authController.logout(req, res).catch(next)
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
