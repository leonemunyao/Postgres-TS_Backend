import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { MpesaService } from '../services/MpesaService';
import { CartService } from '../services/CartService';
import { OrderService } from '../services/OrderService';
import { PaymentStatus } from '../models/PaymentModel';

export class PaymentController {
  private paymentService: PaymentService;
  private mpesaService: MpesaService;
  private cartService: CartService;
  private orderService: OrderService;

  constructor() {
    // Initialize services in the correct order to avoid circular dependencies
    this.orderService = new OrderService(null as any); // Temporary null to break circular dependency
    this.cartService = new CartService(this.orderService);
    this.orderService.setCartService(this.cartService); // Re-initialize with proper CartService
    this.paymentService = new PaymentService(this.cartService);
    this.mpesaService = new MpesaService(this.cartService);
  }

  private ensureUser(req: Request) {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return req.user;
  }

  /**
   * Initiates a payment process
   */
  public async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, phone } = req.body;
      const userId = this.ensureUser(req).id;

      if (!orderId || !phone) {
        res.status(400).json({ error: 'Order ID and phone number are required' });
        return;
      }

      const paymentDetails = await this.paymentService.initiatePayment(
        orderId,
        userId,
        {
          email: this.ensureUser(req).email,
          phone,
          name: this.ensureUser(req).name
        }
      );

      res.json(paymentDetails);
    } catch (error) {
      console.error('Payment initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate payment' });
    }
  }

  /**
   * Confirms a payment
   */
  public async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const userId = this.ensureUser(req).id;

      await this.paymentService.confirmPayment(Number(paymentId), userId);
      res.json({ message: 'Payment confirmed successfully' });
    } catch (error) {
      console.error('Payment confirmation error:', error);
      res.status(500).json({ error: 'Failed to confirm payment' });
    }
  }

  /**
   * Handles payment webhook from Pesapal
   */
  public async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      await this.paymentService.handleWebhook(req.body);
      res.json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Webhook handling error:', error);
      res.status(400).json({ error: 'Failed to process webhook' });
    }
  }

  /**
   * Gets payment status for a specific order
   */
  public async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const userId = this.ensureUser(req).id;

      const payment = await this.paymentService.getPaymentStatus(Number(orderId), userId);
      
      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      res.json(payment);
    } catch (error) {
      console.error('Payment status retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve payment status' });
    }
  }

  /**
   * Gets all payment statuses (admin only)
   */
  public async getAllPaymentStatuses(req: Request, res: Response): Promise<void> {
    try {
      // Check if user is admin
      if (this.ensureUser(req).role !== 'admin') {
        res.status(403).json({ error: 'Unauthorized to view all payments' });
        return;
      }

      const payments = await this.paymentService.getAllPaymentStatuses();
      res.json(payments);
    } catch (error) {
      console.error('Payment statuses retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve payment statuses' });
    }
  }

  /**
   * Processes a refund
   */
  public async processRefund(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;
      const userId = this.ensureUser(req).id;

      if (!reason) {
        res.status(400).json({ error: 'Refund reason is required' });
        return;
      }

      await this.paymentService.processRefund(Number(orderId), userId, reason);
      res.json({ message: 'Refund processed successfully' });
    } catch (error) {
      console.error('Refund processing error:', error);
      res.status(500).json({ error: 'Failed to process refund' });
    }
  }

  /**
   * Initiates an M-Pesa payment
   */
  public async initiateMpesaPayment(req: Request, res: Response): Promise<void> {
    try {
      const { phone, orderId } = req.body;
      const userId = this.ensureUser(req).id;

      if (!phone || !orderId) {
        res.status(400).json({ error: 'Phone number and order ID are required' });
        return;
      }

      // Get order details
      const order = await this.orderService.getOrderById(orderId);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.userId !== userId) {
        res.status(403).json({ error: 'Unauthorized to pay for this order' });
        return;
      }

      if (order.status !== 'pending') {
        res.status(400).json({ error: 'Order is not in pending status' });
        return;
      }

      // Initiate STK Push with order details
      const stkPushResponse = await this.mpesaService.initiateSTKPush(
        phone,
        order.total,
        order.id
      );

      res.json({
        message: 'STK Push initiated successfully',
        orderId: order.id,
        checkoutRequestId: stkPushResponse.CheckoutRequestID,
        customerMessage: stkPushResponse.CustomerMessage
      });
    } catch (error) {
      console.error('M-Pesa payment initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate M-Pesa payment' });
    }
  }

  /**
   * Handles M-Pesa callback
   */
  public async handleMpesaCallback(req: Request, res: Response): Promise<void> {
    try {
      await this.mpesaService.handleCallback(req.body);
      res.json({ message: 'Callback processed successfully' });
    } catch (error) {
      console.error('M-Pesa callback handling error:', error);
      res.status(400).json({ error: 'Failed to process M-Pesa callback' });
    }
  }
}
