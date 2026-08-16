import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Crown, User as UserIcon, Check, Search, 
  RefreshCw, GitBranch, Sparkles, AlertCircle, X, ChevronDown, CheckCircle2
} from 'lucide-react';
import { User, UserRole } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdated?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickEmail, setQuickEmail] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isGrantingQuick, setIsGrantingQuick] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // GitHub push status state
  const [isPushingGit, setIsPushingGit] = useState<boolean>(false);
  const [gitStatusMessage, setGitStatusMessage] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'x-user-id': currentUser.id
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to load users list' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error connecting to admin API' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleUpdateRole = async (identifier: string, role: UserRole) => {
    if (!currentUser) return;
    setActionLoadingId(identifier);
    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ identifier, role })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message || `Role updated to ${role}` });
        await fetchUsers();
        if (onUserUpdated) onUserUpdated();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update role' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error updating user role' });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleGrantQuickPremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEmail.trim() || !currentUser) return;
    setIsGrantingQuick(true);
    try {
      const res = await fetch('/api/admin/grant-premium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ email: quickEmail.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message || `Premium granted to ${quickEmail}!` });
        setQuickEmail('');
        await fetchUsers();
        if (onUserUpdated) onUserUpdated();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to grant premium' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error executing grant' });
    } finally {
      setIsGrantingQuick(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSyncToGitHub = async () => {
    setIsPushingGit(true);
    setGitStatusMessage(null);
    try {
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Owner admin sync from Beldi AI (${new Date().toISOString()})` })
      });
      const data = await res.json();
      if (data.success) {
        setGitStatusMessage(data.message || 'Repository successfully pushed to GitHub!');
      } else {
        setGitStatusMessage(`GitHub Sync: ${data.message || 'Failed to push'}`);
      }
    } catch (err: any) {
      setGitStatusMessage(`Sync error: ${err.message}`);
    } finally {
      setIsPushingGit(false);
      setTimeout(() => setGitStatusMessage(null), 6000);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = users.length;
  const premiumUsers = users.filter(u => u.role === 'premium').length;
  const ownerUsers = users.filter(u => u.role === 'owner').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="admin-management-modal"
        className="bg-[#121212] border border-[#2F2F2F] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#242424] flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-5 h-5 text-black font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Owner Admin Control Hub</h3>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  ★ Supreme Owner Rank ★
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Manage registered users, grant Premium privileges instantly, and control platform roles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="p-2 rounded-xl bg-[#212121] hover:bg-[#2A2A2A] text-neutral-300 border border-[#2F2F2F] transition-all cursor-pointer"
              title="Refresh User List"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#212121] hover:bg-[#2A2A2A] text-neutral-400 hover:text-white border border-[#2F2F2F] transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Status Alert */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs animate-fadeIn ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block font-medium">Total Registered Users</span>
                <span className="text-xl font-bold text-white tracking-tight">{totalUsers}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <UserIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block font-medium">Active Premium Users</span>
                <span className="text-xl font-bold text-amber-400 tracking-tight">{premiumUsers}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Crown className="w-4 h-4" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-neutral-400 block font-medium">System Owners</span>
                <span className="text-xl font-bold text-rose-400 tracking-tight">{ownerUsers}</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick Grant Premium by Email */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#1A1A1A] to-indigo-950/30 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">Instant Premium Grant by Email</h4>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                1-Click Upgrade
              </span>
            </div>

            <form onSubmit={handleGrantQuickPremium} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={quickEmail}
                  onChange={(e) => setQuickEmail(e.target.value)}
                  placeholder="Enter user's email address (e.g. friend@gmail.com)..."
                  className="w-full pl-9 pr-3 py-2 bg-[#212121] border border-[#333333] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isGrantingQuick || !quickEmail.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                {isGrantingQuick ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                <span>Grant Premium Plan</span>
              </button>
            </form>
          </div>

          {/* User Directory Table & Search */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                User Management Directory ({filteredUsers.length})
              </h4>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter users by email or name..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#1C1C1C] border border-[#2F2F2F] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-neutral-500 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                <span>Loading registered users from database...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center bg-[#181818] border border-[#262626] rounded-xl text-xs text-neutral-500">
                No users found matching your search.
              </div>
            ) : (
              <div className="border border-[#282828] rounded-xl overflow-hidden bg-[#161616]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-300">
                    <thead className="bg-[#1F1F1F] text-neutral-400 font-semibold border-b border-[#282828]">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Uploads</th>
                        <th className="p-3">Joined</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#242424]">
                      {filteredUsers.map((u) => {
                        const isSelf = u.id === currentUser?.id;
                        const isActionLoading = actionLoadingId === u.id || actionLoadingId === u.email;

                        return (
                          <tr key={u.id} className="hover:bg-[#1C1C1C] transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[11px] font-bold text-white">
                                  {u.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-white">{u.name || 'Anonymous User'}</span>
                                    {isSelf && (
                                      <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 text-[9px] rounded font-mono">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-neutral-400 font-mono">{u.email}</span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              {u.role === 'owner' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-semibold">
                                  <ShieldCheck className="w-3 h-3" /> Owner
                                </span>
                              )}
                              {u.role === 'premium' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
                                  <Crown className="w-3 h-3" /> Premium
                                </span>
                              )}
                              {u.role === 'developer' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[11px] font-semibold">
                                  <Sparkles className="w-3 h-3" /> Developer
                                </span>
                              )}
                              {u.role === 'free' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 text-[11px]">
                                  Free Plan
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-neutral-400 font-mono text-[11px]">
                              {u.role === 'owner' || u.role === 'premium' ? (
                                <span className="text-emerald-400">Unlimited</span>
                              ) : (
                                <span>{u.uploadsCount || 0} / 10</span>
                              )}
                            </td>

                            <td className="p-3 text-neutral-400 text-[11px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {u.role !== 'premium' && u.role !== 'owner' ? (
                                  <button
                                    onClick={() => handleUpdateRole(u.id, 'premium')}
                                    disabled={isActionLoading}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer"
                                    title="Upgrade to Premium"
                                  >
                                    <Crown className="w-3 h-3" />
                                    <span>Make Premium</span>
                                  </button>
                                ) : u.role === 'premium' ? (
                                  <button
                                    onClick={() => handleUpdateRole(u.id, 'free')}
                                    disabled={isActionLoading}
                                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-[11px] font-medium transition-all cursor-pointer"
                                    title="Revoke Premium"
                                  >
                                    Revoke Premium
                                  </button>
                                ) : null}

                                {/* Role Selector Dropdown */}
                                <select
                                  value={u.role}
                                  onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                                  disabled={isActionLoading}
                                  className="px-2 py-1 bg-[#212121] border border-[#333333] rounded-lg text-[11px] text-neutral-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                >
                                  <option value="free">Free</option>
                                  <option value="premium">Premium</option>
                                  <option value="developer">Developer</option>
                                  <option value="owner">Owner</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* GitHub Auto-Sync Panel for Owner */}
          <div className="p-4 rounded-2xl bg-[#171717] border border-[#2A2A2A] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white">GitHub Repository Synchronization</h4>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">
                Target: Abdullahjatt88/beldi-ai
              </span>
            </div>

            <p className="text-[11px] text-neutral-400">
              Push the latest source code, security updates, and admin enhancements to your GitHub repository instantly.
            </p>

            {gitStatusMessage && (
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{gitStatusMessage}</span>
              </div>
            )}

            <button
              onClick={handleSyncToGitHub}
              disabled={isPushingGit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPushingGit ? 'animate-spin' : ''}`} />
              <span>{isPushingGit ? 'Pushing Code to GitHub...' : 'Push All Changes to GitHub Now'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#242424] bg-[#171717] flex items-center justify-between text-xs text-neutral-400">
          <span>Logged in as: <strong className="text-white">{currentUser?.email}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#262626] hover:bg-[#333333] text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            Close Admin Hub
          </button>
        </div>
      </div>
    </div>
  );
};
