import { User } from '@prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';

export class UserService {

  async getAllUsers(): Promise<Partial<User>[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { orders: true }
        }
      }
    });
    return users;
  }

  async getUserById(id: number): Promise<Partial<User> | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        orders: true
      }
    });
  }

  async createUser(data: { name: string; email: string; password: string }): Promise<Partial<User>> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        role: 'customer'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
  }

  async updateUser(id: number, data: { name: string; email: string; password: string }): Promise<Partial<User> | null> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });
  }

  async patchUser(id: number, data: Partial<User>): Promise<Partial<User> | null> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });
  }

  async deleteUser(id: number): Promise<void> {
    await prisma.user.delete({
      where: { id }
    });
  }

  async deleteAllUsers(): Promise<void> {
    await prisma.user.deleteMany();
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
