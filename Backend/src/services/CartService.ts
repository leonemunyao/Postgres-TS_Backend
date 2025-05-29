import { PrismaClient, Cart, CartItem, Product } from '@prisma/client';
import { OrderService } from './OrderService';

export class CartService {
  private prisma: PrismaClient;
  private orderService: OrderService;

  constructor(orderService: OrderService) {
    this.prisma = new PrismaClient();
    this.orderService = orderService;
  }

  public setOrderService(orderService: OrderService): void {
        this.orderService = orderService;
  }

  async getOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.prisma.cart.findFirst({
      where: { userId }
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId }
      });
    }

    return cart;
  }

  async addToCart(userId: number, productId: number, quantity: number): Promise<CartItem> {
    // Check if product exists and has enough stock
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if product exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId
      }
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity
        },
        include: {
          product: true
        }
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        userId,
        productId,
        quantity
      },
      include: {
        product: true
      }
    });
  }

  async getCart(userId: number): Promise<Cart & { items: (CartItem & { product: Product })[] }> {
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    return cart;
  }

  async updateCartItem(userId: number, itemId: number, quantity: number): Promise<CartItem> {
    try {
      const cart = await this.getOrCreateCart(userId);
      
      // Verify item belongs to user's cart
      const cartItem = await this.prisma.cartItem.findFirst({
        where: {
          id: itemId,
          cartId: cart.id
        },
        include: {
          product: true
        }
      });

      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      // Check stock availability
      if (cartItem.product.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      const updatedItem = await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
        include: {
          product: true
        }
      });

      if (!updatedItem) {
        throw new Error('Failed to update cart item');
      }

      return updatedItem;
    } catch (error) {
      console.error('Error in updateCartItem:', error);
      throw error;
    }
  }

  async removeFromCart(userId: number, itemId: number): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    
    // Verify item belongs to user's cart
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id
      }
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId }
    });
  }

  async clearCart(userId: number): Promise<void> {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    });
  }

  async getCartTotal(userId: number): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.items.reduce((total, item) => {
      return total + (item.quantity * item.product.price);
    }, 0);
  }

  async initiateCheckout(userId: number): Promise<{ orderId: number; total: number; items: CartItem[] }> {
    const cart = await this.getCart(userId);
    
    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Create order from cart items
    const order = await this.orderService.createOrder(userId, {
      items: cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    });

    const total = await this.getCartTotal(userId);

    return {
      orderId: order.id,
      total,
      items: cart.items
    };
  }
}
