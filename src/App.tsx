import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ProductGrid } from './components/ProductGrid';
import { CartPanel } from './components/CartPanel';
import { CustomerManagementModal } from './components/CustomerManagementModal';
import { InventoryManagementModal } from './components/InventoryManagementModal';
import { CheckoutModal } from './components/CheckoutModal';
import { ReceiptModal } from './components/ReceiptModal';
import { OrdersHistoryModal } from './components/OrdersHistoryModal';
import { HeldCartsModal } from './components/HeldCartsModal';
import { ShiftReportModal } from './components/ShiftReportModal';
import { SettingsModal } from './components/SettingsModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';

import {
  Product,
  Customer,
  Order,
  CartItem,
  HeldCart,
  ShopSettings,
  RegisterShift,
} from './types';

import {
  loadProducts,
  saveProducts,
  loadCustomers,
  saveCustomers,
  loadOrders,
  saveOrders,
  loadSettings,
  saveSettings,
  loadHeldCarts,
  saveHeldCarts,
  loadShift,
  saveShift,
} from './utils/storage';

import {
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
  DEFAULT_CUSTOMERS,
  DEFAULT_INITIAL_ORDERS,
} from './data/defaultProducts';

import {
  playBeepSound,
  playErrorBeep,
  playCashRegisterSound,
  playSuccessChime,
} from './utils/audio';

