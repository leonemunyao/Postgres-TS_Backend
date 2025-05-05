import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { PaymentStatus } from '../models/PaymentModel';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Initiates a payment process
   */
  public async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, phone } = req.body;
      const userId = req.user.id;

      if (!orderId || !phone) {
        res.status(400).json({ error: 'Order ID and phone number are required' });
        return;
      }

      const paymentDetails = await this.paymentService.initiatePayment(
        orderId,
        userId,
        {
          email: req.user.email,
          phone,
          name: req.user.name
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
      const userId = req.user.id;

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
      const userId = req.user.id;

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
      if (!req.user.isAdmin) {
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
      const userId = req.user.id;

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
}
