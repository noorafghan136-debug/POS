export type ProductCategory =
  | 'All'
  | 'Groceries'
  | 'Beverages'
  | 'Snacks'
  | 'Bakery'
  | 'Produce'
  | 'Personal Care'
  | 'Household';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: ProductCategory;
  price: number;
  costPrice?: number;
  stock: number;
  minStockAlert?: number;
  supplier?: string;
  unit: 'ea' | 'kg' | 'lb' | 'pack' | 'bottle' | 'can';
  color?: string;
  taxable: boolean;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent?: number; // e.g. 10 for 10%
  customPrice?: number;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  loyaltyPoints: number;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'qr_mobile' | 'split';

export interface PaymentBreakdown {
  cash?: number;
  card?: number;
  qr_mobile?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown?: PaymentBreakdown;
  amountTendered: number;
  changeGiven: number;
  customer?: Customer;
  customerId?: string;
  cashierName: string;
  registerName: string;
  createdAt: string;
  status: 'completed' | 'refunded';
  refundedAt?: string;
  refundReason?: string;
}

export interface HeldCart {
  id: string;
  holdName: string;
  items: CartItem[];
  customer?: Customer;
  savedAt: string;
  note?: string;
  orderDiscountPercent?: number;
}

export interface ShopSettings {
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  taxRate: number; // e.g., 0.0825 for 8.25%
  taxLabel: string;
  currencySymbol: string;
  currencyCode: string;
  receiptFooter: string;
  cashierName: string;
  registerName: string;
  soundEnabled: boolean;
}

export interface RegisterShift {
  id?: string;
  openedAt: string;
  startingCash: number;
  closedAt?: string;
  closingCash?: number;
  isActive: boolean;
  notes?: string;
}
