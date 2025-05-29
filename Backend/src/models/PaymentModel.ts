  // Defines the structure for Payment data
export interface IPayment {
  id: number;
  orderId: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment status types
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Payment method types
export type PaymentMethod = 'pesapal';

// Interface for Pesapal payment request
export interface IPesapalPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  callback_url: string;
  notification_id: string;
  merchant_reference: string;
  billing_address: {
    email_address: string;
    phone_number: string;
    country_code: string;
    first_name: string;
    last_name: string;
  };
}

// Interface for Pesapal payment response
export interface IPesapalPaymentResponse {
  order_tracking_id: string;
  redirect_url: string;
  status: string;
  merchant_reference: string;
}

// Interface for Pesapal webhook payload
export interface IPesapalWebhookPayload {
  order_tracking_id: string;
  order_merchant_reference: string;
  order_status: PaymentStatus;
  payment_status: PaymentStatus;
  payment_status_description: string;
  payment_method: string;
  payment_account: string;
  payment_channel: string;
  payment_date: string;
  currency: string;
  amount: number;
  customer_email: string;
  customer_phone: string;
  customer_name: string;
  callback_url: string;
  notification_id: string;
}
