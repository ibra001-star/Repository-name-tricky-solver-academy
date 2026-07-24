'use client';

import * as React from 'react';
import { Search, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { AdminUser, Role } from '@/types';
import { cn } from '@/lib/utils';

const roleStyles: Record<Role, string> = {
  STUDENT: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300',
  TEACHER: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  ADMIN: 'bg-gold-50 text-gold-700 dark:bg-gold-950/40 dark:text-gold-400',
  SUPER_ADMIN: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
};

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);

    try {
      const data = await api.get<{ users: AdminUser[] }>(`/admin/users?${params.toString()}`);
      setUsers(data.users);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter]);

  React.useEffect(() => {
    const timeout = setTimeout(fetchUsers, 300); // debounce search
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  const toggleActive = async (user: AdminUser) => {
    setBusyId(user.id);
    try {
      await api.patch(`/admin/users/${user.id}/active`, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
    } catch {
      // no-op — the row simply won't update; a toast system would report this in production
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">All roles</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', roleStyles[user.role])}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn('text-xs font-medium', user.isActive ? 'text-green-600' : 'text-destructive')}
                    >
                      {user.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={busyId === user.id}
                      onClick={() => toggleActive(user)}
                    >
                      {user.isActive ? (
                        <>
                          <ShieldOff className="h-3.5 w-3.5" /> Deactivate
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" /> Activate
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No users found.</p>}
        </div>
      )}
    </div>
  );
}
