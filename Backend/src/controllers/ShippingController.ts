import { Request, Response } from 'express';
import { ShippingService } from '../services/ShippingService';
import { ShippingStatus } from '../models/ShippingModel';

export class ShippingController {
    private shippingService: ShippingService;

    constructor() {
        this.shippingService = new ShippingService();
    }

    /**
     * Creates shipping details for an order
     */
    public async createShipping(req: Request, res: Response): Promise<void> {
        try {
            const shippingDetails = req.body;
            const userId = req.user.id;

            const shipping = await this.shippingService.createShipping(shippingDetails, userId);
            res.status(201).json(shipping);
        } catch (error) {
            console.error('Create shipping error:', error);
            res.status(500).json({ error: 'Failed to create shipping details' });
        }
    }

    /**
     * Gets shipping details for a specific order
     */
    public async getShippingDetails(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;
            const userId = req.user.id;

            const shipping = await this.shippingService.getShippingDetails(Number(orderId), userId);
            res.json(shipping);
        } catch (error) {
            console.error('Get shipping details error:', error);
            res.status(404).json({ error: 'Shipping details not found' });
        }
    }

    /**
     * Gets shipping details based on status (admin only)
     */
    public async getShippingByStatus(req: Request, res: Response): Promise<void> {
        try {
            const { status } = req.params;
            
            if (!req.user.isAdmin) {
                res.status(403).json({ error: 'Unauthorized to view shipping by status' });
                return;
            }

            if (!['pending', 'shipped', 'out_for_delivery', 'delivered'].includes(status)) {
                res.status(400).json({ error: 'Invalid shipping status' });
                return;
            }

            const shipping = await this.shippingService.getShippingByStatus(status as ShippingStatus);
            res.json(shipping);
        } catch (error) {
            console.error('Get shipping by status error:', error);
            res.status(500).json({ error: 'Failed to get shipping details by status' });
        }
    }

    /**
     * Updates shipping details for an order
     */
    public async updateShippingDetails(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;
            const userId = req.user.id;
            const updates = req.body;

            const shipping = await this.shippingService.updateShippingDetails(
                Number(orderId),
                userId,
                updates
            );
            res.json(shipping);
        } catch (error) {
            console.error('Update shipping details error:', error);
            res.status(500).json({ error: 'Failed to update shipping details' });
        }
    }

    /**
     * Updates shipping status (admin only)
     */
    public async updateShippingStatus(req: Request, res: Response): Promise<void> {
        try {
            const { shippingId } = req.params;
            const { status, trackingNumber } = req.body;

            if (!req.user.isAdmin) {
                res.status(403).json({ error: 'Unauthorized to update shipping status' });
                return;
            }

            if (!['pending', 'shipped', 'out_for_delivery', 'delivered'].includes(status)) {
                res.status(400).json({ error: 'Invalid shipping status' });
                return;
            }

            const shipping = await this.shippingService.updateShippingStatus(
                Number(shippingId),
                status as ShippingStatus,
                trackingNumber
            );
            res.json(shipping);
        } catch (error) {
            console.error('Update shipping status error:', error);
            res.status(500).json({ error: 'Failed to update shipping status' });
        }
    }

    /**
     * Gets all shipping details (admin only)
     */
    public async getAllShipping(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user.isAdmin) {
                res.status(403).json({ error: 'Unauthorized to view all shipping details' });
                return;
            }

            const shipping = await this.shippingService.getAllShipping();
            res.json(shipping);
        } catch (error) {
            console.error('Get all shipping error:', error);
            res.status(500).json({ error: 'Failed to get all shipping details' });
        }
    }

    /**
     * Deletes shipping details for an order
     */
    public async deleteShipping(req: Request, res: Response): Promise<void> {
        try {
            const { orderId } = req.params;
            const userId = req.user.id;

            await this.shippingService.deleteShipping(Number(orderId), userId);
            res.status(204).send();
        } catch (error) {
            console.error('Delete shipping error:', error);
            res.status(500).json({ error: 'Failed to delete shipping details' });
        }
    }
}

