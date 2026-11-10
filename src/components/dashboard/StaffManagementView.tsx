'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  ChefHat,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  RefreshCw,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface StaffMember {
  id: string;
  displayName: string;
  loginId: string;
  role: 'OWNER' | 'MANAGER' | 'KITCHEN' | 'WAITER';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface StaffManagementViewProps {
  restaurant: any;
}

export function StaffManagementView({ restaurant }: StaffManagementViewProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Staff Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addLoginId, setAddLoginId] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addRole, setAddRole] = useState<'OWNER' | 'MANAGER' | 'KITCHEN' | 'WAITER'>('KITCHEN');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password Modal
  const [resetModalStaff, setResetModalStaff] = useState<StaffMember | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Action status
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [copiedLoginId, setCopiedLoginId] = useState<string | null>(null);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/restaurants/${restaurant.id}/staff`);
      if (!res.ok) throw new Error('Failed to load staff accounts');
      const data = await res.json();
      setStaffList(data.staff || []);
    } catch (err: any) {
      setError(err.message || 'Error loading staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurant?.id) {
      loadStaff();
    }
  }, [restaurant?.id]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLoginId(id);
    setTimeout(() => setCopiedLoginId(null), 2000);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addLoginId.trim() || !addPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await fetch(`/api/restaurants/${restaurant.id}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: addName.trim(),
          loginId: addLoginId.trim().toLowerCase(),
          password: addPassword,
          role: addRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff account');

      showNotification(`Staff account created for ${data.staff.displayName}!`);
      setIsAddModalOpen(false);
      setAddName('');
      setAddLoginId('');
      setAddPassword('');
      setAddRole('KITCHEN');
      loadStaff();
    } catch (err: any) {
      setError(err.message || 'Error creating staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStaff || !resetPasswordVal || resetPasswordVal.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsResetting(true);
      setError(null);
      const res = await fetch(`/api/restaurants/${restaurant.id}/staff/${resetModalStaff.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetPasswordVal }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      showNotification(`Password updated for ${resetModalStaff.displayName}. All prior sessions revoked.`);
      setResetModalStaff(null);
      setResetPasswordVal('');
    } catch (err: any) {
      setError(err.message || 'Error resetting password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleActive = async (staff: StaffMember) => {
    try {
      setActionInProgress(staff.id);
      setError(null);
      const res = await fetch(`/api/restaurants/${restaurant.id}/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !staff.isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update staff status');

      showNotification(
        staff.isActive
          ? `Deactivated ${staff.displayName}. Active sessions terminated.`
          : `Re-activated ${staff.displayName}.`
      );
      loadStaff();
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    } finally {
      setActionInProgress(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Owner (Full)
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <UserCheck className="w-3.5 h-3.5" />
            Manager (POS)
          </span>
        );
      case 'KITCHEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <ChefHat className="w-3.5 h-3.5" />
            Kitchen (KDS)
          </span>
        );
      case 'WAITER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Users className="w-3.5 h-3.5" />
            Waiter (Floor)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cream-200 text-espresso-700">
            {role}
          </span>
        );
    }
  };

  const activeCount = staffList.filter((s) => s.isActive).length;
  const kitchenCount = staffList.filter((s) => s.role === 'KITCHEN' && s.isActive).length;
  const waiterCount = staffList.filter((s) => s.role === 'WAITER' && s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-espresso-900">
              Staff & Order Terminal Access
            </h2>
          </div>
          <p className="text-sm text-taupe-500 max-w-2xl">
            Create isolated login accounts for your kitchen chefs, managers, and floor runners. Staff can access the real-time Kitchen Display System (KDS) and order management terminal without needing access to your business billing or menu settings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="/orders/login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cream-300 bg-cream-100 hover:bg-cream-200 text-espresso-900 font-medium text-sm transition-colors shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-taupe-500" />
            Open Order Terminal
          </a>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white font-medium text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
          <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
            Total Staff Accounts
          </div>
          <div className="text-2xl font-serif font-bold text-espresso-900">
            {staffList.length}
          </div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {activeCount} active
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
          <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
            Kitchen (KDS)
          </div>
          <div className="text-2xl font-serif font-bold text-amber-700">
            {kitchenCount}
          </div>
          <div className="text-xs text-taupe-500 mt-1">Cooks & Expeditors</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
          <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
            Waiters & Runners
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-700">
            {waiterCount}
          </div>
          <div className="text-xs text-taupe-500 mt-1">Table Service Staff</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-cream-200 shadow-sm">
          <div className="text-xs font-semibold text-taupe-500 uppercase tracking-wider mb-1">
            Terminal URL
          </div>
          <div className="text-sm font-mono font-medium text-espresso-900 truncate">
            /orders/login
          </div>
          <div className="text-xs text-taupe-500 mt-1">Tablet & desktop friendly</div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-cream-200 flex items-center justify-between bg-cream-50/50">
          <div className="font-serif text-lg font-bold text-espresso-900">
            Registered Staff Roster ({staffList.length})
          </div>
          <button
            onClick={loadStaff}
            disabled={loading}
            className="p-2 rounded-lg text-taupe-500 hover:bg-cream-200 transition-colors"
            title="Refresh staff roster"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-taupe-500">
            <div className="w-8 h-8 border-3 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading staff accounts...
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-taupe-400 mx-auto mb-3 opacity-60" />
            <h3 className="font-serif text-lg font-bold text-espresso-900 mb-1">
              No staff accounts yet
            </h3>
            <p className="text-sm text-taupe-500 max-w-md mx-auto mb-5">
              Create login accounts for your chefs and floor team so they can process incoming orders on kitchen screens or handheld devices.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Staff Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-cream-100 text-taupe-600 font-semibold border-b border-cream-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Staff Member</th>
                  <th className="px-5 py-3.5">Login ID</th>
                  <th className="px-5 py-3.5">Role & Access</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Login</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-cream-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-espresso-900">
                        {staff.displayName}
                      </div>
                      <div className="text-[11px] text-taupe-400">
                        Created {new Date(staff.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-espresso-900 bg-cream-100/70 px-2.5 py-1 rounded-md w-fit border border-cream-200">
                        <span>{staff.loginId}</span>
                        <button
                          onClick={() => handleCopy(staff.loginId, staff.id)}
                          className="text-taupe-400 hover:text-espresso-800 transition-colors ml-1"
                          title="Copy Login ID"
                        >
                          {copiedLoginId === staff.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {getRoleBadge(staff.role)}
                    </td>
                    <td className="px-5 py-4">
                      {staff.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-taupe-400 font-medium text-xs">
                          <span className="w-2 h-2 rounded-full bg-taupe-300" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-taupe-500 text-xs">
                      {staff.lastLoginAt ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-taupe-400" />
                          {new Date(staff.lastLoginAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      ) : (
                        <span className="text-taupe-400 italic">Never</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setResetModalStaff(staff);
                            setResetPasswordVal('');
                          }}
                          className="p-1.5 rounded-lg text-taupe-600 hover:bg-cream-200 hover:text-espresso-900 transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(staff)}
                          disabled={actionInProgress === staff.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            staff.isActive
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={staff.isActive ? 'Deactivate staff account' : 'Reactivate account'}
                        >
                          {staff.isActive ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Staff Member"
        icon={<Plus className="w-4 h-4 text-terracotta" />}
        maxWidth="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-taupe-600 hover:bg-cream-100 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-staff-form"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </>
        }
      >
        <form id="add-staff-form" onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-espresso-900 mb-1">
              Staff Display Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Chef Vikram, Captain Priya"
              value={addName}
              onChange={(e) => {
                setAddName(e.target.value);
                if (!addLoginId) {
                  // Suggest login id based on name
                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 15);
                  setAddLoginId(slug);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-cream-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/40 text-espresso-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-espresso-900 mb-1">
              Unique Terminal Login ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. chef-vikram, kitchen-1, runner-priya"
              value={addLoginId}
              onChange={(e) => setAddLoginId(e.target.value.toLowerCase())}
              className="w-full px-3.5 py-2.5 rounded-xl border border-cream-300 bg-cream-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/40 text-espresso-900 text-sm font-mono"
            />
            <span className="text-[11px] text-taupe-400 mt-1 block">
              Used by the staff member to log in at /orders/login
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-espresso-900 mb-1">
              Initial Password
            </label>
            <div className="relative">
              <input
                type={showAddPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Min 6 characters"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-cream-300 bg-cream-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/40 text-espresso-900 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowAddPassword(!showAddPassword)}
                className="absolute right-3 top-2.5 text-taupe-400 hover:text-espresso-800"
              >
                {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-espresso-900 mb-2">
              Staff Role & Permission Tier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  addRole === 'KITCHEN'
                    ? 'border-terracotta bg-terracotta/5 shadow-sm'
                    : 'border-cream-300 hover:bg-cream-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="KITCHEN"
                  checked={addRole === 'KITCHEN'}
                  onChange={() => setAddRole('KITCHEN')}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5 font-semibold text-xs text-espresso-900 mb-0.5">
                  <ChefHat className="w-3.5 h-3.5 text-amber-600" /> Kitchen (KDS)
                </div>
                <span className="text-[11px] text-taupe-500">
                  Can view incoming orders, accept, cook, and mark food ready.
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  addRole === 'WAITER'
                    ? 'border-terracotta bg-terracotta/5 shadow-sm'
                    : 'border-cream-300 hover:bg-cream-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="WAITER"
                  checked={addRole === 'WAITER'}
                  onChange={() => setAddRole('WAITER')}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5 font-semibold text-xs text-espresso-900 mb-0.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" /> Waiter / Runner
                </div>
                <span className="text-[11px] text-taupe-500">
                  Can view ready tickets, mark served to tables, and check notes.
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  addRole === 'MANAGER'
                    ? 'border-terracotta bg-terracotta/5 shadow-sm'
                    : 'border-cream-300 hover:bg-cream-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="MANAGER"
                  checked={addRole === 'MANAGER'}
                  onChange={() => setAddRole('MANAGER')}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5 font-semibold text-xs text-espresso-900 mb-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Manager (POS)
                </div>
                <span className="text-[11px] text-taupe-500">
                  Can modify order statuses, cancel/void, and view history.
                </span>
              </label>

              <label
                className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                  addRole === 'OWNER'
                    ? 'border-terracotta bg-terracotta/5 shadow-sm'
                    : 'border-cream-300 hover:bg-cream-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="OWNER"
                  checked={addRole === 'OWNER'}
                  onChange={() => setAddRole('OWNER')}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5 font-semibold text-xs text-espresso-900 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Owner Staff
                </div>
                <span className="text-[11px] text-taupe-500">
                  Full operational authority over orders and staff rosters.
                </span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={Boolean(resetModalStaff)}
        onClose={() => setResetModalStaff(null)}
        title="Reset Password"
        icon={<KeyRound className="w-4 h-4 text-terracotta" />}
        maxWidth="md"
        bodyClassName="space-y-4"
        footer={
          resetModalStaff ? (
            <>
              <button
                type="button"
                onClick={() => setResetModalStaff(null)}
                className="px-4 py-2 rounded-xl text-taupe-600 hover:bg-cream-100 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="reset-staff-password-form"
                disabled={isResetting}
                className="px-5 py-2 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
              >
                {isResetting ? 'Saving...' : 'Update Password'}
              </button>
            </>
          ) : undefined
        }
      >
        {resetModalStaff && (
          <>
            <p className="text-xs text-taupe-500">
              Enter a new password for <strong className="text-espresso-900">{resetModalStaff.displayName}</strong> ({resetModalStaff.loginId}). All current active sessions for this employee will be immediately revoked.
            </p>

            <form id="reset-staff-password-form" onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-espresso-900 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-cream-300 bg-cream-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/40 text-espresso-900 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-2.5 text-taupe-400 hover:text-espresso-800"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}

