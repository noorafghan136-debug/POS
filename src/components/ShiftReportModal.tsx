import { useState } from 'react';
import { X, DollarSign, Calendar, Lock, CheckCircle2, Calculator, Receipt } from 'lucide-react';
import { Order, RegisterShift, ShopSettings } from '../types';

interface ShiftReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: RegisterShift;
  orders: Order[];
  settings: ShopSettings;
  onCloseShift: (closingCash: number, notes?: string) => void;
  onResetShift: (openingCash: number) => void;
}

export function ShiftReportModal({
  isOpen,
  onClose,
  shift,
  orders,
  settings,
  onCloseShift,
  onResetShift,
}: ShiftReportModalProps) {
  const [closingCashInput, setClosingCashInput] = useState('');
  const [openingCashInput, setOpeningCashInput] = useState('150.00');
  const [notesInput, setNotesInput] = useState('');

  if (!isOpen) return null;

  // Filter orders during active shift
  const shiftOrders = orders.filter((o) => {
    const orderTime = new Date(o.createdAt).getTime();
    const startTime = new Date(shift.openedAt).getTime();
    const endTime = shift.closedAt ? new Date(shift.closedAt).getTime() : Infinity;
    return orderTime >= startTime && orderTime <= endTime && o.status === 'completed';
  });

  const cashSales = shiftOrders
    .filter((o) => o.paymentMethod === 'cash')
    .reduce((sum, o) => sum + o.total, 0);

  const cardSales = shiftOrders
    .filter((o) => o.paymentMethod === 'card')
    .reduce((sum, o) => sum + o.total, 0);

  const otherSales = shiftOrders
    .filter((o) => o.paymentMethod !== 'cash' && o.paymentMethod !== 'card')
    .reduce((sum, o) => sum + o.total, 0);

  const totalSales = cashSales + cardSales + otherSales;
  const expectedCashInDrawer = shift.startingCash + cashSales;

  const countedCash = parseFloat(closingCashInput) || 0;
  const cashDifference = countedCash - expectedCashInDrawer;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Register Shift Report & Drawer</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="block font-bold text-slate-200">
                Shift: {settings.registerName} ({settings.cashierName})
              </span>
              <span className="text-[11px] font-mono">
                Started: {new Date(shift.openedAt).toLocaleString()}
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                shift.isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {shift.isActive ? 'Active Shift' : 'Closed'}
            </span>
          </div>

          {/* Sales Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Opening Drawer Float</span>
              <p className="text-base font-mono font-bold text-white mt-0.5">
                {settings.currencySymbol}
                {shift.startingCash.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Shift Revenue</span>
              <p className="text-base font-mono font-bold text-emerald-400 mt-0.5">
                {settings.currencySymbol}
                {totalSales.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Cash Received</span>
              <p className="text-base font-mono font-bold text-white mt-0.5">
                {settings.currencySymbol}
                {cashSales.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Card & Digital Sales</span>
              <p className="text-base font-mono font-bold text-white mt-0.5">
                {settings.currencySymbol}
                {(cardSales + otherSales).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Expected Cash in drawer */}
          <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-800/40 flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-300">Expected Physical Cash in Drawer:</span>
            <span className="text-base font-mono font-black text-emerald-400">
              {settings.currencySymbol}
              {expectedCashInDrawer.toFixed(2)}
            </span>
          </div>

          {/* Shift actions */}
          {shift.isActive ? (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300">Close Out Shift & Reconcile</h4>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Actual Cash Counted in Drawer ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={closingCashInput}
                  onChange={(e) => setClosingCashInput(e.target.value)}
                  placeholder={expectedCashInDrawer.toFixed(2)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {closingCashInput && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-mono flex justify-between ${
                    cashDifference === 0
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      : cashDifference > 0
                      ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                      : 'bg-rose-950/60 text-rose-400 border border-rose-800'
                  }`}
                >
                  <span>Difference (Overage/Shortage):</span>
                  <span className="font-bold">
                    {cashDifference > 0 ? '+' : ''}
                    {settings.currencySymbol}
                    {cashDifference.toFixed(2)}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Shift Notes</label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Smooth shift, drawer balanced"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() => {
                  onCloseShift(countedCash, notesInput);
                  onClose();
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                End & Lock Shift
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400">Shift Status: </span>
                <span className="text-white font-bold">Closed</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  New Shift Opening Drawer Float ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl font-mono text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={() => {
                  const floatVal = parseFloat(openingCashInput) || 150;
                  onResetShift(floatVal);
                  onClose();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Start New Shift
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
