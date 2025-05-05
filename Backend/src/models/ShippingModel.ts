// Defines the structure for Shipping data
export interface IShipping {
  id: number;
  orderId: number;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  status: ShippingStatus;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Used when creating shipping details
export interface ICreateShipping {
  orderId: number;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  estimatedDelivery?: Date;
}

// Used when updating shipping details
export interface IUpdateShipping {
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  estimatedDelivery?: Date;
}

// Shipping status types
export type ShippingStatus = 'pending' | 'shipped' | 'out_for_delivery' | 'delivered';

// Shipping rates by city
export interface IShippingRates {
  [city: string]: number;
}

