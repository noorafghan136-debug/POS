import { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Edit, 
  Trash2, 
  Barcode, 
  TrendingDown, 
  TrendingUp, 
  Building2, 
  DollarSign, 
  Layers, 
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { Product, ProductCategory, ShopSettings } from '../types';

interface InventoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: ShopSettings;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
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

export function InventoryManagementModal({
  isOpen,
  onClose,
  products,
  settings,
  onSaveProduct,
  onDeleteProduct,
  onUpdateStock,
}: InventoryManagementModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Quick adjust stock inline dialog/state
  const [quickStockId, setQuickStockId] = useState<string | null>(null);
  const [quickStockVal, setQuickStockVal] = useState<string>('');

  // Form inputs
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('Groceries');
  const [formUnit, setFormUnit] = useState<Product['unit']>('ea');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formMinAlert, setFormMinAlert] = useState('5');
  const [formTaxable, setFormTaxable] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Unique list of suppliers
  const suppliers = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.supplier && p.supplier.trim()) set.add(p.supplier.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Inventory KPI Metrics
  const metrics = useMemo(() => {
    let totalItems = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let totalRetailVal = 0;
    let totalCostVal = 0;

    products.forEach((p) => {
      totalItems += p.stock;
      const minAlert = p.minStockAlert ?? 5;
      if (p.stock <= 0) outOfStock++;
      else if (p.stock <= minAlert) lowStock++;

      totalRetailVal += p.price * p.stock;
      totalCostVal += (p.costPrice ?? (p.price * 0.6)) * p.stock;
    });

    return {
      totalSkus: products.length,
      totalUnits: totalItems,
      outOfStock,
      lowStock,
      totalRetailVal,
      totalCostVal,
    };
  }, [products]);

  // Filtered and Sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;

        // Stock filter
        const minAlert = p.minStockAlert ?? 5;
        if (stockFilter === 'out' && p.stock > 0) return false;
        if (stockFilter === 'low' && (p.stock <= 0 || p.stock > minAlert)) return false;
        if (stockFilter === 'in' && p.stock <= minAlert) return false;

        // Supplier filter
        if (selectedSupplier !== 'all' && p.supplier !== selectedSupplier) return false;

        // Search query
        const q = searchQuery.toLowerCase().trim();
        if (q) {
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchBarcode = p.barcode.toLowerCase().includes(q);
          const matchSupplier = p.supplier ? p.supplier.toLowerCase().includes(q) : false;
          if (!matchName && !matchSku && !matchBarcode && !matchSupplier) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortBy === 'stock') cmp = a.stock - b.stock;
        else if (sortBy === 'price') cmp = a.price - b.price;
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [products, selectedCategory, stockFilter, selectedSupplier, searchQuery, sortBy, sortOrder]);

  const openNewProductForm = () => {
    setEditingProduct(null);
    setFormName('');
    setFormPrice('');
    setFormCostPrice('');
    setFormQuantity('10');
    setFormSupplier('');
    setFormCategory('Groceries');
    setFormUnit('ea');
    const autoNum = Math.floor(1000 + Math.random() * 9000);
    setFormSku(`SKU-${autoNum}`);
    setFormBarcode(`890${autoNum}`);
    setFormMinAlert('5');
    setFormTaxable(true);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditProductForm = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormPrice(prod.price.toString());
    setFormCostPrice(prod.costPrice ? prod.costPrice.toString() : '');
    setFormQuantity(prod.stock.toString());
    setFormSupplier(prod.supplier || '');
    setFormCategory(prod.category);
    setFormUnit(prod.unit);
    setFormSku(prod.sku);
    setFormBarcode(prod.barcode);
    setFormMinAlert((prod.minStockAlert ?? 5).toString());
    setFormTaxable(prod.taxable);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!formName.trim()) errors.name = 'Product name is required';
    const parsedPrice = parseFloat(formPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) errors.price = 'Valid retail price is required';
    const parsedQty = parseInt(formQuantity, 10);
    if (isNaN(parsedQty) || parsedQty < 0) errors.quantity = 'Valid stock quantity is required';
    if (!formSupplier.trim()) errors.supplier = 'Supplier name is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const parsedCost = formCostPrice ? parseFloat(formCostPrice) : undefined;
    const parsedMinAlert = parseInt(formMinAlert, 10) || 5;

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formName.trim(),
      price: parsedPrice,
      costPrice: parsedCost,
      stock: parsedQty,
      supplier: formSupplier.trim(),
      category: formCategory,
      unit: formUnit,
      sku: formSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      barcode: formBarcode.trim() || `${Date.now().toString().slice(-7)}`,
      minStockAlert: parsedMinAlert,
      taxable: formTaxable,
      updatedAt: new Date().toISOString(),
    };

    onSaveProduct(productToSave);
    setIsFormOpen(false);
    showNotice(editingProduct ? `Updated "${productToSave.name}"` : `Added "${productToSave.name}" to inventory`);
  };

  const handleQuickStockSave = (prod: Product) => {
    const val = parseInt(quickStockVal, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateStock(prod.id, val);
      showNotice(`Stock updated for ${prod.name}: ${val} ${prod.unit}`);
    }
    setQuickStockId(null);
    setQuickStockVal('');
  };

  const showNotice = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl h-[92vh] max-h-[820px] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Inventory Management & Stock Tracking</h2>
              <p className="text-xs text-slate-400">
                Track real-time stock levels, suppliers, retail prices, and catalog products
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-add-product"
              onClick={openNewProductForm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 px-4 py-1.5 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Inventory KPI Cards Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-950 border-b border-slate-800 text-xs shrink-0">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-400" /> Total SKUs
            </span>
            <p className="text-base font-mono font-bold text-white mt-0.5">{metrics.totalSkus}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Package className="w-3 h-3 text-teal-400" /> Total Units
            </span>
            <p className="text-base font-mono font-bold text-teal-300 mt-0.5">{metrics.totalUnits}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" /> Low Stock
            </span>
            <p className={`text-base font-mono font-bold mt-0.5 ${metrics.lowStock > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {metrics.lowStock}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-rose-400" /> Out of Stock
            </span>
            <p className={`text-base font-mono font-bold mt-0.5 ${metrics.outOfStock > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {metrics.outOfStock}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" /> Inventory Value
            </span>
            <p className="text-base font-mono font-bold text-emerald-400 mt-0.5">
              {settings.currencySymbol}
              {metrics.totalRetailVal.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-inventory-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, barcode, or supplier..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ProductCategory)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            {/* Stock Level Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'out' | 'in')}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Low Stock Only (≤ min)</option>
              <option value="out">Out of Stock Only (0)</option>
              <option value="in">Normal In Stock</option>
            </select>

            {/* Supplier Filter */}
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => {
                  if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('name');
                    setSortOrder('asc');
                  }
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  sortBy === 'name' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Name
              </button>
              <button
                onClick={() => {
                  if (sortBy === 'stock') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('stock');
                    setSortOrder('asc');
                  }
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  sortBy === 'stock' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stock
              </button>
              <button
                onClick={() => {
                  if (sortBy === 'price') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  else {
                    setSortBy('price');
                    setSortOrder('asc');
                  }
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  sortBy === 'price' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Price
              </button>
            </div>
          </div>
        </div>

        {/* Product Inventory Table View */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Product Details</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Retail Price</th>
                <th className="py-2.5 px-3">Wholesale Cost</th>
                <th className="py-2.5 px-3">Stock Level & Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-300">No products match your filters</p>
                    <button
                      onClick={openNewProductForm}
                      className="mt-2 text-xs text-emerald-400 hover:underline"
                    >
                      + Add a new product
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const minAlert = prod.minStockAlert ?? 5;
                  const isOut = prod.stock <= 0;
                  const isLow = prod.stock > 0 && prod.stock <= minAlert;
                  const isQuickAdjust = quickStockId === prod.id;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-850/60 transition-colors group"
                    >
                      {/* Name & Identifiers */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {prod.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                          <span>{prod.sku}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Barcode className="w-2.5 h-2.5" />
                            {prod.barcode}
                          </span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-slate-300">
                          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {prod.supplier || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                          {prod.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-white text-xs">
                          {settings.currencySymbol}
                          {prod.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500 block">per {prod.unit}</span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {prod.costPrice ? (
                          <span>
                            {settings.currencySymbol}
                            {prod.costPrice.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Stock Level Tracker */}
                      <td className="py-3 px-3">
                        {isQuickAdjust ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={quickStockVal}
                              onChange={(e) => setQuickStockVal(e.target.value)}
                              className="w-16 px-1.5 py-1 bg-slate-950 border border-emerald-500 rounded font-mono text-white text-xs"
                              autoFocus
                            />
                            <button
                              onClick={() => handleQuickStockSave(prod)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                            >
                              Set
                            </button>
                            <button
                              onClick={() => setQuickStockId(null)}
                              className="px-1.5 py-1 text-slate-400 hover:text-white text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-mono font-bold text-sm ${
                                    isOut
                                      ? 'text-rose-400'
                                      : isLow
                                      ? 'text-amber-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  {prod.stock}
                                </span>
                                <span className="text-[11px] text-slate-400">{prod.unit}</span>
                              </div>

                              {/* Status Badge */}
                              <div className="mt-0.5">
                                {isOut ? (
                                  <span className="inline-block text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    Out of Stock
                                  </span>
                                ) : isLow ? (
                                  <span className="inline-block text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    Low (Min {minAlert})
                                  </span>
                                ) : (
                                  <span className="inline-block text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    In Stock
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quick Adjust Buttons */}
                            <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity ml-auto">
                              <button
                                onClick={() => onUpdateStock(prod.id, Math.max(0, prod.stock - 1))}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center"
                                title="Subtract 1 unit"
                              >
                                -
                              </button>
                              <button
                                onClick={() => onUpdateStock(prod.id, prod.stock + 1)}
                                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center"
                                title="Add 1 unit"
                              >
                                +
                              </button>
                              <button
                                onClick={() => {
                                  setQuickStockId(prod.id);
                                  setQuickStockVal(prod.stock.toString());
                                }}
                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-medium"
                                title="Enter custom count"
                              >
                                Edit Qty
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditProductForm(prod)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Edit Product Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove "${prod.name}" from inventory?`)) {
                                onDeleteProduct(prod.id);
                                showNotice(`Deleted "${prod.name}"`);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add / Edit Product Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-5 overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span>{editingProduct ? 'Update Product Details' : 'Add New Product'}</span>
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3.5">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Product Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-product-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Organic Honey 500g"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Pricing & Quantity in Stock (Key Requirements) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Retail Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Retail Price ({settings.currencySymbol}) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="input-product-price"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {formErrors.price && (
                      <p className="text-[11px] text-rose-400 mt-1">{formErrors.price}</p>
                    )}
                  </div>

                  {/* Quantity / Stock Level */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Stock Quantity <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      id="input-product-quantity"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    {formErrors.quantity && (
                      <p className="text-[11px] text-rose-400 mt-1">{formErrors.quantity}</p>
                    )}
                  </div>

                  {/* Wholesale Cost */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cost Price ({settings.currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="input-product-cost"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Supplier (Key Requirement) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supplier / Vendor Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="supplier-suggestions"
                      id="input-product-supplier"
                      value={formSupplier}
                      onChange={(e) => setFormSupplier(e.target.value)}
                      placeholder="e.g. Apex Wholesale Dist., Pacific Produce Hub"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <datalist id="supplier-suggestions">
                      {suppliers.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                  {formErrors.supplier && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.supplier}</p>
                  )}
                </div>

                {/* Category & Unit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measure</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value as Product['unit'])}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ea">ea (each / piece)</option>
                      <option value="kg">kg (kilogram)</option>
                      <option value="lb">lb (pound)</option>
                      <option value="pack">pack</option>
                      <option value="bottle">bottle</option>
                      <option value="can">can</option>
                    </select>
                  </div>
                </div>

                {/* Barcode, SKU & Min Stock Alert */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Barcode</label>
                    <input
                      type="text"
                      id="input-product-barcode"
                      value={formBarcode}
                      onChange={(e) => setFormBarcode(e.target.value)}
                      placeholder="e.g. 8901005"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">SKU</label>
                    <input
                      type="text"
                      id="input-product-sku"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value)}
                      placeholder="e.g. GROC-005"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formMinAlert}
                      onChange={(e) => setFormMinAlert(e.target.value)}
                      placeholder="5"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Taxable Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="checkbox-taxable"
                    checked={formTaxable}
                    onChange={(e) => setFormTaxable(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700 focus:ring-emerald-500"
                  />
                  <label htmlFor="checkbox-taxable" className="text-xs text-slate-300 select-none">
                    Item is taxable (applies {settings.taxLabel})
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
                  >
                    {editingProduct ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
