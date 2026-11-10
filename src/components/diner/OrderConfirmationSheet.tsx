'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, ChefHat, Bell, Utensils, ArrowRight, RefreshCw, ShoppingBag } from 'lucide-react';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import { Portal } from '@/components/ui/Portal';

interface OrderConfirmationSheetProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onAddMoreItems: () => void;
}

export function OrderConfirmationSheet({
  order,
  isOpen,
  onClose,
  onAddMoreItems,
}: OrderConfirmationSheetProps) {
  const [currentOrder, setCurrentOrder] = useState<any>(order);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  // Live polling of order status every 4 seconds while active
  useEffect(() => {
    if (!isOpen || !order?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/diner/orders/${order.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) setCurrentOrder(data.order);
        }
      } catch (err) {
        console.error('Order tracking poll error:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, order?.id]);

  if (!isOpen || !currentOrder) return null;

  const statuses = [
    { key: 'PLACED', label: 'Order Sent', icon: Clock },
    { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
    { key: 'READY', label: 'Ready', icon: Bell },
    { key: 'SERVED', label: 'Served', icon: Utensils },
  ];

  const statusIndexMap: Record<string, number> = {
    PLACED: 0,
    ACCEPTED: 1,
    PREPARING: 2,
    READY: 3,
    SERVED: 4,
    COMPLETED: 4,
    REJECTED: -1,
    CANCELLED: -1,
  };

  const currentStep = statusIndexMap[currentOrder.status] ?? 0;
  const isRejectedOrCancelled = currentOrder.status === 'REJECTED' || currentOrder.status === 'CANCELLED';

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/diner/orders/${currentOrder.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) setCurrentOrder(data.order);
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-end sm:items-center justify-center p-0 sm:p-4 bg-espresso-950/75 backdrop-blur-sm animate-modal-backdrop font-sans">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative w-full max-w-lg max-h-[92vh] bg-[var(--dishora-surface,#FFFFFF)] rounded-t-3xl sm:rounded-3xl shadow-sheet overflow-hidden flex flex-col z-10 text-[var(--dishora-text,#35271F)] border border-cream-200 animate-modal-content">
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-cream-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-200 flex items-center justify-between shrink-0 bg-cream-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-espresso-900 leading-tight">
                Order #{currentOrder.orderNumber}
              </h2>
              <div className="text-xs text-taupe-600">
                {currentOrder.tableName ? `Table: ${currentOrder.tableName}` : 'Table Order'} • Live Kitchen Status
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshStatus}
              disabled={refreshing}
              className="p-1.5 rounded-lg text-taupe-500 hover:text-espresso-800 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-terracotta' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-cream-200/80 hover:bg-cream-300 flex items-center justify-center text-espresso-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Main Status Headline */}
          <div className="text-center space-y-1 py-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-taupe-500">Kitchen Progress</span>
            <h3 className="text-2xl font-serif font-bold text-espresso-900">
              {isRejectedOrCancelled ? (
                <span className="text-red-700">Order {currentOrder.status}</span>
              ) : currentOrder.status === 'READY' ? (
                <span className="text-amber-700">Your Dishes are Ready!</span>
              ) : currentOrder.status === 'PREPARING' ? (
                <span className="text-terracotta">Chef is Preparing Your Dishes</span>
              ) : currentOrder.status === 'ACCEPTED' ? (
                <span className="text-emerald-700">Order Accepted by Kitchen</span>
              ) : currentOrder.status === 'SERVED' ? (
                <span className="text-sage-800">Served & Enjoy Your Meal</span>
              ) : (
                <span className="text-espresso-800">Awaiting Kitchen Confirmation</span>
              )}
            </h3>
            <p className="text-xs text-taupe-500 max-w-sm mx-auto">
              {isRejectedOrCancelled
                ? 'Please speak with your server or floor manager for assistance.'
                : 'Your server and kitchen display have been notified. We will prepare your food fresh.'}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          {!isRejectedOrCancelled && (
            <div className="py-2">
              <div className="grid grid-cols-5 gap-1 relative">
                {statuses.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center space-y-1.5">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'bg-[var(--dishora-accent,#B86D52)] text-white ring-4 ring-terracotta/20 shadow-md scale-110'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-cream-200 text-taupe-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] leading-tight font-medium ${
                          isCurrent
                            ? 'font-bold text-[var(--dishora-accent,#B86D52)]'
                            : isDone
                            ? 'text-espresso-800'
                            : 'text-taupe-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ordered Dishes Summary */}
          <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-3">
            <div className="flex items-center justify-between border-b border-cream-200 pb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-espresso-800">
                Dishes in this Order
              </h4>
              <span className="text-xs font-mono font-semibold text-espresso-800">
                {formatCurrencyMinor(currentOrder.totalMinor, currentOrder.currency)}
              </span>
            </div>

            <div className="divide-y divide-cream-200/60 text-xs">
              {(currentOrder.items || []).map((it: any, index: number) => (
                <div key={index} className="py-2 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-espresso-900">
                      {it.quantity}× {it.dishName || it.dishNameSnapshot}
                    </span>
                    {it.variant && <div className="text-[11px] text-taupe-600">Option: {it.variant}</div>}
                    {it.specialInstructions && (
                      <div className="text-[11px] text-taupe-500 italic">"{it.specialInstructions}"</div>
                    )}
                  </div>
                  <span className="font-mono text-taupe-700">
                    {formatCurrencyMinor(it.lineTotalMinor, currentOrder.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-cream-50/90 border-t border-cream-200 shrink-0 flex items-center gap-3">
          <button
            onClick={onAddMoreItems}
            className="flex-1 py-3 px-4 rounded-xl bg-white border border-cream-300 hover:bg-cream-100 text-espresso-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-terracotta" />
            <span>Add More Dishes</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-[var(--dishora-accent,#B86D52)] hover:opacity-95 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Continue Browsing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </Portal>
);
}

