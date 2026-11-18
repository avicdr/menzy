'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  IndianRupee,
  Phone,
  RefreshCw,
  Repeat,
  Search,
  ShoppingBag,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { formatCurrencyMinor } from '@/lib/payments/plans';

interface CustomerListItem {
  id: string;
  name: string;
  mobile: string;
  creditBalanceMinor: number;
  notes: string | null;
  totalOrders: number;
  visitCount: number;
  visitsPerMonth: number;
  frequencyLabel: string;
  totalRevenueMinor: number;
  totalCollectedMinor: number;
  averageOrderMinor: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
}

interface CustomerSummary {
  totalCustomers: number;
  repeatCustomers: number;
  totalCustomerRevenueMinor: number;
  totalOutstandingCreditMinor: number;
  customersWithCreditCount: number;
}

interface CustomerOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  currency: string;
  totalMinor: number;
  paidMinor: number;
  dueMinor: number;
  paymentStatus: string;
  placedAt: string;
  tableName: string;
  items: Array<{
    id: string;
    dishName: string;
    variant: string | null;
    quantity: number;
    lineTotalMinor: number;
  }>;
}

interface CustomerLedgerEntry {
  id: string;
  type: 'CREDIT_ADDED' | 'PAYMENT_RECEIVED' | 'ADJUSTMENT';
  amountMinor: number;
  balanceAfterMinor: number;
  note: string | null;
  recordedBy: string | null;
  orderNumber: string | null;
  createdAt: string;
}

