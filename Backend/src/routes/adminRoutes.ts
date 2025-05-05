import { Router, Request, Response, NextFunction } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticateToken, isAdmin } from '../middleware/auth';
import { validators } from '../utils/validators';

const router = Router();
const adminController = new AdminController();

/**
 * User Management Routes
 */
// Get all users with pagination
router.get('/users',
  authenticateToken,
  isAdmin,
  adminController.getAllUsers
);

// Get all admin users
router.get('/admins',
  authenticateToken,
  isAdmin,
  adminController.getAdminUsers
);

// Update user role (admin/customer)
router.patch('/users/:id/role',
  authenticateToken,
  isAdmin,
  validators.validateRole,
  adminController.updateUserRole
);

// Delete user
router.delete('/users/:id',
  authenticateToken,
  isAdmin,
  adminController.deleteUser
);

/**
 * Order Management Routes
 */
// Get all orders with filters and pagination
router.get('/orders',
  authenticateToken,
  isAdmin,
  adminController.getAllOrders
);

// Update order status
router.patch('/orders/:id/status',
  authenticateToken,
  isAdmin,
  validators.validateOrderStatus,
  adminController.updateOrderStatus
);

/**
 * Error Handler
 */
router.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  console.error('Admin route error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

export default router;
