import { useState } from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  UserPlus, 
  UserCheck, 
  Tag, 
  PauseCircle, 
  RotateCcw, 
  CreditCard, 
  Banknote, 
  Percent, 
  X,
  ShoppingBag
} from 'lucide-react';
import { CartItem, Customer, ShopSettings } from '../types';

interface CartPanelProps {
  cart: CartItem[];
  customer: Customer | null;
  settings: ShopSettings;
  orderDiscountPercent: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onHoldCart: () => void;
  onSetOrderDiscount: (percent: number) => void;
  onOpenCustomerModal: () => void;
  onRemoveCustomer: () => void;
  onProceedToCheckout: () => void;
  onQuickCashCheckout: (tendered: number) => void;
}

export function CartPanel({
  cart,
  customer,
  settings,
  orderDiscountPercent,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onHoldCart,
  onSetOrderDiscount,
  onOpenCustomerModal,
  onRemoveCustomer,
  onProceedToCheckout,
  onQuickCashCheckout,
}: CartPanelProps) {
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountInput, setDiscountInput] = useState(orderDiscountPercent.toString());

  // Calculations
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = item.customPrice ?? item.product.price;
    const itemDiscount = item.discountPercent ? itemPrice * (item.discountPercent / 100) : 0;
    return sum + (itemPrice - itemDiscount) * item.quantity;
  }, 0);

  const discountAmount = orderDiscountPercent > 0 ? subtotal * (orderDiscountPercent / 100) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  // Tax on taxable items (prorated if order discount is applied)
  const discountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;
  const taxableTotal = cart.reduce((sum, item) => {
    if (!item.product.taxable) return sum;
    const itemPrice = item.customPrice ?? item.product.price;
    const itemDiscount = item.discountPercent ? itemPrice * (item.discountPercent / 100) : 0;
    return sum + (itemPrice - itemDiscount) * item.quantity * discountRatio;
  }, 0);

  const taxAmount = taxableTotal * settings.taxRate;
  const grandTotal = discountedSubtotal + taxAmount;

  // Quick cash bill recommendations
  const quickCashOptions = () => {
    if (grandTotal <= 0) return [];
    const exact = grandTotal;
    const nextFive = Math.ceil(grandTotal / 5) * 5;
    const nextTen = Math.ceil(grandTotal / 10) * 10;
    const bills = [20, 50, 100];
    
    const set = new Set<number>();
    set.add(Number(exact.toFixed(2)));
    if (nextFive > grandTotal) set.add(nextFive);
    if (nextTen > grandTotal && nextTen !== nextFive) set.add(nextTen);
    bills.forEach((b) => {
      if (b >= grandTotal) set.add(b);
    });

    return Array.from(set).sort((a, b) => a - b).slice(0, 4);
  };

  const handleApplyDiscount = () => {
    const val = parseFloat(discountInput) || 0;
    const clamped = Math.min(100, Math.max(0, val));
    onSetOrderDiscount(clamped);
    setShowDiscountModal(false);
  };

  return (
    <div className="w-full lg:w-96 xl:w-[420px] bg-slate-900 flex flex-col h-full shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 select-none">
      {/* Cart Header */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Current Order</h3>
            <p className="text-[11px] text-slate-400">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in ticket
            </p>
          </div>
        </div>

        {/* Clear & Hold Actions */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-hold-cart"
            disabled={cart.length === 0}
            onClick={onHoldCart}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Park / Hold Sale"
          >
            <PauseCircle className="w-4 h-4" />
          </button>
          <button
            id="btn-clear-cart"
            disabled={cart.length === 0}
            onClick={onClearCart}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="Clear Cart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Bar */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
        {customer ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-200 truncate">{customer.name}</span>
                <span className="text-[11px] text-emerald-400 ml-1.5 font-mono">
                  ({customer.loyaltyPoints} pts)
                </span>
              </div>
            </div>
            <button
              onClick={onRemoveCustomer}
              className="text-slate-500 hover:text-rose-400 text-[11px] ml-2 shrink-0"
            >
              Detach
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              Guest Customer
            </span>
            <button
              id="btn-assign-customer"
              onClick={onOpenCustomerModal}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add / Select</span>
            </button>
          </div>
        )}
      </div>

      {/* Cart Items Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-800 flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-300">Ticket is empty</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              Tap items from the catalog or scan barcodes to begin sale
            </p>
          </div>
        ) : (
          cart.map((item) => {
            const unitPrice = item.customPrice ?? item.product.price;
            const lineTotal = unitPrice * item.quantity * (1 - (item.discountPercent || 0) / 100);

            return (
              <div
                key={item.product.id}
                id={`cart-item-${item.product.id}`}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col gap-2 hover:border-slate-700 transition-colors"
              >
                {/* Top Row: Name & Price */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-semibold text-slate-100 truncate">
                      {item.product.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                      <span>
                        {settings.currencySymbol}
                        {unitPrice.toFixed(2)}
                      </span>
                      {item.product.taxable && (
                        <span className="text-[10px] text-slate-500 bg-slate-800 px-1 rounded">
                          Tax
                        </span>
                      )}
                      {item.discountPercent ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1 rounded border border-emerald-800/60">
                          -{item.discountPercent}%
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-white font-mono">
                      {settings.currencySymbol}
                      {lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Quantity Controls & Delete */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                    <button
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-mono font-bold text-white">
                      {item.quantity}
                    </span>
                    <button
                      disabled={item.quantity >= item.product.stock}
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pricing Summary & Discount Trigger */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span className="font-mono text-slate-200">
            {settings.currencySymbol}
            {subtotal.toFixed(2)}
          </span>
        </div>

        {/* Order Discount */}
        <div className="flex justify-between items-center text-slate-400">
          <button
            id="btn-trigger-discount"
            onClick={() => setShowDiscountModal(true)}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            <Tag className="w-3 h-3" />
            <span>
              {orderDiscountPercent > 0 ? `Discount (${orderDiscountPercent}%)` : 'Add Discount'}
            </span>
          </button>
          {orderDiscountPercent > 0 ? (
            <span className="font-mono text-emerald-400 font-semibold">
              -{settings.currencySymbol}
              {discountAmount.toFixed(2)}
            </span>
          ) : (
            <span className="font-mono text-slate-500">0.00</span>
          )}
        </div>

        {/* Tax */}
        <div className="flex justify-between text-slate-400">
          <span>{settings.taxLabel}</span>
          <span className="font-mono text-slate-200">
            {settings.currencySymbol}
            {taxAmount.toFixed(2)}
          </span>
        </div>

        {/* Grand Total */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
          <span className="text-sm font-bold text-white uppercase tracking-wide">Total</span>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {settings.currencySymbol}
              {grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Cash Bar */}
      {cart.length > 0 && (
        <div className="px-3 py-2 bg-slate-900 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">Cash:</span>
          {quickCashOptions().map((amount) => (
            <button
              key={amount}
              onClick={() => onQuickCashCheckout(amount)}
              className="flex-1 min-w-[55px] px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700/80 text-[11px] font-mono font-bold text-slate-200 transition-all text-center"
              title={`Pay ${settings.currencySymbol}${amount.toFixed(2)} cash`}
            >
              {amount === grandTotal ? 'Exact' : `${settings.currencySymbol}${amount}`}
            </button>
          ))}
        </div>
      )}

      {/* Checkout Pay Button */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <button
          id="btn-checkout"
          disabled={cart.length === 0}
          onClick={onProceedToCheckout}
          className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-extrabold text-base tracking-wide flex items-center justify-between shadow-lg shadow-emerald-950/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            <span>PAY / CHECKOUT</span>
          </div>
          <span className="font-mono text-lg font-black">
            {settings.currencySymbol}
            {grandTotal.toFixed(2)}
          </span>
        </button>
      </div>

      {/* Discount Modal Popover */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full max-w-xs shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-emerald-400" />
                <span>Order Discount</span>
              </h4>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Enter discount percentage to apply to the entire cart (0 - 100%):
            </p>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white text-base focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <span className="font-mono font-bold text-slate-300 text-lg">%</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountInput(pct.toString())}
                  className="py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-semibold text-slate-200"
                >
                  {pct}%
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onSetOrderDiscount(0);
                  setShowDiscountModal(false);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={handleApplyDiscount}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
