import { Router } from 'express';
import { ShippingController } from '../controllers/ShippingController';
import { authenticateToken } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();
const shippingController = new ShippingController();

// All routes require authentication
router.use(authenticateToken);

// Shipping routes
router.post('/', shippingController.createShipping.bind(shippingController));
router.get('/:orderId', shippingController.getShippingDetails.bind(shippingController));
router.patch('/:orderId', shippingController.updateShippingDetails.bind(shippingController));
router.delete('/:orderId', shippingController.deleteShipping.bind(shippingController));

// Admin only routes
router.get('/status/:status', isAdmin, shippingController.getShippingByStatus.bind(shippingController));
router.patch('/status/:shippingId', isAdmin, shippingController.updateShippingStatus.bind(shippingController));
router.get('/', isAdmin, shippingController.getAllShipping.bind(shippingController));

export default router;
