import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { createClient } from 'redis';
import { AppError } from '../utils/errorHandlers';

export class AuthService {
  private prisma: PrismaClient;
  private transporter: nodemailer.Transporter;
  private redisClient: ReturnType<typeof createClient>;

  constructor() {
    this.prisma = new PrismaClient();
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.redisClient.connect().catch(console.error);
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Register new user
   */
  async registerUser(data: { name: string; email: string; password: string }): Promise<{
    user: User;
    token: string;
  }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'customer'
      }
    });

    const token = this.generateToken(user.id);

    return { user, token };
  }

  /**
   * Login user
   */
  async loginUser(email: string, password: string): Promise<{
    token: string;
    user: Partial<User>;
  } | {
    error: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { error: 'Invalid credentials' };
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return { error: 'Invalid credentials' };
    }

    const token = this.generateToken(user.id);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };
  }


  /**
   * Logout User
   */
  async logoutUser(token: string): Promise<void> {
    try {
      // Get token expiration from JWT
      const decoded = jwt.decode(token) as { exp: number };
      if (!decoded?.exp) {
        throw new Error('Invalid token');
      }

      // Calculate TTL (Time To Live) in seconds
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl <= 0) {
        return; // Token already expired
      }

      // Add token to blacklist with expiration
      await this.redisClient.setEx(`bl_${token}`, ttl, 'true');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.redisClient.get(`bl_${token}`);
    return Boolean(blacklisted);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 3600000) // 1 hour
      }
    });

    await this.sendPasswordResetEmail(email, resetToken);
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };

      const user = await this.prisma.user.findFirst({
        where: {
          id: decoded.userId,
          resetToken: token,
          resetTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      });
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: number): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }

  /**
   * Send password reset email
   */
  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset</p>
        <p>Click this link to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `
    });
  }

  /**
   * Cleanup method for closing connections
   */
  async cleanup(): Promise<void> {
    await this.redisClient.quit();
    await this.prisma.$disconnect();
  }
}
