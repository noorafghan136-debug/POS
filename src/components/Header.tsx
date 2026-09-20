import { useState, useEffect } from 'react';
import { 
  Store, 
  Clock, 
  User, 
  Receipt, 
  Package, 
  History, 
  FileText, 
  Settings as SettingsIcon, 
  Volume2, 
  VolumeX, 
  PauseCircle,
  ScanLine
} from 'lucide-react';
import { ShopSettings, HeldCart } from '../types';

interface HeaderProps {
  settings: ShopSettings;
  heldCarts: HeldCart[];
  onOpenHeldCarts: () => void;
  onOpenInventory: () => void;
  onOpenCustomers: () => void;
  onOpenHistory: () => void;
  onOpenShiftReport: () => void;
  onOpenSettings: () => void;
  onOpenScanner: () => void;
  onToggleSound: () => void;
}

export function Header({
  settings,
  heldCarts,
  onOpenHeldCarts,
  onOpenInventory,
  onOpenCustomers,
  onOpenHistory,
  onOpenShiftReport,
  onOpenSettings,
  onOpenScanner,
  onToggleSound,
}: HeaderProps) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-slate-100 shadow-md">
      {/* Brand & Store Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-950/40 shrink-0">
          <Store className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base md:text-lg tracking-tight text-white truncate">
              {settings.storeName}
            </h1>
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              Online POS
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate flex items-center gap-2">
            <span>{settings.registerName}</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              {settings.cashierName}
            </span>
          </p>
        </div>
      </div>

      {/* Clock & Status */}
      <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-white">{timeStr}</span>
        </div>
        <div className="h-3.5 w-px bg-slate-800" />
        <span className="text-slate-400 font-medium">{dateStr}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Barcode Quick Scanner trigger */}
        <button
          id="btn-scan-barcode"
          onClick={onOpenScanner}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
          title="Scan or enter barcode"
        >
          <ScanLine className="w-4 h-4" />
          <span className="hidden sm:inline">Barcode Scan</span>
        </button>

        {/* Parked / Held Carts */}
        <button
          id="btn-held-carts"
          onClick={onOpenHeldCarts}
          className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            heldCarts.length > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
          title="Parked / Held Orders"
        >
          <PauseCircle className="w-4 h-4" />
          <span className="hidden md:inline">Parked</span>
          {heldCarts.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
              {heldCarts.length}
            </span>
          )}
        </button>

        {/* Inventory */}
        <button
          id="btn-inventory"
          onClick={onOpenInventory}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          title="Product Catalog & Stock Management"
        >
          <Package className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Inventory</span>
        </button>

        {/* Customers */}
        <button
          id="btn-customers"
          onClick={onOpenCustomers}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          title="Customer Management & Purchase History"
        >
          <User className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Customers</span>
        </button>

        {/* Sales History */}
        <button
          id="btn-transactions"
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          title="Orders & Receipts History"
        >
          <History className="w-4 h-4" />
          <span className="hidden md:inline">Orders</span>
        </button>

        {/* Shift / Z-Report */}
        <button
          id="btn-shift-report"
          onClick={onOpenShiftReport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          title="Register X/Z Report"
        >
          <FileText className="w-4 h-4" />
          <span className="hidden xl:inline">Shift</span>
        </button>

        {/* Sound Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={onToggleSound}
          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          title={settings.soundEnabled ? 'Mute POS sounds' : 'Enable POS sounds'}
        >
          {settings.soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {/* Settings */}
        <button
          id="btn-settings"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          title="Shop & POS Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
