import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AdminService } from '../services/AdminService';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  /**
   * Get all users
   * @param req Express request object
   * @param res Express response object
   */
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.adminService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  /**
   * Update user role
   * @param req Express request object
   * @param res Express response object
   */
  public async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      const user = await this.adminService.updateUserRole(userId, role);
      res.json(user);
    } catch (error) {
      console.error('Update user role error:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  }

  /**
   * Get all orders
   * @param req Express request object
   * @param res Express response object
   */
  public async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const { status, page = '1', limit = '10' } = req.query;
      const orders = await this.adminService.getAllOrders(
        status as string,
        Number(page),
        Number(limit)
      );
      res.json(orders);
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  /**
   * Delete a user (Admin only)
   * @param req Express request object
   * @param res Express response object
   */
  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const user = await this.adminService.findUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if user has orders
      const hasOrders = await this.adminService.userHasOrders(userId);
      if (hasOrders) {
        res.status(400).json({ error: 'Cannot delete user with existing orders' });
        return;
      }

      await this.adminService.deleteUser(userId);
      res.status(204).send();
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  /**
   * Update Order status
   * @param req Express request object
   * @param res Express response object
   */
  public async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      const order = await this.adminService.updateOrderStatus(orderId, status);
      res.json(order);
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }


  /**
   * Get all admin users
   * @param req Express request object
   * @param res Express response object
   */
  public async getAdminUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.adminService.getAdminUsers();
      res.json(users);
    } catch (error) {
      console.error('Get admin users error:', error);
      res.status(500).json({ error: 'Failed to fetch admin users' });
    }
  }


}
