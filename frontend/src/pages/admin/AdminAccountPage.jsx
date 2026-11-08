import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  KeyRound,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  Save,
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminAccountPage() {
  const { user, refreshUser } = useAuth();

  // Feedback banner
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // 1. My Profile Form
  const [profileForm, setProfileForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // 2. Change Password Form
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // 3. 4-Digit Owner Access Code ("1830")
  const [accessCode, setAccessCode] = useState('1830');
  const [savingCode, setSavingCode] = useState(false);

  // 4. Admin Accounts CRUD
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'ADMIN',
    is_active: true,
    password: '',
  });
  const [savingAccount, setSavingAccount] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // 5. Audit Logs CRUD
  const [auditLogs, setAuditLogs] = useState([]);

  const loadAll = async () => {
    setLoadingAccounts(true);
    try {
      const [meData, codeData, accsData, logsData] = await Promise.all([
        adminApi.getMe(),
        adminApi.getAccessCode(),
        adminApi.getAccounts(),
        adminApi.getAuditLogs(),
      ]);
      setProfileForm({
        username: meData.username || '',
        first_name: meData.first_name || '',
        last_name: meData.last_name || '',
        email: meData.email || '',
      });
      setAccessCode(codeData?.owner_access_code || '1830');
      setAccounts(accsData || []);
      setAuditLogs(logsData || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load account settings.' });
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback({ type: '', message: '' });
    try {
      await adminApi.updateMe(profileForm);
      await refreshUser();
      await loadAll();
      setFeedback({ type: 'success', message: 'Your account profile has been updated!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      setFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    setSavingPw(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await adminApi.changePassword(pwForm);
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setFeedback({ type: 'success', message: res.detail || 'Password changed successfully!' });
      await loadAll();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingPw(false);
    }
  };

  const handleSaveAccessCode = async (e) => {
    e.preventDefault();
    const cleaned = String(accessCode).replace(/\D/g, '').slice(0, 4);
    if (cleaned.length !== 4) {
      setFeedback({ type: 'error', message: 'Access code must be an exact 4-digit number (e.g., 1830).' });
      return;
    }
    setSavingCode(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await adminApi.updateAccessCode(cleaned);
      setAccessCode(res.owner_access_code);
      setFeedback({
        type: 'success',
        message: `Updated 4-digit Owner Login security code to "${res.owner_access_code}"!`,
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingCode(false);
    }
  };

  const openAddAccount = () => {
    setEditingAccount(null);
    setAccountForm({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      role: 'ADMIN',
      is_active: true,
      password: '',
    });
    setAccountModalOpen(true);
  };

  const openEditAccount = (acc) => {
    setEditingAccount(acc);
    setAccountForm({
      username: acc.username || '',
      first_name: acc.first_name || '',
      last_name: acc.last_name || '',
      email: acc.email || '',
      role: acc.role || 'ADMIN',
      is_active: acc.is_active !== false,
      password: '',
    });
    setAccountModalOpen(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    setFeedback({ type: '', message: '' });
    try {
      const payload = {
        username: accountForm.username.trim(),
        first_name: accountForm.first_name.trim(),
        last_name: accountForm.last_name.trim(),
        email: accountForm.email.trim(),
        role: accountForm.role,
        is_active: accountForm.is_active,
      };
      if (accountForm.password.trim()) {
        payload.password = accountForm.password.trim();
      }

      if (editingAccount) {
        await adminApi.updateAccount(editingAccount.id, payload);
        setFeedback({ type: 'success', message: `Updated account "${payload.username}".` });
      } else {
        await adminApi.createAccount(payload);
        setFeedback({ type: 'success', message: `Created account "${payload.username}".` });
      }
      setAccountModalOpen(false);
      await loadAll();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteAccount(deleteTarget.id);
      setFeedback({ type: 'success', message: `Deleted account "${deleteTarget.username}".` });
      setDeleteTarget(null);
      await loadAll();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
      setDeleteTarget(null);
    }
  };

  const handleDeleteAuditLog = async (id) => {
    try {
      await adminApi.deleteAuditLogItem(id);
      setAuditLogs((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleClearAllAuditLogs = async () => {
    try {
      await adminApi.clearAuditLogs();
      setAuditLogs([]);
      setFeedback({ type: 'success', message: 'Cleared audit log history.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="rounded-3xl bg-[#171B20] border border-[#F6C928]/35 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#F6C928]">
            Security &amp; User Management
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
            Owner Account, Password &amp; Admins CRUD
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Change your password, update your profile, configure the 4-digit security code, and manage Owner/Admin accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddAccount}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Admin Account</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold ${
            feedback.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-200'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Row: Change Password + My Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. CHANGE PASSWORD CARD */}
        <form
          onSubmit={handleChangePassword}
          className="lg:col-span-6 rounded-3xl bg-[#171B20] border border-white/10 p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#F6C928]/15 text-[#F6C928]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-white">
                  Change Password
                </h2>
                <p className="text-xs text-gray-400">
                  Update the password for <strong>{user?.username || 'owner'}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPw((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#F6C928] cursor-pointer"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showPw ? 'Hide' : 'Show'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
              Current Password *
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              placeholder="Enter current password"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white focus:outline-none focus:border-[#F6C928]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                New Password *
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={6}
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white focus:outline-none focus:border-[#F6C928]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                Confirm New Password *
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={6}
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white focus:outline-none focus:border-[#F6C928]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPw}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold bg-[#F6C928] hover:bg-[#FFD83D] text-[#101C28] shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingPw ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </div>
        </form>

        {/* 2. MY PROFILE & 4-DIGIT SECURITY PASSCODE */}
        <div className="lg:col-span-6 space-y-6">
          <form
            onSubmit={handleSaveProfile}
            className="rounded-3xl bg-[#171B20] border border-white/10 p-6 space-y-4"
          >
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <div className="p-2.5 rounded-xl bg-[#23C7DF]/15 text-[#23C7DF]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-white">
                  My Owner Profile
                </h2>
                <p className="text-xs text-gray-400">
                  Update your login username, display name, and email
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.username}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, username: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileForm.first_name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, first_name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileForm.last_name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, last_name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#23C7DF] text-[#101C28] cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </form>

          {/* 3. 4-DIGIT OWNER ACCESS PIN ("1830") */}
          <form
            onSubmit={handleSaveAccessCode}
            className="rounded-3xl bg-[#171B20] border border-[#F6C928]/30 p-6 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F6C928]/15 text-[#F6C928]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    4-Digit Owner Login Passcode
                  </h3>
                  <p className="text-xs text-gray-400">
                    Code required before the Owner Login screen unlocks (Default: 1830)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-32 px-4 py-2.5 rounded-xl bg-[#101C28] border border-[#F6C928]/50 font-display font-black text-xl tracking-widest text-center text-[#F6C928]"
              />
              <button
                type="submit"
                disabled={savingCode}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[#F6C928] text-[#101C28] cursor-pointer"
              >
                {savingCode ? 'Saving...' : 'Save 4-Digit Code'}
              </button>
              {accessCode !== '1830' && (
                <button
                  type="button"
                  onClick={() => setAccessCode('1830')}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white/5 text-gray-300 hover:text-white cursor-pointer"
                >
                  Reset to 1830
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* 4. ADMIN & OWNER ACCOUNTS CRUD */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="font-display font-bold text-xl text-white">
              Admin &amp; Owner Accounts (CRUD)
            </h2>
            <p className="text-xs text-gray-400">
              Create additional administrators, edit roles, reset passwords, or remove accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddAccount}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-[#F6C928] text-[#101C28] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Account</span>
          </button>
        </div>

        {loadingAccounts ? (
          <div className="py-10 flex justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-[#F6C928] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((acc) => {
              const isSelf = acc.id === user?.id;
              return (
                <div
                  key={acc.id}
                  className="p-5 rounded-2xl bg-[#101C28] border border-white/10 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#F6C928]/15 text-[#F6C928] flex items-center justify-center font-display font-black text-base">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base text-white">
                            {acc.username}
                          </h3>
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#23C7DF]/20 text-[#23C7DF]">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {[acc.first_name, acc.last_name].filter(Boolean).join(' ') ||
                            acc.email ||
                            'Authorized CMS Account'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          acc.role === 'OWNER'
                            ? 'bg-[#F6C928] text-[#101C28]'
                            : 'bg-white/10 text-[#FFF1C6]'
                        }`}
                      >
                        {acc.role}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          acc.is_active ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {acc.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditAccount(acc)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-[#F6C928] text-white hover:text-[#101C28] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit / Reset Password</span>
                    </button>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(acc)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-colors cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. ACTIVITY AUDIT LOGS CRUD */}
      <div className="rounded-3xl bg-[#171B20] border border-white/10 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#F6C928]" />
            <h2 className="font-display font-bold text-lg text-white">
              System Audit Logs ({auditLogs.length})
            </h2>
          </div>
          {auditLogs.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllAuditLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-300 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Logs</span>
            </button>
          )}
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No audit log entries recorded.</p>
        ) : (
          <div className="divide-y divide-white/10 max-h-72 overflow-y-auto pr-1 text-xs">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="font-bold text-[#F6C928]">{log.section}</span>
                  <span className="mx-1.5 text-white/30">•</span>
                  <span className="font-semibold text-white">{log.action}</span>
                  {log.summary && (
                    <span className="text-gray-400 ml-1.5">— {log.summary}</span>
                  )}
                  <span className="block sm:inline sm:ml-2 text-[11px] text-gray-500">
                    ({new Date(log.created_at).toLocaleString()})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAuditLog(log.id)}
                  className="p-1.5 text-gray-500 hover:text-red-400 flex-shrink-0"
                  title="Delete log entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT ACCOUNT MODAL */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#171B20] border-t sm:border border-[#F6C928]/40 p-6 sm:p-8 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="font-display font-black text-xl text-white">
                {editingAccount
                  ? `Edit Account: ${editingAccount.username}`
                  : 'Create Admin / Owner Account'}
              </h2>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountForm.username}
                    onChange={(e) =>
                      setAccountForm({ ...accountForm, username: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Role *
                  </label>
                  <select
                    value={accountForm.role}
                    onChange={(e) =>
                      setAccountForm({ ...accountForm, role: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                  >
                    <option value="OWNER">Owner (Full Access)</option>
                    <option value="ADMIN">Authorized Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={accountForm.first_name}
                    onChange={(e) =>
                      setAccountForm({ ...accountForm, first_name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={accountForm.last_name}
                    onChange={(e) =>
                      setAccountForm({ ...accountForm, last_name: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  {editingAccount
                    ? 'New Password (leave blank to keep existing)'
                    : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingAccount}
                  minLength={6}
                  value={accountForm.password}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, password: e.target.value })
                  }
                  placeholder={
                    editingAccount ? 'Enter new password to reset...' : 'Minimum 6 characters'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#101C28] border border-white/15 text-sm text-white"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={accountForm.is_active}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, is_active: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#F6C928]"
                />
                <span>Account is Active (Allowed to Sign In)</span>
              </label>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAccount}
                  className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-[#F6C928] text-[#101C28]"
                >
                  {savingAccount
                    ? 'Saving...'
                    : editingAccount
                    ? 'Save Account Changes'
                    : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-[#171B20] border border-red-500/40 p-6 space-y-4 text-white">
            <h3 className="font-display font-black text-xl">
              Delete Account &ldquo;{deleteTarget.username}&rdquo;?
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              This user will no longer be able to sign into the Owner CMS.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="px-5 py-2 rounded-xl text-xs font-extrabold bg-red-500 text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

