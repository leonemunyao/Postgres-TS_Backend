import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticateToken } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();
const paymentController = new PaymentController();

// All routes require authentication
router.use(authenticateToken);

// Payment routes
router.post('/initiate', paymentController.initiatePayment.bind(paymentController));
router.post('/confirm/:paymentId', paymentController.confirmPayment.bind(paymentController));
router.post('/webhook', paymentController.handleWebhook.bind(paymentController));
router.get('/status/:orderId', paymentController.getPaymentStatus.bind(paymentController));

// M-Pesa specific routes
router.post('/mpesa/initiate', paymentController.initiateMpesaPayment.bind(paymentController));
router.post('/mpesa/callback', paymentController.handleMpesaCallback.bind(paymentController));

// Admin only routes
router.get('/all', isAdmin, paymentController.getAllPaymentStatuses.bind(paymentController));
router.post('/refund/:orderId', isAdmin, paymentController.processRefund.bind(paymentController));

export default router;
