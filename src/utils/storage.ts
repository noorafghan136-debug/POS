import { Product, Order, ShopSettings, HeldCart, Customer, RegisterShift } from '../types';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS, DEFAULT_CUSTOMERS, DEFAULT_INITIAL_ORDERS } from '../data/defaultProducts';

const STORAGE_KEYS = {
  PRODUCTS: 'shop_pos_products_v1',
  ORDERS: 'shop_pos_orders_v1',
  SETTINGS: 'shop_pos_settings_v1',
  CUSTOMERS: 'shop_pos_customers_v1',
  HELD_CARTS: 'shop_pos_held_carts_v1',
  SHIFT: 'shop_pos_shift_v1',
};

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load products from storage:', e);
  }
  saveProducts(DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Failed to save products:', e);
  }
}

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load orders:', e);
  }
  saveOrders(DEFAULT_INITIAL_ORDERS);
  return DEFAULT_INITIAL_ORDERS;
}

export function saveOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Failed to save orders:', e);
  }
}

export function loadSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: ShopSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load customers:', e);
  }
  return DEFAULT_CUSTOMERS;
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.error('Failed to save customers:', e);
  }
}

export function loadHeldCarts(): HeldCart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HELD_CARTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load held carts:', e);
  }
  return [];
}

export function saveHeldCarts(carts: HeldCart[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HELD_CARTS, JSON.stringify(carts));
  } catch (e) {
    console.error('Failed to save held carts:', e);
  }
}

export function loadShift(): RegisterShift {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIFT);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load shift:', e);
  }
  return {
    openedAt: new Date().toISOString(),
    startingCash: 150.00,
    isActive: true,
  };
}

export function saveShift(shift: RegisterShift): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SHIFT, JSON.stringify(shift));
  } catch (e) {
    console.error('Failed to save shift:', e);
  }
}
