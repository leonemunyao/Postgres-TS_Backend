import axios from 'axios';
import { PaymentService } from './PaymentService';
import { CartService } from './CartService';

interface MpesaAuthResponse {
  access_token: string;
  expires_in: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export class MpesaService {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private passkey: string;
  private shortcode: string;
  private paymentService: PaymentService;

  constructor(cartService: CartService) {
    this.baseUrl = process.env.MPESA_API_URL || 'https://sandbox.safaricom.co.ke';
    this.consumerKey = process.env.MPESA_CONSUMER_KEY || '';
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET || '';
    this.passkey = process.env.MPESA_PASSKEY || '';
    this.shortcode = process.env.MPESA_SHORTCODE || '';
    this.paymentService = new PaymentService(cartService);
  }

  /**
   * Gets M-Pesa access token
   */
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const response = await axios.get<MpesaAuthResponse>(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    return response.data.access_token;
  }

  /**
   * Initiates STK Push
   */
  public async initiateSTKPush(
    phoneNumber: string,
    amount: number,
    orderId: number
  ): Promise<STKPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);

      const response = await axios.post<STKPushResponse>(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: phoneNumber,
          PartyB: this.shortcode,
          PhoneNumber: phoneNumber,
          CallBackURL: `${process.env.BACKEND_URL}/api/payments/mpesa/callback`,
          AccountReference: `Order-${orderId}`,
          TransactionDesc: `Payment for order ${orderId}`
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      // Create payment record
      await this.paymentService.createPayment(
        orderId,
        amount,
        'mpesa',
        'pending'
      );

      return response.data;
    } catch (error) {
      console.error('STK Push initiation error:', error);
      throw new Error('Failed to initiate STK Push');
    }
  }

  /**
   * Handles M-Pesa callback
   */
  public async handleCallback(callbackData: any) {
    try {
      const { Body: { stkCallback: { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } } } = callbackData;

      if (ResultCode === 0) {
        // Payment successful
        const metadata = CallbackMetadata.Item;
        const orderId = parseInt(metadata[4].Value.split('-')[1]); // Extract order ID from AccountReference
        await this.paymentService.handleSuccessfulPayment(orderId);
      } else {
        // Payment failed
        const orderId = parseInt(callbackData.Body.stkCallback.AccountReference.split('-')[1]);
        await this.paymentService.handleFailedPayment(orderId);
      }
    } catch (error) {
      console.error('M-Pesa callback handling error:', error);
      throw new Error('Failed to process M-Pesa callback');
    }
  }

  /**
   * Generates timestamp in the required format
   */
  private getTimestamp(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minutes}${seconds}`;
  }

  /**
   * Generates password for STK Push
   */
  private generatePassword(timestamp: string): string {
    const str = this.shortcode + this.passkey + timestamp;
    return Buffer.from(str).toString('base64');
  }
} 