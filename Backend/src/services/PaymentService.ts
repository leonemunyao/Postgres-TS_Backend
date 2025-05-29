import { PrismaClient, Payment } from '@prisma/client';
import { OrderService } from './OrderService';
import { CartService } from './CartService';
import axios from 'axios';
import { 
  IPesapalPaymentRequest, 
  IPesapalPaymentResponse, 
  IPesapalWebhookPayload,
  PaymentStatus 
} from '../models/PaymentModel';

// Add interface for Pesapal auth response
interface PesapalAuthResponse {
  token: string;
  expiryDate: string;
  status: string;
}

export class PaymentService {
  private prisma: PrismaClient;
  private orderService: OrderService;
  private pesapalConfig: {
    consumerKey: string;
    consumerSecret: string;
    baseUrl: string;
    callbackUrl: string;
  };

  constructor(cartService: CartService) {
    this.prisma = new PrismaClient();
    this.orderService = new OrderService(cartService);
    this.pesapalConfig = {
      consumerKey: process.env.PESAPAL_CONSUMER_KEY!,
      consumerSecret: process.env.PESAPAL_CONSUMER_SECRET!,
      baseUrl: process.env.PESAPAL_API_URL || 'https://pay.pesapal.com/v3',
      callbackUrl: `${process.env.BACKEND_URL}/api/payments/webhook`
    };
  }

  /**
   * Initiates a payment process with Pesapal
   * @param orderId - The ID of the order to be paid
   * @param userId - The ID of the user making the payment
   * @param userDetails - User details required for payment
   * @returns Payment details including redirect URL
   */
  async initiatePayment(
    orderId: number, 
    userId: number, 
    userDetails: { email: string; phone: string; name: string }
  ): Promise<{ paymentId: number; redirectUrl: string }> {
    // Get order details and validate
    const order = await this.orderService.getOrderById(orderId, userId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Order is not in pending status');
    }

    // Get Pesapal auth token
    const token = await this.getPesapalToken();

    // Prepare payment request
    const paymentRequest: IPesapalPaymentRequest = {
      amount: order.total,
      currency: 'KES',
      description: `Payment for order #${orderId}`,
      callback_url: this.pesapalConfig.callbackUrl,
      notification_id: `NOTIFY-${orderId}`,
      merchant_reference: orderId.toString(),
      billing_address: {
        email_address: userDetails.email,
        phone_number: userDetails.phone,
        country_code: 'KE',
        first_name: userDetails.name,
        last_name: ''
      }
    };

    // Submit payment request to Pesapal
    const response = await axios.post<IPesapalPaymentResponse>(
      `${this.pesapalConfig.baseUrl}/api/Transactions/SubmitOrderRequest`,
      paymentRequest,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        amount: order.total,
        currency: 'KES',
        status: 'pending',
        paymentMethod: 'pesapal',
        transactionId: response.data.order_tracking_id
      }
    });

    return {
      paymentId: payment.id,
      redirectUrl: response.data.redirect_url
    };
  }

  /**
   * Confirms a payment and updates order status
   * @param paymentId - The ID of the payment to confirm
   * @param userId - The ID of the user confirming the payment
   */
  async confirmPayment(paymentId: number, userId: number): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId },
      include: { order: true }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.order.userId !== userId) {
      throw new Error('Unauthorized to confirm this payment');
    }

    if (payment.status !== 'pending') {
      throw new Error('Payment is not in pending status');
    }

    // Update payment and order status
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'completed' }
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'paid' }
      })
    ]);
  }

  /**
   * Handles payment webhook from Pesapal
   * @param payload - Webhook payload from Pesapal
   */
  async handleWebhook(payload: IPesapalWebhookPayload): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: payload.order_tracking_id }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Update payment status based on webhook
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: payload.payment_status,
          updatedAt: new Date()
        }
      }),
      this.prisma.order.update({
        where: { id: payment.orderId },
        data: { 
          status: payload.payment_status === 'completed' ? 'paid' : 'pending'
        }
      })
    ]);
  }

  /**
   * Gets payment status for a specific order
   * @param orderId - The ID of the order
   * @param userId - The ID of the user requesting the status
   */
  async getPaymentStatus(orderId: number, userId: number): Promise<Payment | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { 
        orderId,
        order: { userId }
      }
    });

    return payment;
  }

  /**
   * Gets all payment statuses (admin only)
   */
  async getAllPaymentStatuses(): Promise<Payment[]> {
    return this.prisma.payment.findMany({
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
   * Processes a refund for a cancelled order
   * @param orderId - The ID of the order to refund
   * @param userId - The ID of the user requesting the refund
   * @param reason - Reason for the refund
   */
  async processRefund(orderId: number, userId: number, reason: string): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { 
        orderId,
        order: { userId }
      }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }

    // Update payment status to refunded
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: 'refunded',
        refundReason: reason,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Gets Pesapal authentication token
   */
  private async getPesapalToken(): Promise<string> {
    const response = await axios.post<PesapalAuthResponse>(
      `${this.pesapalConfig.baseUrl}/api/Auth/RequestToken`,
      {
        consumer_key: this.pesapalConfig.consumerKey,
        consumer_secret: this.pesapalConfig.consumerSecret
      }
    );

    return response.data.token;
  }

  /**
   * Gets order details for payment
   * @param orderId - The ID of the order
   * @param userId - The ID of the user requesting the details
   */
  async getOrderDetails(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { 
        id: orderId,
        userId
      }
    });

    return order;
  }

  /**
   * Creates a new payment record
   */
  public async createPayment(
    orderId: number,
    amount: number,
    paymentMethod: string,
    status: PaymentStatus = 'pending',
    currency: string = 'KES'
  ) {
    return this.prisma.payment.create({
      data: {
        orderId,
        amount,
        currency,
        paymentMethod,
        status,
        createdAt: new Date()
      }
    });
  }

  /**
   * Updates payment status
   */
  public async updatePaymentStatus(
    orderId: number,
    status: PaymentStatus
  ) {
    return this.prisma.payment.update({
      where: { orderId },
      data: {
        status,
        updatedAt: status === 'completed' ? new Date() : undefined
      }
    });
  }

  /**
   * Handles successful payment
   */
  public async handleSuccessfulPayment(orderId: number) {
    // Update payment status
    await this.updatePaymentStatus(orderId, 'completed');

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'paid' }
    });

    // Clear the user's cart
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true }
    });

    if (order) {
      await this.prisma.cartItem.deleteMany({
        where: { userId: order.userId }
      });
    }
  }

  /**
   * Handles failed payment
   */
  public async handleFailedPayment(orderId: number) {
    // Update payment status
    await this.updatePaymentStatus(orderId, 'failed');

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'payment_failed' }
    });
  }
}
