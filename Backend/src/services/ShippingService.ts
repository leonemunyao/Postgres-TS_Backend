import { PrismaClient, Shipping } from '@prisma/client';
import { OrderService } from './OrderService';
import { CartService } from './CartService';
import { 
  ICreateShipping, 
  IUpdateShipping, 
  ShippingStatus 
} from '../models/ShippingModel';

export class ShippingService {
  private prisma: PrismaClient;
  private orderService: OrderService;

  constructor(cartService: CartService) {
    this.prisma = new PrismaClient();
    this.orderService = new OrderService(cartService);
  }

  /**
   * Creates shipping details for an order
   * @param data - Shipping details to create
   * @param userId - ID of the user creating the shipping details
   */
  async createShipping(data: ICreateShipping, userId: number): Promise<Shipping> {
    // Verify order belongs to user
    const order = await this.orderService.getOrderById(data.orderId, userId);
    if (!order) {
      throw new Error('Order not found or unauthorized');
    }

    // Check if shipping details already exist
    const existingShipping = await this.prisma.shipping.findFirst({
      where: { orderId: data.orderId }
    });

    if (existingShipping) {
      throw new Error('Shipping details already exist for this order');
    }

    // Create shipping details
    const shipping = await this.prisma.shipping.create({
      data: {
        ...data,
        status: 'pending'
      }
    });

    return shipping;
  }

  /**
   * Gets shipping details for a specific order
   * @param orderId - ID of the order
   * @param userId - ID of the user requesting the details
   */
  async getShippingDetails(orderId: number, userId: number): Promise<Shipping | null> {
    const shipping = await this.prisma.shipping.findFirst({
      where: {
        orderId,
        order: { userId }
      }
    });

    if (!shipping) {
      throw new Error('Shipping details not found');
    }

    return shipping;
  }

  /**
   * Gets shipping details based on status (admin only)
   * @param status - Shipping status to filter by
   */
  async getShippingByStatus(status: ShippingStatus): Promise<Shipping[]> {
    return this.prisma.shipping.findMany({
      where: { status },
      include: {
        order: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Updates shipping details for an order
   * @param orderId - ID of the order
   * @param userId - ID of the user updating the details
   * @param data - Updated shipping details
   */
  async updateShippingDetails(
    orderId: number, 
    userId: number, 
    data: IUpdateShipping
  ): Promise<Shipping> {
    const shipping = await this.prisma.shipping.findFirst({
      where: {
        orderId,
        order: { userId }
      }
    });

    if (!shipping) {
      throw new Error('Shipping details not found');
    }

    if (shipping.status !== 'pending') {
      throw new Error('Cannot update shipping details after order has been shipped');
    }

    return this.prisma.shipping.update({
      where: { id: shipping.id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Updates shipping status (admin only)
   * @param shippingId - ID of the shipping record
   * @param status - New shipping status
   * @param trackingNumber - Optional tracking number
   */
  async updateShippingStatus(
    shippingId: number,
    status: ShippingStatus,
    trackingNumber?: string
  ): Promise<Shipping> {
    const shipping = await this.prisma.shipping.findUnique({
      where: { id: shippingId }
    });

    if (!shipping) {
      throw new Error('Shipping details not found');
    }

    // Validate status transition
    const validTransitions: Record<ShippingStatus, ShippingStatus[]> = {
      pending: ['shipped'],
      shipped: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
      delivered: []
    };

    if (!validTransitions[shipping.status as ShippingStatus].includes(status)) {
      throw new Error('Invalid status transition');
    }

    return this.prisma.shipping.update({
      where: { id: shippingId },
      data: {
        status,
        trackingNumber,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Gets all shipping details (admin only)
   */
  async getAllShipping(): Promise<Shipping[]> {
    return this.prisma.shipping.findMany({
      include: {
        order: {
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Deletes shipping details for an order
   * @param orderId - ID of the order
   * @param userId - ID of the user deleting the details
   */
  async deleteShipping(orderId: number, userId: number): Promise<void> {
    const shipping = await this.prisma.shipping.findFirst({
      where: {
        orderId,
        order: { userId }
      }
    });

    if (!shipping) {
      throw new Error('Shipping details not found');
    }

    if (shipping.status !== 'pending') {
      throw new Error('Cannot delete shipping details after order has been shipped');
    }

    await this.prisma.shipping.delete({
      where: { id: shipping.id }
    });
  }

  /**
   * Validates shipping address
   * @param address - Shipping address
   * @param city - City
   * @param postalCode - Postal code
   */
  async validateAddress(address: string, city: string, postalCode: string): Promise<boolean> {
    // Add address validation logic here
    return true;
  }

  /**
   * Calculates shipping cost based on city
   * @param city - City to calculate shipping cost for
   */
  async calculateShippingCost(city: string): Promise<number> {
    const shippingRates: { [key: string]: number } = {
      'Nairobi': 200,
      'Mombasa': 500,
      'Kisumu': 450,
      'default': 600
    };

    return shippingRates[city] || shippingRates.default;
  }
}
