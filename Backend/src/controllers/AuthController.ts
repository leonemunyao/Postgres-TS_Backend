import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/AuthService';
import { validators } from '../utils/validators';

const prisma = new PrismaClient();

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register new user
   */
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      // Validate input
      if (!name || !email || !password) {
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      // Validate email format
      if (!validators.isValidEmail(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      const { user, token } = await this.authService.registerUser({
        name,
        email,
        password
      });

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }

  /**
   * Login user
   */
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await this.authService.loginUser(email, password);

      if ('error' in result) {
        res.status(401).json({ error: result.error });
        return;
      }

      res.json({
        message: 'Login successful',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }

  /**
   * Logout user
   */
  public async logout(req: Request, res: Response): Promise<void> {
    try {
      // Client-side token removal
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  }

  /**
   * Request password reset
   */
  public async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      await this.authService.requestPasswordReset(email);
      res.json({ message: 'Password reset email sent' });
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Failed to process reset request' });
    }
  }

  /**
   * Reset password
   */
  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      await this.authService.resetPassword(token, newPassword);
      res.json({ message: 'Password reset successful' });
    } catch (error: any) {
      if (error.message === 'Invalid or expired reset token') {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
}
