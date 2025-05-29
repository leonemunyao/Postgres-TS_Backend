import { PrismaClient, Order, OrderItem } from '@prisma/client';
import { CartService } from './CartService';
import { ProductService } from './ProductService';
import { ICreateOrder, IUpdateOrderStatus, OrderStatus } from '../models/OrderModel';

export class OrderService {
  private prisma: PrismaClient;
  private cartService: CartService;
  private productService: ProductService;

  constructor(cartService: CartService) {
    this.prisma = new PrismaClient();
    this.cartService = cartService;
    this.productService = new ProductService();
  }

  public setCartService(cartService: CartService) {
    this.cartService = cartService;
  }

  async createOrder(userId: number, orderData: ICreateOrder): Promise<Order> {
    return this.prisma.$transaction(async (prisma) => {
      // Validate stock for all items
      for (const item of orderData.items) {
        const hasStock = await this.productService.checkStock(item.productId, item.quantity);
        if (!hasStock) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
      }

      // Create order
      const itemsData = await Promise.all(orderData.items.map(async (item) => {
        const product = await this.productService.getProductById(item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        };
      }));

      const total = itemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const order = await prisma.order.create({
        data: {
          userId,
          status: 'pending',
          total,
          items: {
            create: itemsData
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Update stock
      for (const item of orderData.items) {
        await this.productService.updateStock(item.productId, item.quantity);
      }

      // Clear cart after successful order
      await this.cartService.clearCart(userId);

      return order;
    });
  }

  async getAllOrders(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getOrderById(orderId: number, userId?: number): Promise<Order | null> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(userId && { userId })
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'cancelled') {
      throw new Error('Cannot update status of a cancelled order');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async cancelOrder(orderId: number, userId: number): Promise<Order> {
    return this.prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          status: 'pending'
        },
        include: {
          items: true
        }
      });

      if (!order) {
        throw new Error('Order not found or cannot be cancelled');
      }

      // Restore stock
      for (const item of order.items) {
        await this.productService.updateStock(
          item.productId,
          -item.quantity // Negative to add back to stock
        );
      }

      return prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          updatedAt: new Date()
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    });
  }

  async deleteOrder(orderId: number): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    await this.prisma.order.delete({
      where: { id: orderId }
    });
  }

  async deleteAllOrders(): Promise<void> {
    await this.prisma.order.deleteMany();
  }
}
