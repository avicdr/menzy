'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Plus,
  Layers,
  RotateCw,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Copy,
  Check,
  Printer,
  ExternalLink,
  Sparkles,
  Eye,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface TablesManagementViewProps {
  restaurant: any;
  onSubscriptionExpired?: (payload: any) => void;
}

export function TablesManagementView({ restaurant, onSubscriptionExpired }: TablesManagementViewProps) {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Individual Table Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tableName, setTableName] = useState('');
  const [tableSection, setTableSection] = useState('Main Dining');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Table Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkCount, setBulkCount] = useState(9);
  const [bulkNamingPattern, setBulkNamingPattern] = useState('Table {number}');
  const [bulkSection, setBulkSection] = useState('Main Dining');
  const [bulkCapacity, setBulkCapacity] = useState(4);

  // QR Preview Modal
  const [previewTable, setPreviewTable] = useState<any | null>(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string | null>(null);
  const [previewScanUrl, setPreviewScanUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Bulk Export Printable View
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportData, setExportData] = useState<any | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables`);
      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        onSubscriptionExpired?.(payload);
        return;
      }
      if (!res.ok) throw new Error('Failed to load tables');
      const data = await res.json();
      setTables(data.tables || []);
    } catch (err: any) {
      setError(err.message || 'Error loading tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurant?.id) loadTables();
  }, [restaurant?.id]);

  // Lock body scroll and listen for Escape key when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isCreateModalOpen || isBulkModalOpen || Boolean(previewTable) || isExportOpen;
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsBulkModalOpen(false);
        setPreviewTable(null);
        setIsExportOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCreateModalOpen, isBulkModalOpen, previewTable, isExportOpen]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tableName.trim(),
          section: tableSection,
          capacity: tableCapacity,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setIsCreateModalOpen(false);
        onSubscriptionExpired?.(data);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create table');

      setIsCreateModalOpen(false);
      setTableName('');
      showSuccess(`Table "${data.table.name}" created successfully!`);
      await loadTables();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: bulkCount,
          namingPattern: bulkNamingPattern,
          section: bulkSection,
          capacity: bulkCapacity,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setIsBulkModalOpen(false);
        onSubscriptionExpired?.(data);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to bulk generate tables');

      setIsBulkModalOpen(false);
      showSuccess(`Generated ${data.createdCount} tables successfully!`);
      await loadTables();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (table: any) => {
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !table.isActive }),
      });

      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        onSubscriptionExpired?.(payload);
        return;
      }
      if (res.ok) {
        showSuccess(`Table "${table.name}" ${!table.isActive ? 'activated' : 'disabled'}.`);
        await loadTables();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRotateQr = async (table: any) => {
    if (!confirm(`Rotate QR code for "${table.name}"? Previous printed QR codes for this table will stop working.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables/${table.id}/rotate-qr`, {
        method: 'POST',
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        onSubscriptionExpired?.(data);
        return;
      }
      if (res.ok) {
        showSuccess(`QR code rotated for "${table.name}". New version active.`);
        await loadTables();
      } else {
        alert(data.error || 'Failed to rotate QR');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleArchiveTable = async (table: any) => {
    if (!confirm(`Archive table "${table.name}"? It will be removed from active lists while preserving historical orders.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables/${table.id}`, {
        method: 'DELETE',
      });

      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        onSubscriptionExpired?.(payload);
        return;
      }
      if (res.ok) {
        showSuccess(`Table "${table.name}" archived.`);
        await loadTables();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleOpenPreview = async (table: any) => {
    setPreviewTable(table);
    setPreviewLoading(true);
    setPreviewQrDataUrl(null);
    setPreviewScanUrl(table.scanUrl || null);

    try {
      const res = await fetch(`/api/qr/generate?slug=${restaurant.slug}&tableId=${table.id}&format=dataUrl`);
      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        setPreviewTable(null);
        onSubscriptionExpired?.(payload);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPreviewQrDataUrl(data.qrDataUrl);
        if (data.targetUrl) {
          setPreviewScanUrl(data.targetUrl);
        }
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenBulkExport = async () => {
    setIsExportOpen(true);
    setExportLoading(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurant.id}/tables/qr-export`);
      if (res.status === 402) {
        const payload = await res.json().catch(() => ({}));
        setIsExportOpen(false);
        onSubscriptionExpired?.(payload);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setExportData(data);
      }
    } finally {
      setExportLoading(false);
    }
  };

  const activeTablesCount = tables.filter((t) => t.isActive).length;
  const activeOrdersTotal = tables.reduce((sum, t) => sum + (t.activeOrderCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-espresso-900">Dining Tables & QR Codes</h2>
          <p className="text-xs sm:text-sm text-taupe-500">
            Create dining tables, generate unguessable QR codes, and download printable table tents.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenBulkExport}
            className="px-3.5 py-2 rounded-xl bg-white border border-cream-300 hover:bg-cream-50 text-espresso-800 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-terracotta" />
            <span>Print All Table Tents</span>
          </button>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Bulk Generate</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Single Table</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
          <span className="text-[10px] font-semibold text-taupe-500 uppercase tracking-wider">Total Dining Tables</span>
          <div className="text-3xl font-bold font-mono text-espresso-900 mt-1">{tables.length}</div>
          <div className="text-xs text-taupe-400 mt-1">Configured for {restaurant.displayName}</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
          <span className="text-[10px] font-semibold text-taupe-500 uppercase tracking-wider">Active Tables</span>
          <div className="text-3xl font-bold font-mono text-emerald-700 mt-1">{activeTablesCount}</div>
          <div className="text-xs text-taupe-400 mt-1">{tables.length - activeTablesCount} currently paused</div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-cream-200 shadow-soft">
          <span className="text-[10px] font-semibold text-taupe-500 uppercase tracking-wider">Tables with Active Orders</span>
          <div className="text-3xl font-bold font-mono text-terracotta mt-1">{activeOrdersTotal}</div>
          <div className="text-xs text-taupe-400 mt-1">Live customer dining sessions</div>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-taupe-500">Loading tables & QR tokens...</p>
        </div>
      ) : tables.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-cream-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto text-taupe-400">
            <QrCode className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-espresso-900">No tables created yet</h3>
          <p className="text-xs text-taupe-500 max-w-sm mx-auto">
            Generate dining tables with unique, permanent QR codes for your café or restaurant. Diners scan each table's QR to browse and send orders to your kitchen.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-espresso-900 text-white text-xs font-semibold shadow hover:bg-espresso-800 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk Generate Tables</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-terracotta text-white text-xs font-semibold shadow hover:bg-terracotta-600 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Single Table</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`p-5 rounded-2xl border transition-all shadow-soft flex flex-col justify-between ${
                table.isActive ? 'bg-white border-cream-200' : 'bg-cream-100/50 border-cream-300 opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-lg text-espresso-900 leading-tight">{table.name}</h3>
                    <div className="text-xs text-taupe-500 mt-0.5">
                      {table.section || 'Main Dining'} • Capacity: {table.capacity || 4} guests
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      table.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-cream-200 text-taupe-500'
                    }`}
                  >
                    {table.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                {/* Active Orders Indicator */}
                {table.activeOrderCount > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
                    <span>Active Orders</span>
                    <span className="font-mono bg-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                      {table.activeOrderCount} in kitchen
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Permanent QR Code • Never Expires</span>
                </div>

                <div className="text-[11px] text-taupe-400 font-mono">
                  QR Token Version: v{table.qrVersion}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-4 mt-3 border-t border-cream-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenPreview(table)}
                    className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="View QR Code & Table Tent"
                  >
                    <Eye className="w-3.5 h-3.5 text-terracotta" />
                    <span className="text-[11px]">View QR</span>
                  </button>

                  <a
                    href={`/api/qr/generate?slug=${restaurant.slug}&tableId=${table.id}&format=svg`}
                    download
                    className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-espresso-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Download SVG QR"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[11px]">SVG</span>
                  </a>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRotateQr(table)}
                    className="p-2 rounded-lg text-taupe-500 hover:text-amber-700 hover:bg-cream-100 transition-colors"
                    title="Rotate QR Code Token (Invalidates old printed codes)"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleActive(table)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      table.isActive
                        ? 'text-taupe-500 hover:text-red-700 hover:bg-red-50'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {table.isActive ? 'Disable' : 'Enable'}
                  </button>

                  <button
                    onClick={() => handleArchiveTable(table)}
                    className="p-2 rounded-lg text-taupe-400 hover:text-red-600 hover:bg-cream-100 transition-colors"
                    title="Archive table"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD SINGLE TABLE
      ========================================================================= */}
      {/* =========================================================================
          MODAL: CREATE SINGLE TABLE
      ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Dining Table"
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-taupe-500 hover:text-espresso-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-table-form"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Table'}
            </button>
          </>
        }
      >
        <form id="create-table-form" onSubmit={handleCreateTable} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-taupe-600 mb-1">
              Table Name or Number
            </label>
            <input
              type="text"
              required
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. Table 04, Patio 02, VIP Booth"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Section / Area
              </label>
              <input
                type="text"
                value={tableSection}
                onChange={(e) => setTableSection(e.target.value)}
                placeholder="e.g. Main Floor, Patio, Bar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Seating Capacity
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={tableCapacity}
                onChange={(e) => setTableCapacity(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: BULK GENERATE TABLES
      ========================================================================= */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Generate Tables"
        icon={<Layers className="w-4 h-4 text-amber-400" />}
        maxWidth="lg"
        bodyClassName="space-y-4"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-taupe-500 hover:text-espresso-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="bulk-tables-form"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Generating...' : `Generate ${bulkCount} Tables`}
            </button>
          </>
        }
      >
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Permanent, Life-Persistent QR Codes:</span>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Generated table QR codes are persistent and never expire. You can print them on tabletop tents or acrylic stands once and use them indefinitely.
            </p>
          </div>
        </div>

        <form id="bulk-tables-form" onSubmit={handleBulkCreate} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-taupe-700">
                How Many Tables Do You Have?
              </label>
              <span className="text-xs font-bold font-mono text-espresso-900">
                {bulkCount} {bulkCount === 1 ? 'Table' : 'Tables'}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              {[5, 10, 15, 20, 25, 30].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBulkCount(num)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    bulkCount === num
                      ? 'bg-espresso-900 text-white shadow-xs scale-105'
                      : 'bg-cream-100 text-espresso-800 hover:bg-cream-200'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <input
              type="number"
              min="1"
              max="100"
              required
              value={bulkCount}
              onChange={(e) => setBulkCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-taupe-600 mb-1">
              Naming Pattern
            </label>
            <input
              type="text"
              required
              value={bulkNamingPattern}
              onChange={(e) => setBulkNamingPattern(e.target.value)}
              placeholder="Table {number} (e.g. Table 01, Table 02...)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
            />
            <div className="text-[11px] text-taupe-500 mt-1 flex flex-wrap items-center justify-between gap-2">
              <span>Use &#123;number&#125; to insert auto-incrementing numbers</span>
              <span className="font-medium text-espresso-900">
                Preview: {bulkNamingPattern.replace('{number}', '01')} ... {bulkNamingPattern.replace('{number}', bulkCount < 10 ? `0${bulkCount}` : `${bulkCount}`)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Section
              </label>
              <input
                type="text"
                value={bulkSection}
                onChange={(e) => setBulkSection(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-taupe-600 mb-1">
                Default Capacity
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={bulkCapacity}
                onChange={(e) => setBulkCapacity(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 text-sm focus:outline-none focus:ring-1 focus:ring-terracotta"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* =========================================================================
          MODAL: VIEW QR & TABLE TENT PREVIEW
      ========================================================================= */}
      <Modal
        isOpen={Boolean(previewTable)}
        onClose={() => setPreviewTable(null)}
        title={<span className="text-xs font-bold font-mono text-terracotta">Table Tent Preview</span>}
        maxWidth="sm"
        className="font-sans"
        bodyClassName="text-center space-y-4"
      >
        {previewTable && (
          <>
            {/* Printable Table Tent Mockup */}
            <div className="p-6 bg-cream-50 rounded-2xl border-2 border-dashed border-cream-300 space-y-3 shadow-inner">
              <div className="font-serif text-lg font-bold text-espresso-900 tracking-tight">
                {restaurant.displayName}
              </div>
              <div className="text-2xl font-bold text-terracotta font-serif">
                {previewTable.name}
              </div>
              <p className="text-[11px] text-taupe-500 max-w-[200px] mx-auto">
                Scan to explore our visual interactive menu & send orders directly to the kitchen.
              </p>

              {previewLoading ? (
                <div className="w-48 h-48 flex items-center justify-center mx-auto bg-white rounded-xl">
                  <div className="w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
                </div>
              ) : previewQrDataUrl ? (
                <img
                  src={previewQrDataUrl}
                  alt={`QR for ${previewTable.name}`}
                  className="w-48 h-48 mx-auto rounded-xl shadow-xs border border-cream-200 bg-white p-2"
                />
              ) : null}

              <div className="text-[10px] font-mono text-taupe-400 uppercase tracking-widest pt-1">
                Powered by Menzy
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`/api/qr/generate?slug=${restaurant.slug}&tableId=${previewTable.id}&format=svg`}
                download={`${previewTable.name}-qr.svg`}
                className="py-2.5 px-3 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save SVG</span>
              </a>

              <a
                href={previewScanUrl || previewTable.scanUrl || `/m/${restaurant.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-terracotta hover:bg-terracotta-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test Menu</span>
              </a>
            </div>
          </>
        )}
      </Modal>

      {/* =========================================================================
          MODAL: BULK PRINTABLE TABLE TENTS
      ========================================================================= */}
      <Modal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Bulk Printable Table Tents"
        subtitle={`Ready to print for all ${tables.length} tables in ${restaurant.displayName}.`}
        maxWidth="5xl"
        className="font-sans"
        headerActions={
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl bg-espresso-900 hover:bg-espresso-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print All Tents</span>
          </button>
        }
      >
        {exportLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-taupe-500">Rendering high-res QR codes for all tables...</p>
          </div>
        ) : exportData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {exportData.tables.map((t: any) => (
              <div
                key={t.id}
                className="p-5 bg-cream-50/70 border-2 border-dashed border-cream-300 rounded-2xl text-center space-y-2.5 shadow-xs"
              >
                <div className="font-serif text-sm font-bold text-espresso-900">
                  {exportData.restaurantName}
                </div>
                <div className="text-2xl font-bold font-serif text-terracotta">
                  {t.name}
                </div>
                <p className="text-[10px] text-taupe-500 max-w-[180px] mx-auto">
                  Scan to explore our visual interactive menu & send orders directly to the kitchen.
                </p>
                <img
                  src={t.qrDataUrl}
                  alt={t.name}
                  className="w-40 h-40 mx-auto rounded-xl border border-cream-200 bg-white p-2 shadow-xs"
                />
                <div className="text-[9px] font-mono uppercase tracking-widest text-taupe-400">
                  Powered by Menzy
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

