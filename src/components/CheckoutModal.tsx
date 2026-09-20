import { useState, useMemo } from 'react';
import { 
  X, 
  Banknote, 
  CreditCard, 
  QrCode, 
  Split, 
  User, 
  Coins, 
  CheckCircle2, 
  Receipt,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { CartItem, Customer, Order, PaymentMethod, PaymentBreakdown, ShopSettings } from '../types';
import { playCashRegisterSound, playErrorBeep } from '../utils/audio';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  customer: Customer | null;
  settings: ShopSettings;
  orderDiscountPercent: number;
  initialTendered?: number;
  onCompleteOrder: (order: Order) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  customer,
  settings,
  orderDiscountPercent,
  initialTendered,
  onCompleteOrder,
}: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderedInput, setTenderedInput] = useState<string>(
    initialTendered ? initialTendered.toString() : ''
  );

  // Split payment state
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');

  // Card reference / last 4 digits
  const [cardAuth, setCardAuth] = useState('');

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const p = item.customPrice ?? item.product.price;
      const disc = item.discountPercent ? p * (item.discountPercent / 100) : 0;
      return sum + (p - disc) * item.quantity;
    }, 0);
  }, [cart]);

  const discountAmount = orderDiscountPercent > 0 ? subtotal * (orderDiscountPercent / 100) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  const discountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;
  const taxableTotal = cart.reduce((sum, item) => {
    if (!item.product.taxable) return sum;
    const p = item.customPrice ?? item.product.price;
    const disc = item.discountPercent ? p * (item.discountPercent / 100) : 0;
    return sum + (p - disc) * item.quantity * discountRatio;
  }, 0);

  const taxAmount = taxableTotal * settings.taxRate;
  const grandTotal = discountedSubtotal + taxAmount;

  // Tendered calculation
  const tenderedNumber = useMemo(() => {
    if (paymentMethod === 'cash') {
      const val = parseFloat(tenderedInput);
      return isNaN(val) ? 0 : val;
    } else if (paymentMethod === 'split') {
      const c = parseFloat(splitCash) || 0;
      const cd = parseFloat(splitCard) || 0;
      return c + cd;
    }
    return grandTotal;
  }, [paymentMethod, tenderedInput, splitCash, splitCard, grandTotal]);

  const changeDue = Math.max(0, tenderedNumber - grandTotal);
  const isPaidInFull = tenderedNumber >= grandTotal - 0.001;

  // Quick cash bill recommendations
  const billOptions = useMemo(() => {
    const exact = grandTotal;
    const bills = [5, 10, 20, 50, 100];
    const set = new Set<number>();
    set.add(Number(exact.toFixed(2)));
    bills.forEach((b) => {
      if (b >= grandTotal) set.add(b);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [grandTotal]);

  const handleFinishSale = () => {
    if (!isPaidInFull) {
      if (settings.soundEnabled) playErrorBeep();
      return;
    }

    if (settings.soundEnabled) playCashRegisterSound();

    let breakdown: PaymentBreakdown | undefined;
    if (paymentMethod === 'split') {
      breakdown = {
        cash: parseFloat(splitCash) || 0,
        card: parseFloat(splitCard) || 0,
      };
    }

    const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      items: cart,
      subtotal,
      discountAmount,
      taxAmount,
      total: grandTotal,
      paymentMethod,
      paymentBreakdown: breakdown,
      amountTendered: tenderedNumber,
      changeGiven: changeDue,
      customer: customer || undefined,
      customerId: customer?.id,
      cashierName: settings.cashierName,
      registerName: settings.registerName,
      createdAt: new Date().toISOString(),
      status: 'completed',
    };

    onCompleteOrder(newOrder);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Payment & Settlement</h2>
              <p className="text-xs text-slate-400">
                Choose payment method and complete transaction
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Total Due Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Due
              </span>
              {customer && (
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-300">
                  <User className="w-3 h-3 text-emerald-400" />
                  <span className="font-semibold text-white">{customer.name}</span>
                  <span className="text-emerald-400 font-mono">
                    (+{Math.round(grandTotal)} loyalty pts)
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono text-emerald-400">
                {settings.currencySymbol}
                {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'card', label: 'Card', icon: CreditCard },
              { id: 'qr_mobile', label: 'QR / UPI', icon: QrCode },
              { id: 'split', label: 'Split', icon: Split },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  id={`btn-pay-${m.id}`}
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950'
                      : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Method Content */}
          {paymentMethod === 'cash' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Cash Received / Tendered</label>
                <button
                  onClick={() => setTenderedInput(grandTotal.toFixed(2))}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Exact Amount
                </button>
              </div>

              {/* Amount Tendered Input */}
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  id="input-cash-tendered"
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                  placeholder={grandTotal.toFixed(2)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xl font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Quick Bill Selectors */}
              <div className="flex flex-wrap gap-1.5">
                {billOptions.map((bill) => (
                  <button
                    key={bill}
                    type="button"
                    onClick={() => setTenderedInput(bill.toFixed(2))}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-mono font-bold text-slate-200 border border-slate-700/60"
                  >
                    {bill === grandTotal ? 'Exact' : `${settings.currencySymbol}${bill}`}
                  </button>
                ))}
              </div>

              {/* Change calculation box */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Change Due</span>
                <span
                  className={`text-xl font-mono font-black ${
                    tenderedNumber >= grandTotal ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {settings.currencySymbol}
                  {tenderedNumber >= grandTotal ? changeDue.toFixed(2) : '0.00'}
                </span>
              </div>

              {!isPaidInFull && tenderedNumber > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    Short by {settings.currencySymbol}
                    {(grandTotal - tenderedNumber).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Credit / Debit Card Terminal</h4>
                  <p className="text-xs text-slate-400">
                    Insert, swipe, or tap card on payment device
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Card Auth Code / Last 4 digits (optional reference)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={cardAuth}
                  onChange={(e) => setCardAuth(e.target.value)}
                  placeholder="e.g. 4242 or AUTH#9831"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Terminal ready for full charge of {settings.currencySymbol}{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {paymentMethod === 'qr_mobile' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-center">
              <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-lg">
                <QrCode className="w-28 h-28 text-slate-900" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Dynamic Shop QR Code</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ask customer to scan with Apple Pay, Google Wallet, or banking app
                </p>
              </div>
              <p className="text-xs font-mono font-bold text-emerald-400">
                Amount: {settings.currencySymbol}{grandTotal.toFixed(2)}
              </p>
            </div>
          )}

          {paymentMethod === 'split' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="font-bold text-xs text-slate-300">Split Payment Breakdown</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Cash Portion ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Card Portion ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-400">Total Tendered:</span>
                <span className="font-mono font-bold text-white">
                  {settings.currencySymbol}
                  {tenderedNumber.toFixed(2)} / {settings.currencySymbol}
                  {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Action Complete Sale Button */}
          <button
            id="btn-complete-sale"
            disabled={!isPaidInFull}
            onClick={handleFinishSale}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-base tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>COMPLETE SALE & PRINT RECEIPT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
