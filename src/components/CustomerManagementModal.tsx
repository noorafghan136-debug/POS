import { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  UserPlus, 
  User, 
  Phone, 
  Mail, 
  ShoppingBag, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Link2, 
  Plus, 
  Edit3, 
  Trash2,
  Receipt,
  FileSpreadsheet,
  Coins
} from 'lucide-react';
import { Customer, Order, ShopSettings } from '../types';

interface CustomerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  orders: Order[];
  settings: ShopSettings;
  activeCustomerId?: string;
  onSelectCustomer: (customer: Customer) => void;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onAssociateOrderToCustomer: (orderId: string, customerId: string) => void;
  onViewReceipt: (order: Order) => void;
}

export function CustomerManagementModal({
  isOpen,
  onClose,
  customers,
  orders,
  settings,
  activeCustomerId,
  onSelectCustomer,
  onSaveCustomer,
  onDeleteCustomer,
  onAssociateOrderToCustomer,
  onViewReceipt,
}: CustomerManagementModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    activeCustomerId || (customers.length > 0 ? customers[0].id : '')
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAssociateOrderOpen, setIsAssociateOrderOpen] = useState(false);
  const [selectedOrderIdToLink, setSelectedOrderIdToLink] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({});

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  // Selected customer object
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Orders associated with selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomerId) return [];
    return orders.filter(
      (o) => o.customerId === selectedCustomerId || o.customer?.id === selectedCustomerId
    );
  }, [orders, selectedCustomerId]);

  // Total spend & metrics for selected customer
  const customerMetrics = useMemo(() => {
    const totalSpend = customerOrders.reduce((sum, o) => sum + (o.status === 'completed' ? o.total : 0), 0);
    const orderCount = customerOrders.length;
    const avgOrderValue = orderCount > 0 ? totalSpend / orderCount : 0;
    return { totalSpend, orderCount, avgOrderValue };
  }, [customerOrders]);

  // Available orders that are either unassigned or belong to someone else, for association
  const unlinkedOrders = useMemo(() => {
    return orders.filter(
      (o) => o.customerId !== selectedCustomerId && o.customer?.id !== selectedCustomerId
    );
  }, [orders, selectedCustomerId]);

  const openNewCustomerForm = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormNotes('');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditCustomerForm = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormEmail(c.email || '');
    setFormPhone(c.phone);
    setFormAddress(c.address || '');
    setFormNotes(c.notes || '');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; phone?: string } = {};
    if (!formName.trim()) errors.name = 'Customer name is required';
    if (!formPhone.trim()) errors.phone = 'Phone number is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const customerToSave: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim() || undefined,
      phone: formPhone.trim(),
      address: formAddress.trim() || undefined,
      notes: formNotes.trim() || undefined,
      loyaltyPoints: editingCustomer ? editingCustomer.loyaltyPoints : 25, // 25 welcome points
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
    };

    onSaveCustomer(customerToSave);
    setSelectedCustomerId(customerToSave.id);
    setIsFormOpen(false);
    showNotice(editingCustomer ? 'Customer profile updated' : 'New customer added successfully');
  };

  const handleLinkOrder = () => {
    if (!selectedOrderIdToLink || !selectedCustomerId) return;
    onAssociateOrderToCustomer(selectedOrderIdToLink, selectedCustomerId);
    setIsAssociateOrderOpen(false);
    setSelectedOrderIdToLink('');
    showNotice('Past purchase successfully linked to customer profile');
  };

  const showNotice = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[90vh] max-h-[780px] rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Customer Relationship Management</h2>
              <p className="text-xs text-slate-400">
                Manage customer directory, contact info, and linked purchase histories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-add-customer-modal"
              onClick={openNewCustomerForm}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
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
        {feedbackMessage && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 px-4 py-1.5 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Body Layout: Master Customer List (Left) & Customer Profile & Purchases (Right) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Customer Directory */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/80 flex flex-col shrink-0">
            {/* Search Customers Bar */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="input-search-customers"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, phone, or email..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Customers Scroll List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredCustomers.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <User className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-300">No customers found</p>
                  <button
                    onClick={openNewCustomerForm}
                    className="mt-2 text-xs text-emerald-400 hover:underline"
                  >
                    + Add first customer
                  </button>
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = cust.id === selectedCustomerId;
                  const custOrders = orders.filter(
                    (o) => o.customerId === cust.id || o.customer?.id === cust.id
                  );
                  const totalSpent = custOrders.reduce(
                    (sum, o) => sum + (o.status === 'completed' ? o.total : 0),
                    0
                  );

                  return (
                    <button
                      key={cust.id}
                      id={`customer-item-${cust.id}`}
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-xs'
                          : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-xs text-white truncate">{cust.name}</h4>
                          {cust.id === activeCustomerId && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 rounded-full font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="font-mono">{cust.phone}</span>
                        </div>
                        {cust.email && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">{cust.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          {settings.currencySymbol}
                          {totalSpent.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {custOrders.length} {custOrders.length === 1 ? 'order' : 'orders'}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Customer Details & Purchase Association */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-y-auto">
            {selectedCustomer ? (
              <div className="p-4 sm:p-6 space-y-5">
                {/* Profile Banner */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{selectedCustomer.name}</h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                          <Coins className="w-3 h-3 text-amber-400" />
                          <span>{selectedCustomer.loyaltyPoints} Points</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span className="font-mono text-slate-200">{selectedCustomer.phone}</span>
                        </span>
                        {selectedCustomer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-emerald-400" />
                            <span className="text-slate-200">{selectedCustomer.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      id="btn-select-customer-for-cart"
                      onClick={() => {
                        onSelectCustomer(selectedCustomer);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Use For Active Sale
                    </button>
                    <button
                      onClick={() => openEditCustomerForm(selectedCustomer)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit Customer Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove customer "${selectedCustomer.name}"?`)) {
                          onDeleteCustomer(selectedCustomer.id);
                          setSelectedCustomerId(customers[0]?.id || '');
                        }
                      }}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Additional Info Cards (Address & Notes) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Address</span>
                    <p className="text-slate-300 mt-0.5">
                      {selectedCustomer.address || 'No address provided'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Cashier Notes</span>
                    <p className="text-slate-300 mt-0.5">
                      {selectedCustomer.notes || 'No notes for this customer'}
                    </p>
                  </div>
                </div>

                {/* Lifetime Metrics Strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Spend</span>
                    <p className="text-lg font-mono font-black text-emerald-400 mt-0.5">
                      {settings.currencySymbol}
                      {customerMetrics.totalSpend.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Total Orders</span>
                    <p className="text-lg font-mono font-black text-white mt-0.5">
                      {customerMetrics.orderCount}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Avg. Order Value</span>
                    <p className="text-lg font-mono font-black text-teal-400 mt-0.5">
                      {settings.currencySymbol}
                      {customerMetrics.avgOrderValue.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Purchase History & Association Header */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-emerald-400" />
                        <span>Associated Past Purchases</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Orders linked to this customer profile. You can also link unassociated previous receipts.
                      </p>
                    </div>

                    <button
                      id="btn-associate-order"
                      onClick={() => setIsAssociateOrderOpen(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Link Past Purchase</span>
                    </button>
                  </div>

                  {/* Associate Order Selector Inline Panel */}
                  {isAssociateOrderOpen && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                          Associate an Unlinked or Past Order to {selectedCustomer.name}
                        </span>
                        <button
                          onClick={() => setIsAssociateOrderOpen(false)}
                          className="text-slate-400 hover:text-white text-xs"
                        >
                          Cancel
                        </button>
                      </div>

                      {unlinkedOrders.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No other unassociated orders available to link.
                        </p>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <select
                            value={selectedOrderIdToLink}
                            onChange={(e) => setSelectedOrderIdToLink(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">-- Select an Order to associate --</option>
                            {unlinkedOrders.map((ord) => (
                              <option key={ord.id} value={ord.id}>
                                {ord.orderNumber} - {new Date(ord.createdAt).toLocaleDateString()} (
                                {settings.currencySymbol}
                                {ord.total.toFixed(2)}){' '}
                                {ord.customer ? `[Assigned: ${ord.customer.name}]` : '[Unassigned]'}
                              </option>
                            ))}
                          </select>
                          <button
                            disabled={!selectedOrderIdToLink}
                            onClick={handleLinkOrder}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Link to Profile
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Orders List Table */}
                  {customerOrders.length === 0 ? (
                    <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-400">
                      <ShoppingBag className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                      <p className="text-xs font-medium text-slate-300">
                        No purchases associated with this customer yet
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Use the "Link Past Purchase" button above to associate prior tickets, or select this customer during checkout.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-sm">
                                {ord.orderNumber}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.2 rounded-full uppercase ${
                                  ord.status === 'completed'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {ord.status}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {new Date(ord.createdAt).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <p className="text-slate-400 text-[11px] mt-1 line-clamp-1">
                              {ord.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                            </p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                            <div className="text-right">
                              <span className="text-sm font-black font-mono text-white">
                                {settings.currencySymbol}
                                {ord.total.toFixed(2)}
                              </span>
                              <span className="block text-[10px] text-slate-500 uppercase font-mono">
                                {ord.paymentMethod}
                              </span>
                            </div>

                            <button
                              onClick={() => onViewReceipt(ord)}
                              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="View and print receipt"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8 text-center text-slate-500">
                <User className="w-12 h-12 text-slate-700 mb-2 mx-auto" />
                <p className="text-sm font-medium text-slate-400">Select a customer to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Add / Edit Customer Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</span>
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Customer Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-customer-name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    id="input-customer-phone"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. 555-0199"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    id="input-customer-email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. john@example.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Street Address <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="input-customer-address"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="e.g. 123 Main St, Apt 4"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Cashier Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Notes / Preferences <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    id="input-customer-notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Regular morning customer, organic preference"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
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
                    Save Customer
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
