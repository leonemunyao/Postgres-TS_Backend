import { PrismaClient, Category, Product } from '@prisma/client';
import { ICreateCategory, IUpdateCategory, ICategoryWithSubCategories } from '../models/CategoryModel';

export class CategoryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new category (admin only)
   * @param data Category creation data
   * @returns Created category
   */
  async createCategory(data: ICreateCategory): Promise<Category> {
    // Check for existing category with same name
    const existingCategory = await this.prisma.category.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } }
    });

    if (existingCategory) {
      throw new Error('Category already exists');
    }

    // If parentId is provided, verify parent exists
    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId }
      });

      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    return this.prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId
      },
      include: {
        parent: true,
        subCategories: true
      }
    });
  }

  /**
   * Get all categories with their sub-categories
   * @returns Array of categories with their sub-categories
   */
  async getAllCategories(): Promise<ICategoryWithSubCategories[]> {
    // Get all categories with their relationships
    const categories = await this.prisma.category.findMany({
      include: {
        parent: true,
        subCategories: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform to include nested sub-categories
    return this.buildCategoryTree(categories);
  }


  

  /**
   * Build category tree with nested sub-categories
   * @param categories Flat array of categories
   * @returns Array of categories with nested sub-categories
   */
  private buildCategoryTree(categories: any[]): ICategoryWithSubCategories[] {
    const categoryMap = new Map();
    const roots: ICategoryWithSubCategories[] = [];

    // First pass: create category objects
    categories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        subCategories: []
      });
    });

    // Second pass: build the tree
    categories.forEach(category => {
      const categoryWithSubs = categoryMap.get(category.id);
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.subCategories.push(categoryWithSubs);
        }
      } else {
        roots.push(categoryWithSubs);
      }
    });

    return roots;
  }

  /**
   * Update a category (admin only)
   * @param id Category ID
   * @param data Update data
   * @returns Updated category
   */
  async updateCategory(id: number, data: IUpdateCategory): Promise<Category> {
    // Check for name conflict if name is being updated
    if (data.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          NOT: { id }
        }
      });

      if (existingCategory) {
        throw new Error('Category name already exists');
      }
    }

    // If parentId is being updated, verify parent exists
    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId }
      });

      if (!parent) {
        throw new Error('Parent category not found');
      }

      // Prevent circular reference
      if (data.parentId === id) {
        throw new Error('Category cannot be its own parent');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data,
      include: {
        parent: true,
        subCategories: true
      }
    });
  }

  /**
   * Delete a specific category (admin only)
   * @param id Category ID
   */
  async deleteCategory(id: number): Promise<void> {
    // Check if category has products or sub-categories
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            products: true,
            subCategories: true
          }
        }
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category._count.products > 0) {
      throw new Error('Cannot delete category with existing products');
    }

    if (category._count.subCategories > 0) {
      throw new Error('Cannot delete category with existing sub-categories');
    }

    await this.prisma.category.delete({
      where: { id }
    });
  }

  /**
   * Delete all categories (admin only)
   */
  async deleteAllCategories(): Promise<void> {
    // First check if any categories have products
    const categoriesWithProducts = await this.prisma.category.findFirst({
      where: {
        products: {
          some: {}
        }
      }
    });

    if (categoriesWithProducts) {
      throw new Error('Cannot delete categories with existing products');
    }

    await this.prisma.category.deleteMany();
  }

  /**
   * Get a category by ID
   * @param id Category ID
   * @returns Category object or null if not found
   */

  async getCategoryById(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id }
    });
  }

  async getCategoryProducts(id: number): Promise<Product[]> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            sizes: true
          }
        }
      }
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category.products;
  }
}