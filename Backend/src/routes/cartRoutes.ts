import { Router } from 'express';
import { CartController } from '../controllers/CartController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const cartController = new CartController();

// Add item to cart
router.post('/', authenticateToken, cartController.addToCart.bind(cartController));

// Get user's cart
router.get('/', authenticateToken, cartController.getCart.bind(cartController));

// Update cart item quantity
router.patch('/items/:itemId', authenticateToken, cartController.updateCartItem.bind(cartController));

// Remove item from cart
router.delete('/items/:itemId', authenticateToken, cartController.removeFromCart.bind(cartController));

// Clear entire cart
router.delete('/', authenticateToken, cartController.clearCart.bind(cartController));

// Initiate checkout process
router.post('/checkout', authenticateToken, cartController.initiateCheckout.bind(cartController));

export default router;
