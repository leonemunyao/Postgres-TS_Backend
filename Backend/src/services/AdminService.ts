import { PrismaClient, User, Order } from '@prisma/client';

export class AdminService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Getting all the users

  async getAllUsers(): Promise<Partial<User>[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { orders: true }
        }
      }
    });
  }

  // Getting the admin users

  async getAdminUsers(): Promise<Partial<User>[]> {
    return this.prisma.user.findMany({
      where: {
        role: 'admin'
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });
  }

  // Getting the user by id

  async findUserById(userId: number): Promise<Partial<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return user;
  }

  // Checking if user has orders

  async userHasOrders(userId: number): Promise<boolean> {
    const orderCount = await this.prisma.order.count({
      where: { userId }
    });
    return orderCount > 0;
  }

  // Updating order status

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          }
        },
        shipping: true,
        payment: true
      }
    });
  }

  // Deleting the a specific user

  async deleteUser(userId: number): Promise<string> {
    const user = await this.findUserById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      throw new Error('Cannot delete admin user');
    }

    // Check if user has any orders
    const orderCount = await this.prisma.order.count({
      where: { userId: userId }
    });

    if (orderCount > 0) {
      throw new Error('Cannot delete user with existing orders');
    }

    await this.prisma.user.delete({
      where: { id: userId }
    });

    return `User ${user.name} (ID: ${userId}) has been deleted successfully`;
  }



  // Updating users role

  async updateUserRole(userId: number, role: 'admin' | 'customer'): Promise<Partial<User>> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });
  }


  // Getting the orders
  async getAllOrders(status?: string, page: number = 1, limit: number = 10): Promise<{
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: true
            }
          },
          shipping: true,
          payment: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      this.prisma.order.count({ where })
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    recentOrders: Order[];
  }> {
    const [totalUsers, totalOrders, payments, recentOrders] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.payment.findMany({
        where: {
          status: 'completed'
        },
        select: {
          amount: true
        }
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalUsers,
      totalOrders,
      totalRevenue,
      recentOrders
    };
  }
}
