import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';

const router = Router();
const searchController = new SearchController();

// Search products with filters and sorting
router.get('/', searchController.searchProducts.bind(searchController));

// Get search suggestions
router.get('/suggestions', searchController.getSearchSuggestions.bind(searchController));

// Get available filters
router.get('/filters', searchController.getFilters.bind(searchController));

export default router;
