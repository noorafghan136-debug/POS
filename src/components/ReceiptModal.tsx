import { useRef } from 'react';
import { X, Printer, CheckCircle2, Download, Share2 } from 'lucide-react';
import { Order, ShopSettings } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  settings: ShopSettings;
}

export function ReceiptModal({ isOpen, onClose, order, settings }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 print:border-none print:shadow-none print:bg-white print:max-h-full print:w-full">
        {/* Modal Controls (Hidden in print) */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Receipt: {order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thermal Receipt Paper Card */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/60 print:p-0 print:bg-white">
          <div
            ref={receiptRef}
            className="receipt-content bg-white text-black p-5 rounded-lg shadow-md font-mono text-xs max-w-[340px] mx-auto print:shadow-none print:max-w-full print:p-0"
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
              <h2 className="text-base font-black tracking-tight uppercase">{settings.storeName}</h2>
              <p className="text-[11px] text-gray-600">{settings.tagline}</p>
              <p className="text-[10px] text-gray-600 mt-1">{settings.address}</p>
              <p className="text-[10px] text-gray-600">Tel: {settings.phone}</p>
            </div>

            {/* Meta */}
            <div className="text-[11px] border-b border-dashed border-gray-300 pb-2 mb-2 space-y-0.5">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString()}{' '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cashier / Reg:</span>
                <span>{order.cashierName} / {order.registerName}</span>
              </div>
              {order.customer && (
                <div className="flex justify-between pt-1 border-t border-dotted border-gray-300">
                  <span>Customer:</span>
                  <span className="font-bold">{order.customer.name}</span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="border-b border-dashed border-gray-300 pb-2 mb-2">
              <div className="flex justify-between font-bold text-[10px] uppercase text-gray-700 pb-1 border-b border-gray-200">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/3 text-right">Total</span>
              </div>
              <div className="divide-y divide-gray-100 py-1 space-y-1">
                {order.items.map((item, idx) => {
                  const unitPrice = item.customPrice ?? item.product.price;
                  const itemDiscount = item.discountPercent
                    ? unitPrice * (item.discountPercent / 100)
                    : 0;
                  const lineTotal = (unitPrice - itemDiscount) * item.quantity;

                  return (
                    <div key={idx} className="pt-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="w-1/2 font-semibold truncate">{item.product.name}</span>
                        <span className="w-1/6 text-center">x{item.quantity}</span>
                        <span className="w-1/3 text-right font-bold">
                          {settings.currencySymbol}
                          {lineTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-500 pl-1">
                        @{settings.currencySymbol}
                        {unitPrice.toFixed(2)} / {item.product.unit}
                        {item.discountPercent ? ` (-${item.discountPercent}%)` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2 mb-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {settings.currencySymbol}
                  {order.subtotal.toFixed(2)}
                </span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount</span>
                  <span>
                    -{settings.currencySymbol}
                    {order.discountAmount.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>{settings.taxLabel}</span>
                <span>
                  {settings.currencySymbol}
                  {order.taxAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm font-black pt-1 border-t border-gray-400">
                <span>TOTAL</span>
                <span>
                  {settings.currencySymbol}
                  {order.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment info */}
            <div className="text-[11px] border-b border-dashed border-gray-300 pb-2 mb-3 space-y-0.5">
              <div className="flex justify-between uppercase">
                <span>Payment:</span>
                <span className="font-bold">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Tendered:</span>
                <span>
                  {settings.currencySymbol}
                  {order.amountTendered.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Change:</span>
                <span>
                  {settings.currencySymbol}
                  {order.changeGiven.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Loyalty points banner if customer attached */}
            {order.customer && (
              <div className="text-center bg-gray-100 p-2 rounded text-[10px] mb-3">
                <span className="font-bold">LOYALTY REWARDS</span>
                <p>+ {Math.round(order.total)} points earned on this visit!</p>
              </div>
            )}

            {/* Footer barcode & message */}
            <div className="text-center text-[10px] text-gray-600 space-y-2">
              <p>{settings.receiptFooter}</p>

              {/* Barcode Graphic */}
              <div className="pt-2 flex flex-col items-center">
                <div className="font-mono text-xl tracking-widest select-none">
                  ||||| | |||| ||| || |||||| |
                </div>
                <span className="text-[9px] font-mono tracking-widest">{order.orderNumber}</span>
              </div>

              <p className="text-[9px] text-gray-500 pt-1">Powered by Shop POS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
