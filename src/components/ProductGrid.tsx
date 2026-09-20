import { useState, useMemo, useRef } from 'react';
import { Search, X, Barcode, AlertTriangle, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Product, ProductCategory, ShopSettings } from '../types';

interface ProductGridProps {
  products: Product[];
  settings: ShopSettings;
  onAddToCart: (product: Product) => void;
  onBarcodeScan: (barcode: string) => boolean;
}

const CATEGORIES: ProductCategory[] = [
  'All',
  'Groceries',
  'Beverages',
  'Snacks',
  'Bakery',
  'Produce',
  'Personal Care',
  'Household',
];

export function ProductGrid({
  products,
  settings,
  onAddToCart,
  onBarcodeScan,
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickBarcodeInput, setQuickBarcodeInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchCategory;
      const matchQuery =
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.barcode.toLowerCase().includes(query);
      return matchCategory && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBarcodeInput.trim()) return;
    const found = onBarcodeScan(quickBarcodeInput.trim());
    if (found) {
      setScanMessage({ text: `Item scanned!`, type: 'success' });
    } else {
      setScanMessage({ text: `Barcode "${quickBarcodeInput}" not found`, type: 'error' });
    }
    setQuickBarcodeInput('');
    setTimeout(() => setScanMessage(null), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden border-r border-slate-800/80">
      {/* Search & Quick Barcode Scan Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Main Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            id="input-product-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, SKU, or category..."
            className="w-full pl-9 pr-8 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Barcode Scanner Input */}
        <form onSubmit={handleBarcodeSubmit} className="relative flex items-center shrink-0">
          <div className="relative">
            <Barcode className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="input-barcode-quick"
              value={quickBarcodeInput}
              onChange={(e) => setQuickBarcodeInput(e.target.value)}
              placeholder="Scan/Type Barcode"
              className="w-full sm:w-48 pl-9 pr-14 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center"
            >
              Scan
            </button>
          </div>
        </form>
      </div>

      {/* Scan Feedback Notification */}
      {scanMessage && (
        <div
          className={`px-4 py-1.5 text-xs font-medium flex items-center justify-between transition-all ${
            scanMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800'
              : 'bg-rose-950/80 text-rose-300 border-b border-rose-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {scanMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{scanMessage.text}</span>
          </div>
          <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Category Pills Slider */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800/70 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              id={`cat-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/50'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-700/70 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Products Grid Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <ShoppingBag className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No items found</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Try searching with another keyword or barcode, or select a different category.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= 5;

              return (
                <button
                  key={product.id}
                  id={`product-card-${product.id}`}
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product)}
                  className={`group relative flex flex-col justify-between text-left p-3 rounded-xl border transition-all duration-150 active:scale-[0.98] select-none ${
                    isOutOfStock
                      ? 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                      : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-950/50 cursor-pointer'
                  }`}
                >
                  {/* Top Bar: Category accent & Stock pill */}
                  <div className="flex items-center justify-between gap-1 w-full mb-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-slate-300"
                      style={{
                        backgroundColor: `${product.color || '#3b82f6'}20`,
                        color: product.color || '#93c5fd',
                      }}
                    >
                      {product.category}
                    </span>

                    {/* Stock Status Badge */}
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Out of stock
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Low: {product.stock}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400">
                        {product.stock} {product.unit}
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                      <span>{product.sku}</span>
                      <span>•</span>
                      <span>#{product.barcode}</span>
                    </div>
                  </div>

                  {/* Bottom Bar: Price & Unit */}
                  <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/80 w-full mt-auto">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-base font-extrabold text-white font-mono">
                        {settings.currencySymbol}
                        {product.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        /{product.unit}
                      </span>
                    </div>

                    <div className="w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-emerald-600 text-slate-400 group-hover:text-white flex items-center justify-center text-xs font-bold transition-all">
                      +
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
