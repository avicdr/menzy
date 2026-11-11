'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Clock,
} from 'lucide-react';
import { useCart } from '@/lib/diner/cart-context';
import {
  DEFAULT_SCAN_TIMEOUT_MINUTES,
  formatMinutesLabel,
  formatSessionExpiredSummary,
  type TableSessionTimeoutKind,
} from '@/lib/diner/table-session-config';
import { formatCurrencyMinor } from '@/lib/payments/plans';
import { Portal } from '@/components/ui/Portal';

interface CartSheetProps {
  restaurantId: string;
  restaurantName: string;
  currency: string;
  sessionId?: string;
  sessionToken?: string;
  defaultTimeoutMinutes?: number;
  onOrderPlaced: (
    order: any,
    tableSession?: {
      lastOrderAt: string;
      expiresAt: string;
      timeoutMinutes?: number;
      timeoutKind?: TableSessionTimeoutKind;
      scanTimeoutMinutes?: number;
      orderExtensionMinutes?: number;
    }
  ) => void;
  onRequestRescan?: (reason: 'EXPIRED' | 'REQUIRED') => void;
  onMenuPaused?: (payload: any) => void;
}

export function CartSheet({
  restaurantId,
  restaurantName,
  currency,
  sessionId,
  sessionToken,
  defaultTimeoutMinutes = DEFAULT_SCAN_TIMEOUT_MINUTES,
  onOrderPlaced,
  onRequestRescan,
  onMenuPaused,
}: CartSheetProps) {
  const {
    items,
    tableInfo,
    setTableInfo,
    tableSessionExpired,
    expiredTableName,
    expiredTimeoutMinutes,
    expiredTimeoutKind,
    expireTableSession,
    updateQuantity,
    removeItem,
    clearCart,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server quote calculation state
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<{
    subtotalMinor: number;
    taxMinor: number;
    serviceChargeMinor: number;
    totalMinor: number;
    taxPercentage: number;
    serviceChargePercentage: number;
  } | null>(null);

  const isClientTableExpired = Boolean(
    tableInfo?.expiresAt &&
      !Number.isNaN(Date.parse(tableInfo.expiresAt)) &&
      Date.now() > Date.parse(tableInfo.expiresAt)
  );

  const activeOrExpiredTimeoutMinutes =
    tableInfo?.timeoutMinutes ?? expiredTimeoutMinutes ?? defaultTimeoutMinutes;
  const activeOrExpiredTimeoutKind =
    tableInfo?.timeoutKind ?? expiredTimeoutKind ?? 'SCAN';

  // If timer crossed expiry before sheet opened, immediately clear stale table info
  useEffect(() => {
    if (isCartOpen && isClientTableExpired && tableInfo) {
      expireTableSession(tableInfo.tableName, {
        timeoutMinutes: tableInfo.timeoutMinutes ?? defaultTimeoutMinutes,
        timeoutKind: tableInfo.timeoutKind ?? 'SCAN',
      });
    }
  }, [isCartOpen, isClientTableExpired, tableInfo, defaultTimeoutMinutes, expireTableSession]);

  // Recalculate quote whenever cart items change
  useEffect(() => {
    if (!isCartOpen || items.length === 0) {
      setQuoteData(null);
      return;
    }

    let isMounted = true;
    async function fetchQuote() {
      try {
        setQuoteLoading(true);
        setError(null);

        const quoteItems = items.map((it) => ({
          menuItemId: it.menuItemId,
          variantId: it.variantId || undefined,
          modifierOptionIds: it.modifiers.map((m) => m.optionId),
          quantity: it.quantity,
          specialInstructions: it.specialInstructions,
        }));

        const res = await fetch('/api/diner/orders/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            items: quoteItems,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (isMounted) {
          if (res.status === 402) {
            setIsCartOpen(false);
            onMenuPaused?.(data);
            return;
          }
          if (!res.ok || !data.valid) {
            setError(data.error || 'Failed to calculate order quote.');
          } else {
            setQuoteData(data);
          }
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error calculating order totals');
      } finally {
        if (isMounted) setQuoteLoading(false);
      }
    }

    fetchQuote();
    return () => {
      isMounted = false;
    };
  }, [items, isCartOpen, restaurantId]);

  if (!isCartOpen) return null;

  const hasValidTable = Boolean(tableInfo?.tableId) && !isClientTableExpired;

  const handlePlaceOrder = async () => {
    if (!hasValidTable) {
      if (isClientTableExpired && tableInfo) {
        expireTableSession(tableInfo.tableName, {
          timeoutMinutes: tableInfo.timeoutMinutes ?? defaultTimeoutMinutes,
          timeoutKind: tableInfo.timeoutKind ?? 'SCAN',
        });
      }
      const expiredFlag = tableSessionExpired || isClientTableExpired;
      setError(
        expiredFlag
          ? formatSessionExpiredSummary({
              timeoutMinutes: activeOrExpiredTimeoutMinutes,
              timeoutKind: activeOrExpiredTimeoutKind,
              tableName: tableInfo?.tableName ?? expiredTableName,
            })
          : 'A valid table is required to send your order to the kitchen. Please scan your table QR code.'
      );
      onRequestRescan?.(expiredFlag ? 'EXPIRED' : 'REQUIRED');
      return;
    }

    if (items.length === 0 || !tableInfo) return;

    setSubmitting(true);
    setError(null);

    try {
      const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const orderItems = items.map((it) => ({
        menuItemId: it.menuItemId,
        variantId: it.variantId || undefined,
        modifierOptionIds: it.modifiers.map((m) => m.optionId),
        quantity: it.quantity,
        specialInstructions: it.specialInstructions,
      }));

      const res = await fetch('/api/diner/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          tableId: tableInfo.tableId,
          dinerSessionId: sessionId || sessionToken || null,
          sessionToken: sessionToken || null,
          items: orderItems,
          specialInstructions,
          idempotencyKey,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 402) {
          setIsCartOpen(false);
          onMenuPaused?.(data);
          return;
        }
        if (data.code === 'TABLE_MISMATCH') {
          if (data.currentTable?.tableId && data.currentTable?.tableName) {
            setTableInfo(data.currentTable);
            setError(
              data.error ||
                `This device is checked in at ${data.currentTable.tableName} and cannot place orders for another table.`
            );
            return;
          }
          setTableInfo(null);
          setError(
            data.error ||
              'Device table mismatch detected. Please scan the QR code on your table to continue.'
          );
          onRequestRescan?.('REQUIRED');
          return;
        }
        if (
          res.status === 403 ||
          data.requiresRescan ||
          data.code === 'TABLE_SCAN_EXPIRED' ||
          data.code === 'TABLE_SCAN_REQUIRED'
        ) {
          const isExpired = data.code === 'TABLE_SCAN_EXPIRED';
          if (isExpired) {
            expireTableSession(data.tableName || tableInfo.tableName, {
              timeoutMinutes: data.timeoutMinutes ?? tableInfo.timeoutMinutes ?? defaultTimeoutMinutes,
              timeoutKind: data.timeoutKind ?? tableInfo.timeoutKind ?? 'SCAN',
            });
          }
          setError(
            data.error ||
              'Your table session has expired. Please rescan your table QR code to order.'
          );
          onRequestRescan?.(isExpired ? 'EXPIRED' : 'REQUIRED');
          return;
        }
        throw new Error(data.error || 'Failed to place order. Please try again.');
      }

      // Clear local cart and notify parent with renewed customized session window
      clearCart();
      setIsCartOpen(false);
      onOrderPlaced(data.order, data.tableSession);
    } catch (err: any) {
      setError(err.message || 'Error submitting order');
    } finally {
      setSubmitting(false);
    }
  };

  const calculatedSubtotal =
    quoteData?.subtotalMinor ??
    items.reduce((acc, it) => {
      const uPrice = it.basePriceMinor + (it.variantSupplementalMinor || 0);
      const mPrice = it.modifiers.reduce((mSum, m) => mSum + m.priceMinor, 0);
      return acc + (uPrice + mPrice) * it.quantity;
    }, 0);

  const calculatedTotal = quoteData?.totalMinor ?? calculatedSubtotal;

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] w-screen h-screen min-h-screen flex items-end sm:items-center justify-center p-0 sm:p-4 bg-espresso-950/75 backdrop-blur-sm animate-modal-backdrop font-sans">
        <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

        <div className="relative w-full max-w-lg max-h-[92vh] bg-[var(--dishora-surface,#FFFFFF)] rounded-t-3xl sm:rounded-3xl shadow-sheet overflow-hidden flex flex-col z-10 text-[var(--dishora-text,#35271F)] border border-cream-200 animate-modal-content">
          {/* Grab Handle */}
          <div className="w-12 h-1.5 bg-cream-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

          {/* Header */}
          <div className="px-6 py-3.5 border-b border-cream-200 flex items-center justify-between shrink-0 bg-cream-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--dishora-accent,#B86D52)]/15 text-[var(--dishora-accent,#B86D52)] flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-[var(--dishora-text,#35271F)] leading-tight">
                  Your Table Order
                </h2>
                <div className="text-xs text-[var(--dishora-muted-text,#7C695C)] flex items-center gap-1.5">
                  {hasValidTable && tableInfo ? (
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                      📍 Dining at {tableInfo.tableName}
                    </span>
                  ) : tableSessionExpired || isClientTableExpired ? (
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold">
                      Session Expired • Rescan Table QR
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                      No Table Scanned (Browse Mode)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-cream-200/80 hover:bg-cream-300 flex items-center justify-center text-espresso-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Scrollable Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto text-taupe-400">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-lg font-bold text-espresso-800">Your cart is empty</h3>
                <p className="text-xs text-taupe-500 max-w-xs mx-auto">
                  Explore our visual menu dishes and add your favorites to place a table order.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-cream-200">
                {items.map((item) => {
                  const uPrice = item.basePriceMinor + (item.variantSupplementalMinor || 0);
                  const mPrice = item.modifiers.reduce((mSum, m) => mSum + m.priceMinor, 0);
                  const lineTotal = (uPrice + mPrice) * item.quantity;

                  return (
                    <div key={item.cartLineId} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover bg-cream-100 shrink-0 border border-cream-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-cream-100 flex items-center justify-center text-xs font-serif text-taupe-400 shrink-0 border border-cream-200">
                          Dish
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-[var(--dishora-text,#35271F)] leading-tight">
                            {item.name}
                          </h4>
                          <span className="font-bold text-sm text-[var(--dishora-text,#35271F)] shrink-0 font-mono">
                            {formatCurrencyMinor(lineTotal, currency)}
                          </span>
                        </div>

                        {(item.variantName || (item.modifiers && item.modifiers.length > 0)) && (
                          <div className="text-[11px] text-[var(--dishora-muted-text,#7C695C)] mt-1 space-y-0.5">
                            {item.variantName && (
                              <div>
                                <span className="font-medium text-espresso-700">Size:</span> {item.variantName}
                              </div>
                            )}
                            {item.modifiers.map((m, idx) => (
                              <div key={idx}>
                                <span className="font-medium text-espresso-700">{m.groupName}:</span> {m.optionName}{' '}
                                {m.priceMinor > 0 ? `(+${formatCurrencyMinor(m.priceMinor, currency)})` : ''}
                              </div>
                            ))}
                          </div>
                        )}

                        {item.specialInstructions && (
                          <div className="text-[11px] text-taupe-500 italic mt-0.5">
                            Note: &quot;{item.specialInstructions}&quot;
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2 pt-1">
                          <div className="flex items-center gap-2 bg-cream-100/80 rounded-lg p-0.5 border border-cream-300">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cartLineId, item.quantity - 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-espresso-700 hover:bg-white transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-semibold text-xs px-1 text-espresso-900 font-mono">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cartLineId, item.quantity + 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-espresso-700 hover:bg-white transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.cartLineId)}
                            className="text-taupe-400 hover:text-red-600 p-1 transition-colors"
                            title="Remove dish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Kitchen Order Special Instructions */}
            {items.length > 0 && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-[var(--dishora-muted-text,#7C695C)] mb-1">
                  Special Requests for Kitchen (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Please bring drinks first; mild spice for children."
                  className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-cream-300 text-xs text-espresso-900 placeholder:text-taupe-400 focus:outline-none focus:ring-1 focus:ring-[var(--dishora-accent,#B86D52)] resize-none"
                />
              </div>
            )}

            {/* Bill Calculation Breakdown */}
            {items.length > 0 && (
              <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 text-xs space-y-1.5">
                <div className="flex justify-between text-taupe-600">
                  <span>Items Subtotal</span>
                  <span className="font-mono">{formatCurrencyMinor(calculatedSubtotal, currency)}</span>
                </div>

                {quoteData && quoteData.taxMinor > 0 && (
                  <div className="flex justify-between text-taupe-600">
                    <span>Taxes ({quoteData.taxPercentage}%)</span>
                    <span className="font-mono">{formatCurrencyMinor(quoteData.taxMinor, currency)}</span>
                  </div>
                )}

                {quoteData && quoteData.serviceChargeMinor > 0 && (
                  <div className="flex justify-between text-taupe-600">
                    <span>Service Charge ({quoteData.serviceChargePercentage}%)</span>
                    <span className="font-mono">{formatCurrencyMinor(quoteData.serviceChargeMinor, currency)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-cream-200 flex justify-between font-bold text-sm text-espresso-900">
                  <span>Total Amount</span>
                  <span className="font-mono text-base text-[var(--dishora-accent,#B86D52)]">
                    {formatCurrencyMinor(calculatedTotal, currency)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Checkout CTA */}
          {items.length > 0 && (
            <div className="p-4 bg-cream-50/90 border-t border-cream-200 shrink-0 space-y-2.5">
              {!hasValidTable ? (
                <>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-start gap-2.5">
                    {tableSessionExpired || isClientTableExpired ? (
                      <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="font-bold">
                        {tableSessionExpired || isClientTableExpired
                          ? activeOrExpiredTimeoutKind === 'ORDER_EXTENSION'
                            ? `Ordering window ended after ${formatMinutesLabel(activeOrExpiredTimeoutMinutes)}`
                            : `Session timed out after ${formatMinutesLabel(activeOrExpiredTimeoutMinutes)} without an order`
                          : 'Table QR scan required to order'}
                      </div>
                      <p className="text-amber-800 leading-relaxed">
                        {tableSessionExpired || isClientTableExpired
                          ? `Your previous connection${expiredTableName ? ` (${expiredTableName})` : ''} expired. Rescan your table QR code to send these items.`
                          : 'Your cart is saved. Scan the QR code on your table to submit your order.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onRequestRescan?.(
                        tableSessionExpired || isClientTableExpired ? 'EXPIRED' : 'REQUIRED'
                      )
                    }
                    className="w-full py-3.5 px-6 rounded-xl bg-[var(--dishora-accent,#B86D52)] hover:opacity-95 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.99]"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>
                      {tableSessionExpired || isClientTableExpired
                        ? 'Rescan Table QR to Order'
                        : 'Scan Table QR to Order'}
                    </span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting || quoteLoading}
                  className="w-full py-3.5 px-6 rounded-xl bg-[var(--dishora-accent,#B86D52)] hover:opacity-95 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Order to Kitchen...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        Place Order (Pay at Table) • {formatCurrencyMinor(calculatedTotal, currency)}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              <div className="text-[11px] text-center text-taupe-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
                <span>Direct kitchen fulfillment • Pay upon service</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
