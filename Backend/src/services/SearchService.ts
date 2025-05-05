import { PrismaClient, Product } from '@prisma/client';
import { 
  ISearchParams, 
  ISearchResults, 
  ISearchSuggestion, 
  ISearchFilters,
  SortOption 
} from '../models/SearchModel';

export class SearchService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Search products with filters and sorting
   */
  async searchProducts(params: ISearchParams): Promise<ISearchResults<Product>> {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'newest',
      page = 1,
      limit = 10
    } = params;

    // Build where clause
    const where: any = {};

    // Text search
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    // Category filter
    if (category) {
      where.category = {
        name: { equals: category, mode: 'insensitive' }
      };
    }

    // Price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Stock status
    if (inStock !== undefined) {
      where.stock = inStock ? { gt: 0 } : { equals: 0 };
    }

    // Build sort object
    const orderBy: any = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy.price = 'asc';
        break;
      case 'price_desc':
        orderBy.price = 'desc';
        break;
      case 'best_selling':
        orderBy.orderItems = {
          _count: 'desc'
        };
        break;
      default: // newest
        orderBy.createdAt = 'desc';
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Execute search query
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          category: true
        }
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      items: products,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    };
  }

  /**
   * Get search suggestions as user types
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<ISearchSuggestion[]> {
    if (!query) return [];

    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        category: {
          select: {
            name: true
          }
        },
        price: true,
        imageUrl: true
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category.name,
      price: product.price,
      imageUrl: product.imageUrl
    }));
  }

  /**
   * Get available filters for search
   */
  async getAvailableFilters(): Promise<ISearchFilters> {
    const [categories, priceRange, stockStatus] = await Promise.all([
      this.prisma.category.findMany(),
      this.prisma.product.aggregate({
        _min: { price: true },
        _max: { price: true }
      }),
      this.prisma.product.groupBy({
        by: ['stock'],
        _count: true
      })
    ]);

    const inStockCount = stockStatus.find(s => s.stock > 0)?._count || 0;
    const outOfStockCount = stockStatus.find(s => s.stock === 0)?._count || 0;

    return {
      categories: categories.map(c => c.name),
      priceRange: {
        min: priceRange._min.price || 0,
        max: priceRange._max.price || 0
      },
      stockStatus: {
        inStock: inStockCount,
        outOfStock: outOfStockCount
      }
    };
  }
}