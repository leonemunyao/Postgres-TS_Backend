import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/AuthService';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Verify JWT token middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
       res.status(401).json({ error: 'Access token is required' });
       return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await prisma.user.findUnique({
      where: { id: (decoded as any).userId }
    });

    if (!user) {
       res.status(404).json({ error: 'User not found' });
       return;
    }

    req.user = user;
    next();
  } catch (error) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
  }
};

// Check if user is admin middleware
export const isAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
       res.status(401).json({ error: 'Authentication required' });
       return;
    }

    if (req.user.role !== 'admin') {
       res.status(403).json({ error: 'Admin access required' });
       return;
    }

    next();
  } catch (error) {
     res.status(500).json({ error: 'Error checking admin status' });
     return;
  }
};

// Chexk for blacklisted tokens middleware
export async function checkTokenBlacklist(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next();
    }

    const authService = new AuthService();
    const isBlacklisted = await authService.isTokenBlacklisted(token);

    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been invalidated' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking token status' });
  }
};

