// Defines search parameters
export interface ISearchParams {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'best_selling';
  page?: number;
  limit?: number;
}

// Defines search results
export interface ISearchResults<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Defines search suggestions
export interface ISearchSuggestion {
  id: number;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
}

// Defines available filters
export interface ISearchFilters {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  stockStatus: {
    inStock: number;
    outOfStock: number;
  };
}

// Defines sorting options
export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'best_selling';
