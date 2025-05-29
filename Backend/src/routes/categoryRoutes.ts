import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authenticateToken, isAdmin } from '../middleware/auth';

const router = Router();
const categoryController = new CategoryController();

// Get all categories (public)
router.get('/', (req, res) => categoryController.getAllCategories(req, res));

// Get a category by ID (public)
router.get('/:id', (req, res) => categoryController.getCategoryById(req, res));

// Create category (admin only)
router.post('/', authenticateToken, isAdmin, (req, res) => categoryController.createCategory(req, res));

// Update category (admin only)
router.patch('/:id', authenticateToken, isAdmin, (req, res) => categoryController.updateCategory(req, res));

// Delete specific category (admin only)
router.delete('/:id', authenticateToken, isAdmin, (req, res) => categoryController.deleteCategory(req, res));

// Delete all categories (admin only)
router.delete('/', authenticateToken, isAdmin, (req, res) => categoryController.deleteAllCategories(req, res));

export default router;

