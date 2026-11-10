'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Droplets, Utensils, Receipt, HandMetal, QrCode, Clock } from 'lucide-react';

interface CallWaiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  tableName?: string;
  tableId?: string;
  sessionId?: string;
  sessionToken?: string;
  tableExpiresAt?: string;
  isSessionExpired?: boolean;
  expiredTableName?: string | null;
  onSessionExpired?: (tableName?: string | null) => void;
  onSyncTable?: (tableInfo: any | null) => void;
  onRequestRescan?: (reason: 'EXPIRED' | 'REQUIRED') => void;
}

export function CallWaiterModal({
  isOpen,
  onClose,
  restaurantId,
  tableName,
  tableId,
  sessionId,
  sessionToken,
  tableExpiresAt,
  isSessionExpired = false,
  expiredTableName,
  onSessionExpired,
  onSyncTable,
  onRequestRescan,
}: CallWaiterModalProps) {
  const [callType, setCallType] = useState<'ASSISTANCE' | 'WATER' | 'CUTLERY' | 'BILL'>('ASSISTANCE');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientExpired = Boolean(
    tableExpiresAt &&
      !Number.isNaN(Date.parse(tableExpiresAt)) &&
      Date.now() > Date.parse(tableExpiresAt)
  );

  useEffect(() => {
    if (isOpen && clientExpired && tableName) {
      onSessionExpired?.(tableName);
    }
  }, [isOpen, clientExpired, tableName, onSessionExpired]);

  if (!isOpen) return null;

  const hasValidTable = Boolean(tableId) && !isSessionExpired && !clientExpired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidTable) {
      const expiredFlag = isSessionExpired || clientExpired;
      if (clientExpired && tableName) {
        onSessionExpired?.(tableName);
      }
      onRequestRescan?.(expiredFlag ? 'EXPIRED' : 'REQUIRED');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/diner/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          tableId,
          sessionToken: sessionToken || undefined,
          dinerSessionId: sessionId || undefined,
          callType,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'TABLE_MISMATCH') {
          if (data.currentTable?.tableId && data.currentTable?.tableName) {
            onSyncTable?.(data.currentTable);
            setError(
              data.error ||
                `This device is checked in at ${data.currentTable.tableName} and cannot alert waiters for another table.`
            );
            return;
          }
          onSyncTable?.(null);
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
          const expiredFlag = data.code === 'TABLE_SCAN_EXPIRED';
          if (expiredFlag) {
            onSessionExpired?.(data.tableName || tableName || null);
          }
          setError(data.error || 'Please rescan your table QR code before calling a waiter.');
          onRequestRescan?.(expiredFlag ? 'EXPIRED' : 'REQUIRED');
          return;
        }
        throw new Error(data.error || 'Failed to alert staff');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setNotes('');
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error alerting waiter');
    } finally {
      setSubmitting(false);
    }
  };

  const callOptions = [
    {
      id: 'WATER',
      label: 'Water & Glasses',
      desc: 'Fresh water refill or extra tumblers',
      icon: <Droplets className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    },
    {
      id: 'CUTLERY',
      label: 'Cutlery & Napkins',
      desc: 'Forks, spoons, tissues, or extra plates',
      icon: <Utensils className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    },
    {
      id: 'BILL',
      label: 'Bring the Bill',
      desc: 'Ready to settle the check at table',
      icon: <Receipt className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    },
    {
      id: 'ASSISTANCE',
      label: 'Staff Assistance',
      desc: 'Question about menu or need a waiter',
      icon: <HandMetal className="w-5 h-5 text-terracotta" />,
      color: 'border-terracotta/40 bg-terracotta/10 text-terracotta-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in font-sans">
      <div className="bg-[#1C1614] text-cream-100 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-cream-200/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#140E0A]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-terracotta/20 text-terracotta border border-terracotta/30 flex items-center justify-center">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-cream-50 leading-tight">
                Call Waiter to Table
              </h2>
              <p className="text-[11px] text-taupe-400">
                {hasValidTable && tableName ? `Assigned: ${tableName}` : 'Table Scan Required'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-taupe-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {!hasValidTable ? (
          <div className="p-6 text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center justify-center mx-auto">
              {isSessionExpired || clientExpired ? (
                <Clock className="w-7 h-7" />
              ) : (
                <QrCode className="w-7 h-7" />
              )}
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-bold text-cream-50">
                {isSessionExpired || clientExpired
                  ? 'Table Session Timed Out'
                  : 'Scan Table QR Required'}
              </h3>
              <p className="text-xs text-taupe-400 leading-relaxed max-w-xs mx-auto">
                {isSessionExpired || clientExpired
                  ? `No order has been placed from your device in the last 30 minutes${
                      expiredTableName ? ` (${expiredTableName})` : ''
                    }. Please rescan the QR code on your table to alert a waiter.`
                  : 'Please scan the QR code on your table first so our staff knows which table needs assistance.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onRequestRescan?.(isSessionExpired || clientExpired ? 'EXPIRED' : 'REQUIRED');
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-terracotta to-amber-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lifted active:scale-95 flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>
                {isSessionExpired || clientExpired ? 'Rescan Table QR' : 'Scan Table QR'}
              </span>
            </button>
          </div>
        ) : submitted ? (
          <div className="p-8 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="font-serif text-xl font-bold text-cream-50">
              Waiter Alerted!
            </h3>
            <p className="text-xs text-taupe-400 max-w-xs mx-auto">
              Staff has been notified for <span className="font-semibold text-emerald-300">{tableName || 'your table'}</span>. Someone will be right over.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-taupe-400 uppercase tracking-wider mb-2.5">
                What do you need?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {callOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCallType(opt.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      callType === opt.id
                        ? `${opt.color} ring-2 ring-white/20 shadow-md`
                        : 'border-white/10 bg-white/5 text-taupe-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">{opt.icon}</div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-cream-100">{opt.label}</div>
                      <div className="text-[10px] text-taupe-400 line-clamp-1">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-400 mb-1">
                Optional note for staff
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Extra ice, warm water, split check..."
                maxLength={100}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-cream-100 placeholder:text-taupe-500 focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-terracotta to-amber-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lifted active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>{submitting ? 'Alerting Floor Staff...' : `Ring Bell for ${tableName || 'Table'}`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
