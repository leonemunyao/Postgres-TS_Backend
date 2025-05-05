import { User, Order } from '@prisma/client';

// Defines dashboard statistics
export interface IDashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Order[];
}

// Defines admin user management
export interface IUserManagement {
  users: Partial<User>[];
  total: number;
  page: number;
  totalPages: number;
}

// Defines admin order management
export interface IOrderManagement {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}
