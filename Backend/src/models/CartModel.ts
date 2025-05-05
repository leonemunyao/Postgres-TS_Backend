import { Product } from '@prisma/client';

// Defines the structure for Cart data
export interface ICart {
  id: number;
  userId: number;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Defines the structure for Cart Item data
export interface ICartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product?: Product;
}

// Used when adding items to cart
export interface IAddToCart {
  productId: number;
  quantity: number;
}

// Used when updating cart item quantity
export interface IUpdateCartItem {
  quantity: number;
}

// Used for checkout process
export interface ICheckoutData {
  total: number;
  items: ICartItem[];
}

// Used for cart response with product details
export interface ICartResponse extends ICart {
  total: number;
  items: (ICartItem & {
    product: Product;
  })[];
}
