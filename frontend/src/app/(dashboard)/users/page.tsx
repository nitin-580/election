'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { useAuth } from '../../../components/AuthProvider';
import { User, Shield, ShieldAlert, UserPlus, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Watcher');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'Admin') {
      fetchUsers();
    }
  }, [currentUser]);

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="rounded-2xl border border-danger/20 bg-danger/5 p-6 text-center text-danger font-semibold">
        Permission Denied. Only system administrators can access user accounts management.
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setCreateError('Please fill in all fields.');
      return;
    }

    setCreateError('');
    setCreateSuccess('');
    setIsSubmitting(true);
    try {
      const res = await api.post('/users', { username, password, role });
      setUsers([res.data, ...users]);
      setCreateSuccess(`Account for "${username}" created successfully!`);
      setUsername('');
      setPassword('');
      setRole('Watcher');
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess('');
      }, 1500);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBlock = async (id: string, name: string) => {
    if (currentUser?.id === id) {
      alert('You cannot block your own administrator account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to change the block status of user "${name}"?`)) return;

    try {
      const res = await api.patch(`/users/${id}/block`);
      setUsers(users.map((u) => (u.id === id || u._id === id ? res.data : u)));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating user block state.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">System User Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage credentials, assign operational roles, and block access.</p>
        </div>
        <div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
          >
            <UserPlus className="h-4.5 w-4.5" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Users List Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-bold">Authorized Users</h2>
            <p className="text-xs text-muted-foreground mt-0.5">List of active team members and authorization states.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 md:px-6 py-4">Username</th>
                  <th className="px-4 md:px-6 py-4">Role</th>
                  <th className="px-4 md:px-6 py-4 text-center">Status</th>
                  <th className="px-4 md:px-6 py-4 text-right">Suspend Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2"></div>
                      Fetching users list...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id || u._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 md:px-6 py-4 font-bold text-foreground">{u.username}</td>
                      <td className="px-4 md:px-6 py-4 text-xs font-semibold">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${
                          u.role === 'Admin' ? 'bg-indigo-500/10 text-indigo-500' :
                          u.role === 'Editor' ? 'bg-blue-500/10 text-blue-500' :
                          u.role === 'Marker' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          <Shield className="h-3 w-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-center text-xs">
                        {u.isBlocked ? (
                          <span className="inline-flex items-center gap-1 text-danger bg-danger/10 px-2 py-0.5 rounded font-bold">
                            <ShieldAlert className="h-3.5 w-3.5" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleBlock(u.id || u._id, u.username)}
                          disabled={currentUser?.id === (u.id || u._id)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            u.isBlocked
                              ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                              : 'bg-danger/10 text-danger hover:bg-danger/20 disabled:opacity-30'
                          }`}
                        >
                          {u.isBlocked ? 'Unblock User' : 'Block User'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-y-auto animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <UserPlus className="h-5.5 w-5.5 text-primary" />
              Provision Account
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. volunteer_john"
                  className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full rounded-lg border border-border bg-background p-2.5 text-sm mt-1 focus:outline-none"
                >
                  <option value="Watcher">Watcher (Read-only)</option>
                  <option value="Marker">Marker (Update Voted/Mobile)</option>
                  <option value="Editor">Editor (Add/Edit Students)</option>
                  <option value="Admin">Admin (Full Control)</option>
                </select>
              </div>

              {createError && <p className="text-xs text-danger font-semibold mt-2">{createError}</p>}
              {createSuccess && <p className="text-xs text-success font-semibold mt-2">{createSuccess}</p>}

              <div className="flex space-x-3 pt-4 border-t border-border mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-muted hover:bg-muted-foreground/10 text-foreground py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
