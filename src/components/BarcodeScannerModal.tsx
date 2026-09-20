import { useState, useEffect, useRef } from 'react';
import { X, ScanLine, Barcode, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onScanCode: (barcode: string) => boolean;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  products,
  onScanCode,
}: BarcodeScannerModalProps) {
  const [manualCode, setManualCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const found = onScanCode(manualCode.trim());
    if (found) {
      setStatusMessage({ text: `Barcode "${manualCode.trim()}" added to ticket!`, type: 'success' });
      setManualCode('');
      setTimeout(() => onClose(), 800);
    } else {
      setStatusMessage({ text: `No item found matching barcode "${manualCode.trim()}"`, type: 'error' });
    }
  };

  const handleSimulateScan = (barcode: string) => {
    const found = onScanCode(barcode);
    if (found) {
      setStatusMessage({ text: `Added item with barcode ${barcode}!`, type: 'success' });
      setTimeout(() => onClose(), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Barcode Scanner</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Animated Laser Scanner Viewfinder */}
          <div className="relative h-44 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center">
            {/* Red Laser Bar Animation */}
            <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-pulse" />
            
            {/* Viewfinder Target Bracket Corners */}
            <div className="w-44 h-24 border-2 border-dashed border-emerald-500/50 rounded-lg flex items-center justify-center flex-col text-slate-400 text-xs">
              <Barcode className="w-8 h-8 text-emerald-400 mb-1 opacity-80" />
              <span>Aim Barcode / Reader Here</span>
            </div>

            <span className="absolute bottom-2 text-[10px] text-slate-400 font-mono">
              Hardware USB/Bluetooth scanners auto-type here
            </span>
          </div>

          {/* Feedback */}
          {statusMessage && (
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/70 border border-rose-800 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Manual input */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Manual Barcode or SKU Input:
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                id="input-barcode-scanner"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Scan or type barcode (e.g. 8901001)"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Scan
              </button>
            </div>
          </form>

          {/* Quick Simulation Samples */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Or Click To Simulate Scan:
            </span>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSimulateScan(p.barcode)}
                  className="p-1.5 text-left rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs transition-colors flex items-center justify-between"
                >
                  <span className="truncate text-slate-200 text-[11px]">{p.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 ml-1 shrink-0">{p.barcode}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
