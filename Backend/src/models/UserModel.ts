import { Order } from '@prisma/client';

// Defines the structure for User data
export interface IUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'customer';
  createdAt: Date;
  updatedAt: Date;
  orders?: Order[];
}

// Used when creating a new user
export interface ICreateUser {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'customer';
}

// Used when updating user details
export interface IUpdateUser {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'customer';
}
