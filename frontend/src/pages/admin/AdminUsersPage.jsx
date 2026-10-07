import React, { useEffect, useState } from 'react';
import { Search, Users, Shield, ShieldCheck, UserCheck, Trash2, RefreshCw } from 'lucide-react';
import api from '../../services/api.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import AdminLayout from './AdminLayout.jsx';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (roleFilter) query.set('role', roleFilter);
      query.set('limit', '30');

      const res = await api.get(`/admin/users?${query.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.data.users || []);
        setPagination(res.data.data.pagination || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;

    setUpdatingId(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const inputStyle = {
    padding: '10px 14px', backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff',
    fontSize: '0.88rem', outline: 'none'
  };

  return (
    <AdminLayout>
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: '#fff' }}>Users & Permissions</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Manage user profiles, assign administrative permissions, and audit accounts</p>
          </div>
          <button onClick={fetchUsers} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchUsers()}
              style={{ ...inputStyle, width: '100%', paddingLeft: '40px' }}
            />
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[['', 'All Users'], ['admin', 'Admins Only'], ['user', 'Standard Users']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setRoleFilter(val)}
                style={{
                  padding: '9px 16px', borderRadius: '6px', border: '1px solid',
                  borderColor: roleFilter === val ? 'var(--accent-red)' : 'var(--border-color)',
                  backgroundColor: roleFilter === val ? 'var(--accent-red)' : 'var(--bg-card)',
                  color: '#fff', fontSize: '0.85rem', cursor: 'pointer', fontWeight: roleFilter === val ? '700' : '400'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <button onClick={fetchUsers} className="btn-outline">Search</button>
        </div>

        {loading ? <LoadingSpinner message="Loading users..." /> : (
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                  {['User', 'Contact', 'City', 'Language', 'Role', 'Joined Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: u.role === 'admin' ? 'rgba(234,179,8,0.2)' : 'rgba(229,9,20,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: u.role === 'admin' ? '#eab308' : 'var(--accent-red)', fontWeight: '700', fontSize: '0.9rem' }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>{u.name || 'Anonymous User'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {u.phone || 'N/A'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {u.city || 'Mumbai'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {u.preferredLanguage || 'English'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700',
                        backgroundColor: u.role === 'admin' ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)',
                        color: u.role === 'admin' ? '#eab308' : 'var(--text-secondary)',
                        border: `1px solid ${u.role === 'admin' ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.1)'}`
                      }}>
                        {u.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleRoleToggle(u._id, u.role)}
                          disabled={updatingId === u._id}
                          title={u.role === 'admin' ? 'Demote to regular user' : 'Promote to admin'}
                          style={{
                            padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600',
                            backgroundColor: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                            border: `1px solid ${u.role === 'admin' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}`,
                            color: u.role === 'admin' ? '#ef4444' : '#eab308',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}
                          title="Delete user"
                        >
                          <Trash2 size={14} />
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
    </AdminLayout>
  );
}
