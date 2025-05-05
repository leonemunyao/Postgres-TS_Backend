import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import { ICreateCategory, IUpdateCategory } from '../models/CategoryModel';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Create new category (admin only)
   * @param req Express request object
   * @param res Express response object
   */
  public async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const categoryData = req.body as ICreateCategory;
      const category = await this.categoryService.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Create category error:', error);
      if (error instanceof Error) {
        if (error.message === 'Category already exists') {
          res.status(400).json({ error: error.message });
        } else if (error.message === 'Parent category not found') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to create category' });
        }
      } else {
        res.status(500).json({ error: 'Failed to create category' });
      }
    }
  }

  /**
   * Get all categories with their sub-categories
   * @param req Express request object
   * @param res Express response object
   */
  public async getAllCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await this.categoryService.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  /**
   * Update a category (admin only)
   * @param req Express request object
   * @param res Express response object
   */
  public async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body as IUpdateCategory;
      
      const category = await this.categoryService.updateCategory(parseInt(id), updateData);
      res.json(category);
    } catch (error) {
      console.error('Update category error:', error);
      if (error instanceof Error) {
        if (error.message === 'Category name already exists') {
          res.status(400).json({ error: error.message });
        } else if (error.message === 'Parent category not found') {
          res.status(404).json({ error: error.message });
        } else if (error.message === 'Category cannot be its own parent') {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to update category' });
        }
      } else {
        res.status(500).json({ error: 'Failed to update category' });
      }
    }
  }

  /**
   * Delete a specific category (admin only)
   * @param req Express request object
   * @param res Express response object
   */
  public async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.categoryService.deleteCategory(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error('Delete category error:', error);
      if (error instanceof Error) {
        if (error.message === 'Category not found') {
          res.status(404).json({ error: error.message });
        } else if (error.message.includes('Cannot delete category')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to delete category' });
        }
      } else {
        res.status(500).json({ error: 'Failed to delete category' });
      }
    }
  }

  /**
   * Delete all categories (admin only)
   * @param req Express request object
   * @param res Express response object
   */
  public async deleteAllCategories(req: Request, res: Response): Promise<void> {
    try {
      await this.categoryService.deleteAllCategories();
      res.status(204).send();
    } catch (error) {
      console.error('Delete all categories error:', error);
      if (error instanceof Error && error.message.includes('Cannot delete categories')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete all categories' });
      }
    }
  }
}
