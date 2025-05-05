import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { OrderStatus } from '../models/OrderModel';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  public async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const orderData = req.body;
      
      const order = await this.orderService.createOrder(userId, orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error('Create order error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Insufficient stock')) {
          res.status(400).json({ error: error.message });
        } else if (error.message.includes('Product not found')) {
          res.status(404).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to create order' });
        }
      } else {
        res.status(500).json({ error: 'Failed to create order' });
      }
    }
  }

  public async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const orders = await this.orderService.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  public async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const orders = await this.orderService.getUserOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error('Get user orders error:', error);
      res.status(500).json({ error: 'Failed to fetch user orders' });
    }
  }

  public async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.isAdmin;

      const order = await this.orderService.getOrderById(parseInt(id), isAdmin ? undefined : userId);
      
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (!isAdmin && order.userId !== userId) {
        res.status(403).json({ error: 'Unauthorized to view this order' });
        return;
      }

      res.json(order);
    } catch (error) {
      console.error('Get order error:', error);
      if (error instanceof Error && error.message === 'Order not found') {
        res.status(404).json({ error: 'Order not found' });
      } else {
        res.status(500).json({ error: 'Failed to fetch order' });
      }
    }
  }

  public async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        res.status(400).json({ error: 'Invalid order status' });
        return;
      }

      const updatedOrder = await this.orderService.updateOrderStatus(parseInt(id), status as OrderStatus);
      res.json(updatedOrder);
    } catch (error) {
      console.error('Update order status error:', error);
      if (error instanceof Error) {
        if (error.message === 'Order not found') {
          res.status(404).json({ error: 'Order not found' });
        } else if (error.message === 'Cannot update status of a cancelled order') {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to update order status' });
        }
      } else {
        res.status(500).json({ error: 'Failed to update order status' });
      }
    }
  }

  public async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const cancelledOrder = await this.orderService.cancelOrder(parseInt(id), userId);
      res.json(cancelledOrder);
    } catch (error) {
      console.error('Cancel order error:', error);
      if (error instanceof Error) {
        if (error.message === 'Order not found or cannot be cancelled') {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to cancel order' });
        }
      } else {
        res.status(500).json({ error: 'Failed to cancel order' });
      }
    }
  }

  public async deleteOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.orderService.deleteOrder(parseInt(id));
      res.status(204).send();
    } catch (error) {
      console.error('Delete order error:', error);
      if (error instanceof Error && error.message === 'Order not found') {
        res.status(404).json({ error: 'Order not found' });
      } else {
        res.status(500).json({ error: 'Failed to delete order' });
      }
    }
  }

  public async deleteAllOrders(req: Request, res: Response): Promise<void> {
    try {
      await this.orderService.deleteAllOrders();
      res.status(204).send();
    } catch (error) {
      console.error('Delete all orders error:', error);
      res.status(500).json({ error: 'Failed to delete all orders' });
    }
  }
}
