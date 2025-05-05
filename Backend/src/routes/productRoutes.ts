import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const productController = new ProductController();

// Get all products (public)
router.get('/', productController.getAllProducts.bind(productController));

// Get single product (public)
router.get('/:id', productController.getProductById.bind(productController));

// Create product (admin only)
router.post('/', authenticateToken, isAdmin, productController.createProduct.bind(productController));

// Update product (admin only)
router.patch('/:id', authenticateToken, isAdmin, productController.updateProduct.bind(productController));

// Delete product (admin only)
router.delete('/:id', authenticateToken, isAdmin, productController.deleteProduct.bind(productController));

export default router;