export default function App() {
  // Primary application data state
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [settings, setSettings] = useState<ShopSettings>(() => loadSettings());
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => loadHeldCarts());
  const [shift, setShift] = useState<RegisterShift>(() => loadShift());

  // Active Sale State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [orderDiscountPercent, setOrderDiscountPercent] = useState<number>(0);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isOrdersHistoryModalOpen, setIsOrdersHistoryModalOpen] = useState(false);
  const [isHeldCartsModalOpen, setIsHeldCartsModalOpen] = useState(false);
  const [isShiftReportModalOpen, setIsShiftReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  const [currentReceiptOrder, setCurrentReceiptOrder] = useState<Order | null>(null);
  const [checkoutInitialTendered, setCheckoutInitialTendered] = useState<number | undefined>(
    undefined
  );

  // Sync state to local storage
  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveHeldCarts(heldCarts);
  }, [heldCarts]);

  useEffect(() => {
    saveShift(shift);
  }, [shift]);

  // Cart Handlers
  const handleAddToCart = useCallback(
    (product: Product) => {
      // Check current stock
      if (product.stock <= 0) {
        if (settings.soundEnabled) playErrorBeep();
        alert(`"${product.name}" is currently out of stock.`);
        return;
      }

      setCart((prev) => {
        const existingIdx = prev.findIndex((item) => item.product.id === product.id);
        if (existingIdx > -1) {
          const currentQty = prev[existingIdx].quantity;
          if (currentQty >= product.stock) {
            if (settings.soundEnabled) playErrorBeep();
            alert(`Cannot add more "${product.name}". Max available stock is ${product.stock}.`);
            return prev;
          }
          if (settings.soundEnabled) playBeepSound();
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], quantity: currentQty + 1 };
          return next;
        }

        if (settings.soundEnabled) playBeepSound();
        return [...prev, { product, quantity: 1 }];
      });
    },
    [settings.soundEnabled]
  );

  const handleBarcodeScan = useCallback(
    (code: string): boolean => {
      const q = code.toLowerCase().trim();
      const match = products.find(
        (p) =>
          p.barcode.toLowerCase() === q ||
          p.sku.toLowerCase() === q ||
          p.id.toLowerCase() === q
      );

      if (match) {
        handleAddToCart(match);
        return true;
      }
      if (settings.soundEnabled) playErrorBeep();
      return false;
    },
    [products, handleAddToCart, settings.soundEnabled]
  );

  const handleUpdateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        handleRemoveItem(productId);
        return;
      }

      const prod = products.find((p) => p.id === productId);
      if (prod && quantity > prod.stock) {
        if (settings.soundEnabled) playErrorBeep();
        alert(`Cannot set quantity to ${quantity}. Only ${prod.stock} in stock.`);
        return;
      }

      setCart((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
    },
    [products, settings.soundEnabled]
  );

  const handleRemoveItem = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleClearCart = useCallback(() => {
    if (cart.length === 0) return;
    setCart([]);
    setActiveCustomer(null);
    setOrderDiscountPercent(0);
  }, [cart]);

  // Park / Hold Cart
  const handleHoldCart = useCallback(() => {
    if (cart.length === 0) return;
    const note = prompt('Enter a label or note for this parked cart:', activeCustomer?.name || `Customer #${heldCarts.length + 1}`);
    if (note === null) return;

    const newHeldCart: HeldCart = {
      id: `held-${Date.now()}`,
      holdName: note.trim() || `Ticket ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      items: [...cart],
      customer: activeCustomer || undefined,
      orderDiscountPercent,
      note: note.trim(),
      savedAt: new Date().toISOString(),
    };

    setHeldCarts((prev) => [newHeldCart, ...prev]);
    setCart([]);
    setActiveCustomer(null);
    setOrderDiscountPercent(0);

    if (settings.soundEnabled) playSuccessChime();
  }, [cart, activeCustomer, orderDiscountPercent, heldCarts.length, settings.soundEnabled]);

  const handleResumeCart = useCallback(
    (heldCart: HeldCart) => {
      setCart(heldCart.items);
      setActiveCustomer(heldCart.customer || null);
      setOrderDiscountPercent(heldCart.orderDiscountPercent || 0);
      setHeldCarts((prev) => prev.filter((c) => c.id !== heldCart.id));
      if (settings.soundEnabled) playSuccessChime();
    },
    [settings.soundEnabled]
  );

  const handleDeleteHeldCart = useCallback((heldCartId: string) => {
    setHeldCarts((prev) => prev.filter((c) => c.id !== heldCartId));
  }, []);

  // Customer Management Handlers
  const handleSaveCustomer = useCallback((customer: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === customer.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = customer;
        return next;
      }
      return [customer, ...prev];
    });

    // Also update active customer if it's the one being edited
    setActiveCustomer((curr) => (curr?.id === customer.id ? customer : curr));
  }, []);

  const handleDeleteCustomer = useCallback((customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setActiveCustomer((curr) => (curr?.id === customerId ? null : curr));
  }, []);

  // Associate past purchase with customer profile
  const handleAssociateOrderToCustomer = useCallback(
    (orderId: string, customerId: string) => {
      const targetCustomer = customers.find((c) => c.id === customerId);
      if (!targetCustomer) return;

      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === orderId) {
            return {
              ...ord,
              customerId,
              customer: targetCustomer,
            };
          }
          return ord;
        })
      );
    },
    [customers]
  );

  // Inventory & Product Management Handlers
  const handleSaveProduct = useCallback((product: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = product;
        return next;
      }
      return [product, ...prev];
    });

    // Also update any matching product inside active cart
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === product.id ? { ...item, product } : item
      )
    );
  }, []);

  const handleDeleteProduct = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleUpdateStock = useCallback((productId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p))
    );
  }, []);

  // Checkout & Sale Completion
  const handleProceedToCheckout = useCallback(() => {
    if (cart.length === 0) return;
    setCheckoutInitialTendered(undefined);
    setIsCheckoutModalOpen(true);
  }, [cart.length]);

  const handleQuickCashCheckout = useCallback(
    (tendered: number) => {
      if (cart.length === 0) return;
      setCheckoutInitialTendered(tendered);
      setIsCheckoutModalOpen(true);
    },
    [cart.length]
  );

  const handleCompleteOrder = useCallback(
    (order: Order) => {
      // 1. Deduct stock for all purchased items
      setProducts((prev) =>
        prev.map((prod) => {
          const itemInOrder = order.items.find((i) => i.product.id === prod.id);
          if (itemInOrder) {
            return {
              ...prod,
              stock: Math.max(0, prod.stock - itemInOrder.quantity),
            };
          }
          return prod;
        })
      );

      // 2. Add loyalty points if customer attached
      if (order.customerId) {
        const pointsEarned = Math.round(order.total);
        setCustomers((prev) =>
          prev.map((cust) =>
            cust.id === order.customerId
              ? { ...cust, loyaltyPoints: (cust.loyaltyPoints || 0) + pointsEarned }
              : cust
          )
        );
      }

      // 3. Save order into orders history
      setOrders((prev) => [order, ...prev]);

      // 4. Reset ticket state
      setCart([]);
      setActiveCustomer(null);
      setOrderDiscountPercent(0);

      // 5. Close checkout & show receipt
      setIsCheckoutModalOpen(false);
      setCurrentReceiptOrder(order);
      setIsReceiptModalOpen(true);
    },
    []
  );

  // Refund Order and Restock Inventory
  const handleRefundOrder = useCallback(
    (orderId: string) => {
      const ord = orders.find((o) => o.id === orderId);
      if (!ord || ord.status === 'refunded') return;

      // Restock items
      setProducts((prev) =>
        prev.map((prod) => {
          const itemInOrder = ord.items.find((i) => i.product.id === prod.id);
          if (itemInOrder) {
            return {
              ...prod,
              stock: prod.stock + itemInOrder.quantity,
            };
          }
          return prod;
        })
      );

      // Mark order as refunded
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'refunded' } : o))
      );

      if (settings.soundEnabled) playSuccessChime();
    },
    [orders, settings.soundEnabled]
  );

  // Register Shift Handlers
  const handleCloseShift = useCallback((closingCash: number, notes?: string) => {
    setShift((prev) => ({
      ...prev,
      closingCash,
      closedAt: new Date().toISOString(),
      isActive: false,
      notes,
    }));
  }, []);

  const handleResetShift = useCallback((startingCash: number) => {
    const newShift: RegisterShift = {
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      startingCash,
      isActive: true,
    };
    setShift(newShift);
  }, []);

  // Settings Handlers
  const handleSaveSettings = useCallback((updated: ShopSettings) => {
    setSettings(updated);
  }, []);

  const handleToggleSound = useCallback(() => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const handleResetToDemoData = useCallback(() => {
    setProducts(DEFAULT_PRODUCTS);
    setCustomers(DEFAULT_CUSTOMERS);
    setOrders(DEFAULT_INITIAL_ORDERS);
    setSettings(DEFAULT_SETTINGS);
    setHeldCarts([]);
    setShift({
      id: `shift-${Date.now()}`,
      openedAt: new Date().toISOString(),
      startingCash: 150.0,
      isActive: true,
    });
    setCart([]);
    setActiveCustomer(null);
    setOrderDiscountPercent(0);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Top Application Header */}
      <Header
        settings={settings}
        heldCarts={heldCarts}
        onOpenHeldCarts={() => setIsHeldCartsModalOpen(true)}
        onOpenInventory={() => setIsInventoryModalOpen(true)}
        onOpenCustomers={() => setIsCustomerModalOpen(true)}
        onOpenHistory={() => setIsOrdersHistoryModalOpen(true)}
        onOpenShiftReport={() => setIsShiftReportModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onToggleSound={handleToggleSound}
      />

      {/* Main Two-Column POS Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left Column: Product Catalog Grid & Quick Search */}
        <div className="flex-1 flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950">
          <ProductGrid
            products={products}
            settings={settings}
            onAddToCart={handleAddToCart}
            onBarcodeScan={handleBarcodeScan}
          />
        </div>

        {/* Right Column: Active Sale Ticket & Checkout Actions */}
        <div className="w-full md:w-96 lg:w-[440px] xl:w-[480px] shrink-0 flex flex-col min-h-0 bg-slate-900 shadow-2xl">
          <CartPanel
            cart={cart}
            customer={activeCustomer}
            settings={settings}
            orderDiscountPercent={orderDiscountPercent}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onHoldCart={handleHoldCart}
            onSetOrderDiscount={setOrderDiscountPercent}
            onOpenCustomerModal={() => setIsCustomerModalOpen(true)}
            onRemoveCustomer={() => setActiveCustomer(null)}
            onProceedToCheckout={handleProceedToCheckout}
            onQuickCashCheckout={handleQuickCashCheckout}
          />
        </div>
      </div>

      {/* Customer Management & Purchase History Association Modal */}
      <CustomerManagementModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        orders={orders}
        settings={settings}
        activeCustomerId={activeCustomer?.id}
        onSelectCustomer={(cust) => setActiveCustomer(cust)}
        onSaveCustomer={handleSaveCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onAssociateOrderToCustomer={handleAssociateOrderToCustomer}
        onViewReceipt={(ord) => {
          setCurrentReceiptOrder(ord);
          setIsReceiptModalOpen(true);
        }}
      />

      {/* Inventory & Stock Management Modal */}
      <InventoryManagementModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        products={products}
        settings={settings}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onUpdateStock={handleUpdateStock}
      />

      {/* Checkout & Payment Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        cart={cart}
        customer={activeCustomer}
        settings={settings}
        orderDiscountPercent={orderDiscountPercent}
        initialTendered={checkoutInitialTendered}
        onCompleteOrder={handleCompleteOrder}
      />

      {/* Printable Thermal Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={currentReceiptOrder}
        settings={settings}
      />

      {/* Sales History & Orders Modal */}
      <OrdersHistoryModal
        isOpen={isOrdersHistoryModalOpen}
        onClose={() => setIsOrdersHistoryModalOpen(false)}
        orders={orders}
        customers={customers}
        settings={settings}
        onViewReceipt={(ord) => {
          setCurrentReceiptOrder(ord);
          setIsReceiptModalOpen(true);
        }}
        onRefundOrder={handleRefundOrder}
        onAssociateOrderToCustomer={handleAssociateOrderToCustomer}
      />

      {/* Parked / Held Carts Modal */}
      <HeldCartsModal
        isOpen={isHeldCartsModalOpen}
        onClose={() => setIsHeldCartsModalOpen(false)}
        heldCarts={heldCarts}
        settings={settings}
        onResumeCart={handleResumeCart}
        onDeleteHeldCart={handleDeleteHeldCart}
      />

      {/* Shift & Register Reconciliation Report Modal */}
      <ShiftReportModal
        isOpen={isShiftReportModalOpen}
        onClose={() => setIsShiftReportModalOpen(false)}
        shift={shift}
        orders={orders}
        settings={settings}
        onCloseShift={handleCloseShift}
        onResetShift={handleResetShift}
      />

      {/* Settings & Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetToDemoData={handleResetToDemoData}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        products={products}
        onScanCode={handleBarcodeScan}
      />
    </div>
  );
}
