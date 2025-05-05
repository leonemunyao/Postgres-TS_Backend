import { User, Product } from '@prisma/client';

// Order status types
export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

// Defines the structure for shipping information
export interface IShipping {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Defines the structure for payment information
export interface IPayment {
  id: number;
  amount: number;
  method: string;
  status: string;
  orderId: number;
}

// Defines the structure for Order data
export interface IOrder {
  id: number;
  userId: number;
  status: OrderStatus;
  total: number;
  user?: User;
  items: IOrderItem[];
  shipping?: IShipping;
  payment?: IPayment;
  createdAt: Date;
  updatedAt: Date;
}

// Defines the structure for Order Item data
export interface IOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product?: Product;
}

// Used when creating a new order from cart checkout
export interface ICreateOrder {
  items: {
    productId: number;
    quantity: number;
  }[];
}

// Used when updating order status
export interface IUpdateOrderStatus {
  status: OrderStatus;
}

// Used for order response with full details
export interface IOrderResponse {
  id: number;
  userId: number;
  status: OrderStatus;
  total: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  items: (IOrderItem & {
    product: Product;
  })[];
  createdAt: Date;
  updatedAt: Date;
}
