import { useState, useEffect, useMemo } from 'react';
import { Search, Shield, ShieldCheck, Trash2, AlertCircle, Inbox, Users as UsersIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { fetchAllUsers, adminSetUserRole, adminDeleteUser, type AdminUserRow } from '@/lib/adminApi';

type RoleFilter = 'all' | 'admin' | 'user';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, roleFilter, search]);

  const handleToggleRole = async (u: AdminUserRow) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    setTogglingId(u.id);
    try {
      await adminSetUserRole(u.id, newRole);
      setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, role: newRole } : p));
      showToast(`${u.full_name} is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}.`, 'success');
    } catch {
      showToast('Could not update user role.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminDeleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      showToast('User deleted successfully.', 'success');
      setDeleteTarget(null);
    } catch {
      showToast('Could not delete user.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage user accounts and roles</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'admin', 'user'] as RoleFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors capitalize ${
                roleFilter === r
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-primary-300'
              }`}
            >
              {r === 'all' ? 'All' : r === 'admin' ? 'Admins' : 'Users'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loading size="lg" text="Loading users..." />
        </div>
      )}

      {error && !loading && (
        <Card className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100 dark:bg-error-950/40 mx-auto mb-5">
            <AlertCircle className="h-8 w-8 text-error-600 dark:text-error-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">Could not load users.</p>
          <Button variant="outline" size="md" onClick={loadUsers}>Retry</Button>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto mb-5">
            <Inbox className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">No users found.</p>
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <Card className="overflow-hidden">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <div className="col-span-4">User</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2 text-center">Quizzes</div>
            <div className="col-span-1 text-center">Role</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <div
                  key={u.id}
                  className="grid sm:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg text-white text-xs font-bold flex-shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.full_name} className="h-full w-full rounded-xl object-cover" />
                      ) : (
                        getInitials(u.full_name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {u.full_name}
                        {isSelf && <span className="text-primary-500 text-xs ml-1.5">(You)</span>}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{u.username}</p>
                    </div>
                  </div>

                  <div className="col-span-3 text-sm text-slate-600 dark:text-slate-400 truncate">
                    {u.email}
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="font-display font-bold text-slate-900 dark:text-white">{u.quiz_count}</span>
                  </div>

                  <div className="col-span-1 text-center">
                    {u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 dark:bg-primary-950/40 px-2 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <Shield className="h-3 w-3" />
                        User
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleRole(u)}
                      disabled={isSelf || togglingId === u.id}
                      className="rounded-lg p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                    >
                      {togglingId === u.id ? (
                        <div className="h-4 w-4 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
                      ) : u.role === 'admin' ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      disabled={isSelf}
                      className="rounded-lg p-2 text-slate-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-950/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
          </div>
        </Card>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete User"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteTarget?.full_name}</strong>?
          This will permanently remove their account and all associated quiz data. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
