import { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Receipt, 
  Calendar, 
  RotateCcw, 
  User, 
  Link2, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  Banknote,
  DollarSign
} from 'lucide-react';
import { Customer, Order, ShopSettings } from '../types';

interface OrdersHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  customers: Customer[];
  settings: ShopSettings;
  onViewReceipt: (order: Order) => void;
  onRefundOrder: (orderId: string) => void;
  onAssociateOrderToCustomer: (orderId: string, customerId: string) => void;
}

export function OrdersHistoryModal({
  isOpen,
  onClose,
  orders,
  customers,
  settings,
  onViewReceipt,
  onRefundOrder,
  onAssociateOrderToCustomer,
}: OrdersHistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'refunded'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedCustomerIdForAssign, setSelectedCustomerIdForAssign] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (statusFilter !== 'all' && ord.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && ord.paymentMethod !== paymentFilter) return false;

      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchNum = ord.orderNumber.toLowerCase().includes(q);
        const matchCust = ord.customer?.name.toLowerCase().includes(q) || false;
        const matchItems = ord.items.some((i) => i.product.name.toLowerCase().includes(q));
        if (!matchNum && !matchCust && !matchItems) return false;
      }
      return true;
    });
  }, [orders, statusFilter, paymentFilter, searchQuery]);

  const summary = useMemo(() => {
    let completedTotal = 0;
    let refundedTotal = 0;
    let count = 0;

    orders.forEach((o) => {
      if (o.status === 'completed') {
        completedTotal += o.total;
        count++;
      } else if (o.status === 'refunded') {
        refundedTotal += o.total;
      }
    });

    return { completedTotal, refundedTotal, count };
  }, [orders]);

  const handleAssignSubmit = (orderId: string) => {
    if (!selectedCustomerIdForAssign) return;
    onAssociateOrderToCustomer(orderId, selectedCustomerIdForAssign);
    setAssigningOrderId(null);
    setSelectedCustomerIdForAssign('');
    showNotice('Purchase successfully associated with customer profile');
  };

  const showNotice = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[90vh] max-h-[780px] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sales & Order History</h2>
              <p className="text-xs text-slate-400">
                View receipts, manage returns, and link past orders to customer accounts
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 px-4 py-1.5 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-950 border-b border-slate-800 text-xs shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Completed Sales</span>
            <p className="text-base font-mono font-bold text-emerald-400 mt-0.5">
              {settings.currencySymbol}
              {summary.completedTotal.toFixed(2)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Transactions Count</span>
            <p className="text-base font-mono font-bold text-white mt-0.5">{summary.count}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Refunded Volume</span>
            <p className="text-base font-mono font-bold text-rose-400 mt-0.5">
              {settings.currencySymbol}
              {summary.refundedTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-orders-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, customer, or items sold..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed Only</option>
              <option value="refunded">Refunded Only</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Payments</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="qr_mobile">QR / Mobile</option>
              <option value="split">Split</option>
            </select>
          </div>
        </div>

        {/* Orders Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs font-semibold text-slate-300">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const isAssigning = assigningOrderId === ord.id;
              const isRefunded = ord.status === 'refunded';

              return (
                <div
                  key={ord.id}
                  id={`order-row-${ord.id}`}
                  className={`p-3.5 rounded-xl border transition-colors flex flex-col gap-2.5 ${
                    isRefunded
                      ? 'bg-rose-950/20 border-rose-900/50 text-slate-300'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                          isRefunded
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {ord.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(ord.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-black text-white text-sm sm:text-base">
                          {settings.currencySymbol}
                          {ord.total.toFixed(2)}
                        </span>
                        <span className="block text-[10px] text-slate-500 uppercase font-mono">
                          {ord.paymentMethod} • {ord.registerName}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onViewReceipt(ord)}
                          className="p-2 rounded-lg bg-slate-850 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                          title="View thermal receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {!isRefunded && (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Refund order ${ord.orderNumber} for ${settings.currencySymbol}${ord.total.toFixed(
                                    2
                                  )}? Items will be returned to inventory stock.`
                                )
                              ) {
                                onRefundOrder(ord.id);
                                showNotice(`Order ${ord.orderNumber} was marked refunded`);
                              }
                            }}
                            className="p-2 rounded-lg bg-slate-850 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Refund & restore stock"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer association strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {ord.customer ? (
                        <span className="text-slate-200">
                          Customer:{' '}
                          <strong className="text-emerald-400">{ord.customer.name}</strong>{' '}
                          <span className="text-[11px] font-mono text-slate-400">
                            ({ord.customer.phone})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Walk-in customer (Unassociated)</span>
                      )}

                      <button
                        onClick={() => {
                          setAssigningOrderId(isAssigning ? null : ord.id);
                          setSelectedCustomerIdForAssign(ord.customerId || '');
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 ml-1"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>{ord.customer ? 'Change Customer' : 'Associate to Customer'}</span>
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Cashier: <span className="text-slate-300">{ord.cashierName}</span>
                    </div>
                  </div>

                  {/* Inline Assign Customer Form */}
                  {isAssigning && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <span className="text-xs text-white font-medium">Link this order to:</span>
                      <select
                        value={selectedCustomerIdForAssign}
                        onChange={(e) => setSelectedCustomerIdForAssign(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Choose Customer --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.phone})
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={!selectedCustomerIdForAssign}
                        onClick={() => handleAssignSubmit(ord.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Save Association
                      </button>
                      <button
                        onClick={() => setAssigningOrderId(null)}
                        className="px-2 py-1.5 text-slate-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Line items mini summary */}
                  <div className="text-[11px] text-slate-400 line-clamp-1 bg-slate-900/50 px-2.5 py-1.5 rounded-lg font-mono">
                    {ord.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
