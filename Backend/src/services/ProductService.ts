import { PrismaClient, Product } from '@prisma/client';
import { ICreateProduct, IUpdateProduct, IGroupedProducts } from '../models/ProductModel';

export class ProductService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new product (admin only)
   * @param data Product creation data
   * @returns Created product
   */
  async createProduct(data: ICreateProduct): Promise<Product> {
    // Validate required fields
    if (!data.name || !data.description || !data.price || !data.imageUrl || data.stock === undefined || !data.categoryId) {
      throw new Error('Missing required fields');
    }

    // Validate data types
    if (typeof data.price !== 'number' || typeof data.stock !== 'number') {
      throw new Error('Invalid data types for price or stock');
    }

    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        stock: data.stock,
        categoryId: data.categoryId
      },
      include: {
        category: true
      }
    });
  }

  /**
   * Get all products grouped by category
   * @returns Array of products grouped by category
   */
  async getAllProducts(): Promise<IGroupedProducts[]> {
    // Get all products with their categories
    const products = await this.prisma.product.findMany({
        include: {
        category: true
        },
        orderBy: {
        categoryId: 'asc'
        }
    });

    // Group products by category
    const groupedProducts = products.reduce((acc: IGroupedProducts[], product) => {
      const existingGroup = acc.find(group => group.categoryId === product.categoryId);
      
      if (existingGroup) {
        existingGroup.products.push(product);
      } else {
        acc.push({
          categoryId: product.categoryId,
          categoryName: product.category.name,
          products: [product]
        });
      }
      
      return acc;
    }, []);

    return groupedProducts;
  }

  /**
   * Get a single product by ID
   * @param id Product ID
   * @returns Product or null if not found
   */
  async getProductById(id: number): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true
      }
    });
  }

  /**
   * Update a product (admin only)
   * @param id Product ID
   * @param data Update data
   * @returns Updated product
   */
  async updateProduct(id: number, data: IUpdateProduct): Promise<Product> {
    // Validate data types if provided
    if (data.price !== undefined && typeof data.price !== 'number') {
      throw new Error('Invalid price type');
    }
    if (data.stock !== undefined && typeof data.stock !== 'number') {
      throw new Error('Invalid stock type');
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: true
      }
    });
  }

  /**
   * Delete a product (admin only)
   * @param id Product ID
   */
  async deleteProduct(id: number): Promise<void> {
    await this.prisma.product.delete({
      where: { id }
    });
  }

  async updateStock(id: number, quantity: number): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: {
        stock: {
          decrement: quantity
        }
      }
    });
  }

  async checkStock(id: number, quantity: number): Promise<boolean> {
    const product = await this.prisma.product.findUnique({
      where: { id }
    });
    return product ? product.stock >= quantity : false;
  }
}