import { X, Clock, Play, Trash2, ShoppingCart, User } from 'lucide-react';
import { HeldCart, ShopSettings } from '../types';

interface HeldCartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldCarts: HeldCart[];
  settings: ShopSettings;
  onResumeCart: (heldCart: HeldCart) => void;
  onDeleteHeldCart: (heldCartId: string) => void;
}

export function HeldCartsModal({
  isOpen,
  onClose,
  heldCarts,
  settings,
  onResumeCart,
  onDeleteHeldCart,
}: HeldCartsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Parked / Held Orders</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {heldCarts.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <ShoppingCart className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-300">No held orders right now</p>
              <p className="text-[11px] text-slate-500 mt-1">
                You can hold a cart at checkout to serve another waiting customer.
              </p>
            </div>
          ) : (
            heldCarts.map((hc) => {
              const total = hc.items.reduce(
                (sum, i) => sum + (i.customPrice ?? i.product.price) * i.quantity,
                0
              );
              return (
                <div
                  key={hc.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{hc.holdName || hc.note || 'Parked Ticket'}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(hc.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {hc.customer && (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5">
                        <User className="w-3 h-3" />
                        <span>{hc.customer.name}</span>
                      </div>
                    )}

                    <p className="text-slate-400 text-[11px] mt-1 truncate">
                      {hc.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">
                      {settings.currencySymbol}
                      {total.toFixed(2)}
                    </span>

                    <button
                      onClick={() => {
                        onResumeCart(hc);
                        onClose();
                      }}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                      title="Restore cart to register"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteHeldCart(hc.id)}
                      className="p-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Discard held cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
