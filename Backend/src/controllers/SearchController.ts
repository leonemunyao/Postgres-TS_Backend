import { Request, Response } from 'express';
import { SearchService } from '../services/SearchService';
import { ISearchParams } from '../models/SearchModel';

export class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  /**
   * Search products with filters and sorting
   */
  public async searchProducts(req: Request, res: Response): Promise<void> {
    try {
      const searchParams: ISearchParams = {
        q: req.query.q as string,
        category: req.query.category as string,
        minPrice: req.query.minPrice as string,
        maxPrice: req.query.maxPrice as string,
        inStock: req.query.inStock === 'true',
        sortBy: req.query.sortBy as ISearchParams['sortBy'],
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10
      };

      const results = await this.searchService.searchProducts(searchParams);
      res.json(results);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to perform search' });
    }
  }

  /**
   * Get search suggestions as user types
   */
  public async getSearchSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const limit = Number(req.query.limit) || 5;

      if (!query) {
        res.json([]);
        return;
      }

      const suggestions = await this.searchService.getSearchSuggestions(query, limit);
      res.json(suggestions);
    } catch (error) {
      console.error('Search suggestions error:', error);
      res.status(500).json({ error: 'Failed to get search suggestions' });
    }
  }

  /**
   * Get available filters for search
   */
  public async getFilters(req: Request, res: Response): Promise<void> {
    try {
      const filters = await this.searchService.getAvailableFilters();
      res.json(filters);
    } catch (error) {
      console.error('Get filters error:', error);
      res.status(500).json({ error: 'Failed to retrieve filters' });
    }
  }
}
