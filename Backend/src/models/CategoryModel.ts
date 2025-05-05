import { Product } from '@prisma/client';

// Defines the structure for Category data
export interface ICategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  parent?: ICategory;
  subCategories?: ICategory[];
  products?: Product[];
  createdAt: Date;
  updatedAt: Date;
}

// Used when creating a new category
export interface ICreateCategory {
  name: string;
  description?: string;
  parentId?: number;
}

// Used when updating category
export interface IUpdateCategory {
  name?: string;
  description?: string;
  parentId?: number;
}

// Response type for categories with sub-categories
export interface ICategoryWithSubCategories extends Omit<ICategory, 'subCategories'> {
  subCategories: ICategoryWithSubCategories[];
}
