import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const categoryController = new CategoryController();

// Get all categories (public)
router.get('/', categoryController.getAllCategories.bind(categoryController));

// Create category (admin only)
router.post('/', authenticateToken, isAdmin, categoryController.createCategory.bind(categoryController));

// Update category (admin only)
router.patch('/:id', authenticateToken, isAdmin, categoryController.updateCategory.bind(categoryController));

// Delete specific category (admin only)
router.delete('/:id', authenticateToken, isAdmin, categoryController.deleteCategory.bind(categoryController));

// Delete all categories (admin only)
router.delete('/', authenticateToken, isAdmin, categoryController.deleteAllCategories.bind(categoryController));

export default router;
