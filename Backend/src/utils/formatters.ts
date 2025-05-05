/**
 * Data formatting utility functions
 */
export const formatters = {
  // Format currency
  formatPrice: (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  },

  // Format date
  formatDate: (date: Date): string => {
    return new Intl.DateTimeFormat('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(date));
  },

  // Format phone number
  formatPhone: (phone: string): string => {
    return phone.replace(/^(?:\+254|0)(\d{9})$/, '+254$1');
  }
};
