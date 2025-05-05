import { Category } from '@prisma/client';

// Defines the structure for Product data
export interface IProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  categoryId: number;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

// Used when creating a new product (admin only)
export interface ICreateProduct {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  categoryId: number;
}

// Used when updating a product (admin only)
export interface IUpdateProduct {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  stock?: number;
  categoryId?: number;
}

// Response type for grouped products by category
export interface IGroupedProducts {
  categoryId: number;
  categoryName: string;
  products: IProduct[];
}
