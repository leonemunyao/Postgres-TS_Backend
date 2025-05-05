import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';
import { ICreateProduct, IUpdateProduct } from '../models/ProductModel';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Create new product (admin only)
   * @param req Express request object
   * @param res Express response object
   */
  public async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const productData = req.body as ICreateProduct;
      const product = await this.productService.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('Create product error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Missing required fields')) {
          res.status(400).json({ error: error.message });
        } else if (error.message.includes('Invalid data types')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to create product' });
        }
      } else {
        res.status(500).json({ error: 'Failed to create product' });
      }
    }
  }

  /**
   * Get all products grouped by category
   * @param req Express request object
   * @param res Express response object
   */
  public async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = await this.productService.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }

  /**
   * Get a single product by ID
   * @param req Express request object
   * @param res Express response object
   */
  public async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await this.productService.getProductById(parseInt(id));
      
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      
      res.json(product);
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  /**
   * Update a product (admin only)
   * @param req Express request object
   * @param res Express response object
   */
  public async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body as IUpdateProduct;
      
      const product = await this.productService.updateProduct(parseInt(id), updateData);
      res.json(product);
    } catch (error) {
      console.error('Update product error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Invalid data types')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to update product' });
        }
      } else {
        res.status(500).json({ error: 'Failed to update product' });
      }
    }
  }

  /**
   * Delete a product (admin only)
   * @param req Express request object
   * @param res Express response object
   */
  public async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.productService.deleteProduct(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }
}
