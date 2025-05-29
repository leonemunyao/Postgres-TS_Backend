import { Request, Response } from 'express';
import { CartService } from '../services/CartService';
import { OrderService } from '../services/OrderService';

export class CartController {
  private cartService: CartService;
  constructor() {
    this.cartService = new CartService(null as unknown as OrderService);
    const orderService = new OrderService(this.cartService);
    this.cartService.setOrderService(orderService);
  }
  

  private ensureUser(req: Request) {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return req.user;
  }

  public async addToCart(req: Request, res: Response): Promise<void> {
    try {
      const { productId, quantity } = req.body;
      const userId = this.ensureUser(req).id;

      if (!productId || !quantity || quantity < 1) {
        res.status(400).json({ error: 'Invalid product or quantity' });
        return;
      }

      const cartItem = await this.cartService.addToCart(userId, productId, quantity);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error('Add to cart error:', error);
      if (error instanceof Error) {
        if (error.message === 'Product not found') {
          res.status(404).json({ error: 'Product not found' });
        } else if (error.message === 'Insufficient stock') {
          res.status(400).json({ error: 'Insufficient stock' });
        } else {
          res.status(500).json({ error: 'Failed to add item to cart' });
        }
      } else {
        res.status(500).json({ error: 'Failed to add item to cart' });
      }
    }
  }

  public async getCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.ensureUser(req).id;
      const cart = await this.cartService.getCart(userId);
      res.json(cart);
    } catch (error) {
      console.error('Get cart error:', error);
      if (error instanceof Error) {
        if (error.message === 'Cart not found') {
          res.status(404).json({ error: 'Cart not found' });
        } else {
          res.status(500).json({ error: 'Failed to get cart' });
        }
      } else {
        res.status(500).json({ error: 'Failed to get cart' });
      }
    }
  }

  public async updateCartItem(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const userId = this.ensureUser(req).id;

      if (!quantity || quantity < 1) {
        res.status(400).json({ error: 'Invalid quantity' });
        return;
      }

      const updatedItem = await this.cartService.updateCartItem(userId, parseInt(itemId), quantity);
      res.json(updatedItem);
    } catch (error) {
      console.error('Update cart item error:', error);
      if (error instanceof Error) {
        if (error.message === 'Cart item not found') {
          res.status(404).json({ error: 'Cart item not found' });
        } else if (error.message === 'Insufficient stock') {
          res.status(400).json({ error: 'Insufficient stock' });
        } else {
          res.status(500).json({ error: 'Failed to update cart item' });
        }
      } else {
        res.status(500).json({ error: 'Failed to update cart item' });
      }
    }
  }

  public async removeFromCart(req: Request, res: Response): Promise<void> {
    try {
      const { itemId } = req.params;
      const userId = this.ensureUser(req).id;

      await this.cartService.removeFromCart(userId, parseInt(itemId));
      res.status(204).send();
    } catch (error) {
      console.error('Remove from cart error:', error);
      if (error instanceof Error) {
        if (error.message === 'Cart item not found') {
          res.status(404).json({ error: 'Cart item not found' });
        } else {
          res.status(500).json({ error: 'Failed to remove item from cart' });
        }
      } else {
        res.status(500).json({ error: 'Failed to remove item from cart' });
      }
    }
  }

  public async clearCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.ensureUser(req).id;
      await this.cartService.clearCart(userId);
      res.status(204).send();
    } catch (error) {
      console.error('Clear cart error:', error);
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  }


  public async initiateCheckout(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.ensureUser(req).id;
      const checkoutData = await this.cartService.initiateCheckout(userId);
      res.json(checkoutData);
    } catch (error) {
      console.error('Checkout error:', error);
      if (error instanceof Error) {
        if (error.message === 'Cart is empty') {
          res.status(400).json({ error: 'Cart is empty' });
        } else {
          res.status(500).json({ error: 'Failed to initiate checkout' });
        }
      } else {
        res.status(500).json({ error: 'Failed to initiate checkout' });
      }
    }
  }
}
