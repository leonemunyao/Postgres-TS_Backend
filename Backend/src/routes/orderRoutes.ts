// Handle order creation and processing

import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const orderController = new OrderController();

// Create order from cart checkout (authenticated users)
router.post('/', authenticateToken, orderController.createOrder.bind(orderController));

// Get all orders (admin only)
router.get('/all', authenticateToken, isAdmin, orderController.getAllOrders.bind(orderController));

// Get user's orders (authenticated user)
router.get('/my-orders', authenticateToken, orderController.getUserOrders.bind(orderController));

// Get specific order details (authenticated user or admin)
router.get('/:id', authenticateToken, orderController.getOrderById.bind(orderController));

// Update order status (admin only)
router.patch('/:id/status', authenticateToken, isAdmin, orderController.updateOrderStatus.bind(orderController));

// Cancel order (authenticated user)
router.post('/:id/cancel', authenticateToken, orderController.cancelOrder.bind(orderController));

// Delete specific order (admin only)
router.delete('/:id', authenticateToken, isAdmin, orderController.deleteOrder.bind(orderController));

// Delete all orders (admin only)
router.delete('/', authenticateToken, isAdmin, orderController.deleteAllOrders.bind(orderController));

export default router;