interface DashboardCustomersTabProps {
  restaurantId: string;
  currency: string;
  onSubscriptionExpired?: (payload?: any) => void;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function DashboardCustomersTab({
  restaurantId,
  currency,
  onSubscriptionExpired,
}: DashboardCustomersTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [customerCreditEnabled, setCustomerCreditEnabled] = useState(false);
  const [togglingCredit, setTogglingCredit] = useState(false);

  const [summary, setSummary] = useState<CustomerSummary>({
    totalCustomers: 0,
    repeatCustomers: 0,
    totalCustomerRevenueMinor: 0,
    totalOutstandingCreditMinor: 0,
    customersWithCreditCount: 0,
  });
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'repeat' | 'with_credit'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'revenue' | 'visits' | 'credit'>('recent');

  // Selected Customer Detail State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderDetail[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntry[]>([]);

  // Repayment Form State
  const [repayAmountMajor, setRepayAmountMajor] = useState('');
  const [repayNote, setRepayNote] = useState('');
  const [repaySubmitting, setRepaySubmitting] = useState(false);
  const [repayError, setRepayError] = useState<string | null>(null);

  // Settle / Split Order Modal State (inline on selected order)
  const [settlingOrder, setSettlingOrder] = useState<CustomerOrderDetail | null>(null);
  const [settlePaidMajor, setSettlePaidMajor] = useState('');
  const [settleNote, setSettleNote] = useState('');
  const [settleSubmitting, setSettleSubmitting] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 3500);
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        filter: filterMode,
        sort: sortBy,
      });
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const res = await fetch(`/api/restaurants/${restaurantId}/customers?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        onSubscriptionExpired?.(data);
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || 'Could not load customers.');
      }

      setCustomerCreditEnabled(Boolean(data.customerCreditEnabled));
      setSummary(data.summary);
      setCustomers(data.customers || []);
    } catch (err: any) {
      setError(err?.message || 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId, filterMode, sortBy, searchQuery, onSubscriptionExpired]);

  const fetchCustomerDetail = useCallback(
    async (customerId: string) => {
      setDetailLoading(true);
      setRepayError(null);
      setSettleError(null);
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}/customers/${customerId}`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load customer details.');
        }
        setSelectedCustomer(data.customer);
        setCustomerOrders(data.orders || []);
        setLedgerEntries(data.ledgerEntries || []);
        setCustomerCreditEnabled(Boolean(data.customerCreditEnabled));
      } catch (err: any) {
        setError(err?.message || 'Failed to load customer profile.');
      } finally {
        setDetailLoading(false);
      }
    },
    [restaurantId]
  );

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetail(selectedCustomerId);
    }
  }, [selectedCustomerId, fetchCustomerDetail]);

  const handleToggleCreditFeature = async (nextVal: boolean) => {
    setTogglingCredit(true);
    setError(null);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/ordering-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerCreditEnabled: nextVal }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not update credit/tab setting.');
      }
      setCustomerCreditEnabled(Boolean(data.settings?.customerCreditEnabled));
      showToast(
        nextVal
          ? 'Customer Credit / Loan Tab enabled. You can now record partial payments on orders.'
          : 'Customer Credit / Loan Tab turned off for new orders. Existing balances remain viewable.'
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle credit/tab setting.');
    } finally {
      setTogglingCredit(false);
    }
  };

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const major = Number(repayAmountMajor);
    if (!Number.isFinite(major) || major <= 0) {
      setRepayError('Enter a valid repayment amount.');
      return;
    }

    setRepaySubmitting(true);
    setRepayError(null);
    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/customers/${selectedCustomer.id}/repay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amountMajor: major,
            note: repayNote.trim() || undefined,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not record repayment.');
      }

      setRepayAmountMajor('');
      setRepayNote('');
      showToast(`Recorded repayment of ${formatCurrencyMinor(Math.round(major * 100), currency)}.`);
      await Promise.all([fetchCustomerDetail(selectedCustomer.id), fetchCustomers()]);
    } catch (err: any) {
      setRepayError(err?.message || 'Could not record repayment.');
    } finally {
      setRepaySubmitting(false);
    }
  };

  const handleOpenSettleOrder = (order: CustomerOrderDetail) => {
    setSettlingOrder(order);
    const defaultPaid = order.paidMinor > 0 ? order.paidMinor / 100 : order.totalMinor / 100;
    setSettlePaidMajor(String(Number(defaultPaid.toFixed(2))));
    setSettleNote('');
    setSettleError(null);
  };

  const handleSubmitSettleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingOrder || !selectedCustomer) return;
    const paidMajor = Number(settlePaidMajor);
    if (!Number.isFinite(paidMajor) || paidMajor < 0) {
      setSettleError('Enter a valid amount paid.');
      return;
    }

    setSettleSubmitting(true);
    setSettleError(null);
    try {
      const res = await fetch(
        `/api/restaurants/${restaurantId}/orders/${settlingOrder.id}/settle`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paidMajor,
            markCompleted: true,
            note: settleNote.trim() || undefined,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not settle bill.');
      }

      setSettlingOrder(null);
      showToast(`Updated payment on Order #${settlingOrder.orderNumber}.`);
      await Promise.all([fetchCustomerDetail(selectedCustomer.id), fetchCustomers()]);
    } catch (err: any) {
      setSettleError(err?.message || 'Could not settle bill.');
    } finally {
      setSettleSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Credit Opt-In Toggle */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-cream-200 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900">
            Customers &amp; Credit Tab
          </h2>
          <p className="text-xs sm:text-sm text-taupe-500 mt-1">
            Track every diner’s name, mobile, visit frequency, previous orders, total revenue, and optional tab/loan balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-cream-50 border border-cream-200">
            <div>
              <div className="text-xs font-bold text-espresso-900">Customer Credit / Loan Tab</div>
              <div className="text-[11px] text-taupe-500">
                Allow partial bill payments &amp; pay-later balances
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={customerCreditEnabled}
                disabled={togglingCredit}
                onChange={(e) => handleToggleCreditFeature(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-cream-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cream-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta"></div>
            </label>
          </div>

          <button
            type="button"
            onClick={() => fetchCustomers()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 border border-cream-200 transition-colors"
            title="Refresh customers"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-2xs">
          <div className="flex items-center justify-between text-taupe-500 text-xs font-medium">
            <span>Total Customers</span>
            <Users className="w-4 h-4 text-terracotta" />
          </div>
          <div className="font-serif text-2xl font-bold text-espresso-900 mt-1.5">
            {summary.totalCustomers}
          </div>
          <div className="text-[11px] text-taupe-500 mt-0.5">Saved with mobile number</div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-2xs">
          <div className="flex items-center justify-between text-taupe-500 text-xs font-medium">
            <span>Repeat Guests</span>
            <Repeat className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-espresso-900 mt-1.5">
            {summary.repeatCustomers}
          </div>
          <div className="text-[11px] text-taupe-500 mt-0.5">2+ visits or orders</div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-cream-200 shadow-2xs">
          <div className="flex items-center justify-between text-taupe-500 text-xs font-medium">
            <span>Customer Revenue</span>
            <IndianRupee className="w-4 h-4 text-terracotta" />
          </div>
          <div className="font-serif text-2xl font-bold text-espresso-900 mt-1.5">
            {formatCurrencyMinor(summary.totalCustomerRevenueMinor, currency)}
          </div>
          <div className="text-[11px] text-taupe-500 mt-0.5">Total linked order value</div>
        </div>

        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-2xs ${
            summary.totalOutstandingCreditMinor > 0
              ? 'bg-amber-50/70 border-amber-200'
              : 'bg-white border-cream-200'
          }`}
        >
          <div className="flex items-center justify-between text-taupe-600 text-xs font-medium">
            <span>Outstanding Credit</span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-espresso-900 mt-1.5">
            {formatCurrencyMinor(summary.totalOutstandingCreditMinor, currency)}
          </div>
          <div className="text-[11px] text-taupe-600 mt-0.5">
            {summary.customersWithCreditCount}{' '}
            {summary.customersWithCreditCount === 1 ? 'customer' : 'customers'} with tab due
          </div>
        </div>
      </div>

      {/* Main Master-Detail Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Customers Directory */}
        <div
          className={`${
            selectedCustomerId ? 'xl:col-span-7' : 'xl:col-span-12'
          } bg-white rounded-3xl border border-cream-200 shadow-soft overflow-hidden`}
        >
          {/* Search & Filters */}
          <div className="p-4 sm:p-5 border-b border-cream-200 bg-cream-50/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-taupe-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer by name or mobile..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-cream-300 text-xs sm:text-sm text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'repeat', 'with_credit'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    filterMode === mode
                      ? 'bg-espresso-900 text-white'
                      : 'bg-white border border-cream-300 text-taupe-600 hover:bg-cream-100'
                  }`}
                >
                  {mode === 'all'
                    ? 'All'
                    : mode === 'repeat'
                    ? 'Repeat'
                    : 'Credit Due'}
                </button>
              ))}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-white border border-cream-300 text-xs font-semibold text-espresso-900 focus:outline-none"
              >
                <option value="recent">Recent Visits</option>
                <option value="revenue">Highest Revenue</option>
                <option value="visits">Most Frequent</option>
                <option value="credit">Highest Balance Due</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-xs text-taupe-500">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Users className="w-8 h-8 text-taupe-300 mx-auto" />
              <div className="text-sm font-semibold text-espresso-900">No customers found yet</div>
              <p className="text-xs text-taupe-500 max-w-sm mx-auto">
                When diners enter their Name &amp; Mobile on your Menzy menu or place an order, their profile, order history, and spend appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-50 text-taupe-500 uppercase text-[10px] tracking-wider border-b border-cream-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Visits &amp; Frequency</th>
                    <th className="py-3 px-4 font-semibold">Revenue</th>
                    <th className="py-3 px-4 font-semibold">Credit / Due</th>
                    <th className="py-3 px-4 font-semibold text-right">Last Visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {customers.map((c) => {
                    const isSelected = selectedCustomerId === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-terracotta/5' : 'hover:bg-cream-50/80'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-espresso-900 text-xs sm:text-sm">
                            {c.name}
                          </div>
                          <div className="text-[11px] font-mono text-taupe-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{c.mobile}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-espresso-900">{c.frequencyLabel}</div>
                          <div className="text-[11px] text-taupe-500">
                            {c.totalOrders} {c.totalOrders === 1 ? 'order' : 'orders'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-espresso-900">
                            {formatCurrencyMinor(c.totalRevenueMinor, currency)}
                          </div>
                          {c.totalOrders > 0 && (
                            <div className="text-[10px] text-taupe-500">
                              Avg {formatCurrencyMinor(c.averageOrderMinor, currency)}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {c.creditBalanceMinor > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 font-mono font-bold text-[11px]">
                              Due {formatCurrencyMinor(c.creditBalanceMinor, currency)}
                            </span>
                          ) : (
                            <span className="text-taupe-400 text-[11px]">Settled</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-taupe-500 whitespace-nowrap">
                          {formatShortDate(c.lastVisitAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Customer Detail Drawer/Card */}
        {selectedCustomerId && (
          <div className="xl:col-span-5 bg-white rounded-3xl border border-cream-200 shadow-soft p-5 sm:p-6 space-y-5 sticky top-6">
            {detailLoading || !selectedCustomer ? (
              <div className="py-12 text-center text-xs text-taupe-500">
                Loading customer history...
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-cream-200 pb-4">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-espresso-900">
                      {selectedCustomer.name}
                    </h3>
                    <div className="text-xs font-mono text-taupe-600 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-terracotta" />
                      <span>{selectedCustomer.mobile}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId(null);
                      setSettlingOrder(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-cream-100 text-taupe-500"
                    aria-label="Close customer profile"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Individual Customer Metrics */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-2xl bg-cream-50 border border-cream-200">
                    <div className="text-[10px] uppercase tracking-wider text-taupe-500 font-semibold">
                      Revenue
                    </div>
                    <div className="font-mono font-bold text-sm text-espresso-900 mt-1">
                      {formatCurrencyMinor(selectedCustomer.totalRevenueMinor, currency)}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-cream-50 border border-cream-200">
                    <div className="text-[10px] uppercase tracking-wider text-taupe-500 font-semibold">
                      Frequency
                    </div>
                    <div className="font-bold text-xs text-espresso-900 mt-1">
                      {selectedCustomer.frequencyLabel}
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-2xl border ${
                      selectedCustomer.creditBalanceMinor > 0
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-emerald-50/60 border-emerald-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wider text-taupe-600 font-semibold">
                      Tab Due
                    </div>
                    <div className="font-mono font-bold text-sm text-espresso-900 mt-1">
                      {formatCurrencyMinor(selectedCustomer.creditBalanceMinor, currency)}
                    </div>
                  </div>
                </div>

                {/* Record Repayment Panel (visible whenever customer owes credit) */}
                {selectedCustomer.creditBalanceMinor > 0 && (
                  <form
                    onSubmit={handleRecordRepayment}
                    className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-amber-700" />
                        <span>Record Tab Repayment</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setRepayAmountMajor(
                            String(Number((selectedCustomer.creditBalanceMinor / 100).toFixed(2)))
                          )
                        }
                        className="text-[11px] font-semibold text-terracotta hover:underline"
                      >
                        Fill full due ({formatCurrencyMinor(selectedCustomer.creditBalanceMinor, currency)})
                      </button>
                    </div>

                    {repayError && (
                      <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                        {repayError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedCustomer.creditBalanceMinor / 100}
                        required
                        value={repayAmountMajor}
                        onChange={(e) => setRepayAmountMajor(e.target.value)}
                        placeholder={`Amount (${currency})`}
                        className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta"
                      />
                      <input
                        type="text"
                        value={repayNote}
                        onChange={(e) => setRepayNote(e.target.value)}
                        placeholder="Note (e.g. Paid via UPI/Cash)"
                        className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs text-espresso-900 focus:outline-none focus:ring-1 focus:ring-terracotta"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={repaySubmitting}
                      className="w-full py-2 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {repaySubmitting ? 'Recording Payment...' : 'Record Payment & Reduce Balance'}
                    </button>
                  </form>
                )}

                {/* Inline Split / Settle Order Form */}
                {settlingOrder && (
                  <form
                    onSubmit={handleSubmitSettleOrder}
                    className="p-4 rounded-2xl bg-cream-50 border border-cream-300 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-espresso-900">
                        Settle / Split Order #{settlingOrder.orderNumber} (Total{' '}
                        {formatCurrencyMinor(settlingOrder.totalMinor, settlingOrder.currency)})
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettlingOrder(null)}
                        className="text-taupe-400 hover:text-espresso-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {settleError && (
                      <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                        {settleError}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-taupe-600">
                        Total Paid to Date ({settlingOrder.currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={settlingOrder.totalMinor / 100}
                        required
                        value={settlePaidMajor}
                        onChange={(e) => setSettlePaidMajor(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs text-espresso-900"
                      />
                      {(() => {
                        const paidM = Math.max(
                          0,
                          Math.min(
                            settlingOrder.totalMinor,
                            Math.round((Number(settlePaidMajor) || 0) * 100)
                          )
                        );
                        const rem = settlingOrder.totalMinor - paidM;
                        return (
                          <div className="text-[11px] text-taupe-600">
                            Remaining added to {selectedCustomer.name}’s tab:{' '}
                            <strong className="font-mono text-amber-800">
                              {formatCurrencyMinor(rem, settlingOrder.currency)}
                            </strong>
                          </div>
                        );
                      })()}
                    </div>

                    <input
                      type="text"
                      value={settleNote}
                      onChange={(e) => setSettleNote(e.target.value)}
                      placeholder="Optional note (e.g. Paid 200 cash, 300 later)"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs text-espresso-900"
                    />

                    <button
                      type="submit"
                      disabled={settleSubmitting}
                      className="w-full py-2 rounded-xl bg-terracotta hover:opacity-95 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {settleSubmitting ? 'Saving...' : 'Save Payment & Update Tab'}
                    </button>
                  </form>
                )}

                {/* Previous Orders */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-taupe-500 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Previous Orders ({customerOrders.length})</span>
                    </h4>
                  </div>

                  {customerOrders.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-cream-50 text-xs text-taupe-500 text-center">
                      No orders placed yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {customerOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3.5 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="font-mono font-bold text-xs text-espresso-900">
                                #{ord.orderNumber}
                              </span>
                              <span className="text-[11px] text-taupe-500 ml-2">
                                {ord.tableName} • {formatDateTime(ord.placedAt)}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ord.paymentStatus === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ord.paymentStatus === 'PARTIAL'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-cream-200 text-taupe-700'
                              }`}
                            >
                              {ord.paymentStatus}
                            </span>
                          </div>

                          <div className="text-[11px] text-espresso-800 space-y-0.5">
                            {ord.items.map((it) => (
                              <div key={it.id} className="flex justify-between gap-2">
                                <span className="truncate">
                                  {it.quantity}× {it.dishName}
                                  {it.variant ? ` (${it.variant})` : ''}
                                </span>
                                <span className="font-mono shrink-0">
                                  {formatCurrencyMinor(it.lineTotalMinor, ord.currency)}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-cream-200 flex items-center justify-between gap-2 text-xs">
                            <div className="font-mono">
                              <span className="font-bold text-espresso-900">
                                {formatCurrencyMinor(ord.totalMinor, ord.currency)}
                              </span>
                              {ord.dueMinor > 0 && (
                                <span className="text-[11px] text-amber-800 ml-2">
                                  (Paid {formatCurrencyMinor(ord.paidMinor, ord.currency)} • Due{' '}
                                  {formatCurrencyMinor(ord.dueMinor, ord.currency)})
                                </span>
                              )}
                            </div>

                            {customerCreditEnabled &&
                              (ord.status === 'SERVED' || ord.status === 'COMPLETED') &&
                              ord.paymentStatus !== 'PAID' && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenSettleOrder(ord)}
                                  className="text-[11px] font-semibold text-terracotta hover:underline shrink-0"
                                >
                                  Split / Settle
                                </button>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Credit Ledger History */}
                {ledgerEntries.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-cream-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-taupe-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Credit &amp; Repayment Ledger</span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {ledgerEntries.map((entry) => {
                        const isCredit = entry.type === 'CREDIT_ADDED';
                        return (
                          <div
                            key={entry.id}
                            className="p-2.5 rounded-xl bg-white border border-cream-200 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-espresso-900 truncate">
                                {entry.note ||
                                  (isCredit ? 'Balance added to tab' : 'Repayment received')}
                              </div>
                              <div className="text-[10px] text-taupe-500">
                                {formatDateTime(entry.createdAt)}
                                {entry.recordedBy ? ` • ${entry.recordedBy}` : ''}
                              </div>
                            </div>
                            <div className="text-right shrink-0 font-mono">
                              <div
                                className={`font-bold ${
                                  isCredit ? 'text-amber-700' : 'text-emerald-700'
                                }`}
                              >
                                {isCredit ? '+' : '-'}
                                {formatCurrencyMinor(entry.amountMinor, currency)}
                              </div>
                              <div className="text-[10px] text-taupe-500">
                                Bal {formatCurrencyMinor(entry.balanceAfterMinor, currency)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
