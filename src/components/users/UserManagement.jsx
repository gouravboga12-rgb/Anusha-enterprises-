import React, { useState } from 'react';
import {
  Users, UserPlus, Shield, ShieldCheck, ShieldAlert,
  Edit2, UserX, UserCheck, Key, Mail, Phone, Clock, AlertCircle, Trash2
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const UserManagement = ({ dataService, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'partial_access',
    is_active: true
  });
  const [error, setError] = useState('');

  const users = dataService?.getCrmUsers ? dataService.getCrmUsers() : [];
  const isRootAdmin = !currentUser || currentUser.role === 'owner' || currentUser.email === 'shivat9640@gmail.com';

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'partial_access',
      is_active: true
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '', // leave empty unless changing
      role: user.role || 'partial_access',
      is_active: user.is_active !== false
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Staff member name is required.');
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      setError('Either Email ID or Mobile Number is required for login.');
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      setError('Password is required for new staff accounts.');
      return;
    }

    try {
      dataService.saveCrmUser(
        {
          ...(editingUser ? { id: editingUser.id } : {}),
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          password: formData.password.trim() || undefined,
          role: formData.role,
          is_active: formData.is_active
        },
        currentUser
      );
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to save staff account.');
    }
  };

  const handleToggleActive = (user) => {
    if (user.is_active) {
      if (window.confirm(`Deactivate staff access for "${user.name}"? They will not be able to log in.`)) {
        dataService.deactivateCrmUser(user.id, currentUser);
      }
    } else {
      dataService.saveCrmUser({ ...user, is_active: true }, currentUser);
    }
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Are you sure you want to permanently delete staff account for "${user.name}"?\n\nThis will completely remove their access and credentials from the system.`)) {
      try {
        dataService.deleteCrmUser(user.id, currentUser);
      } catch (err) {
        alert(err.message || 'Failed to delete staff account.');
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} color="#0284c7" /> Staff Accounts & Access Control
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Manage staff credentials and assign Full Access or Partial Access roles across your company.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <UserPlus size={15} /> Add Staff Account
        </button>
      </div>

      {/* Role Permissions Information Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px',
        marginBottom: '18px'
      }}>
        <div style={{
          padding: '14px 16px',
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
          backgroundColor: '#f0fdf4'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={18} color="#16a34a" />
            <strong style={{ fontSize: '13px', color: '#166534' }}>Full Access Role</strong>
          </div>
          <p style={{ fontSize: '12px', color: '#15803d', margin: 0, lineHeight: 1.4 }}>
            Can view, record, and edit all sales, purchases, stock movements, and wallet expenses. Allowed to delete records.
          </p>
        </div>

        <div style={{
          padding: '14px 16px',
          borderRadius: '8px',
          border: '1px solid #fed7aa',
          backgroundColor: '#fff7ed'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldAlert size={18} color="#ea580c" />
            <strong style={{ fontSize: '13px', color: '#9a3412' }}>Partial Access Role</strong>
          </div>
          <p style={{ fontSize: '12px', color: '#c2410c', margin: 0, lineHeight: 1.4 }}>
            Operational staff. Can view, create, and correct invoices/purchases with reason, but <strong>CANNOT delete</strong> any transactions or data.
          </p>
        </div>
      </div>

      {/* Staff Accounts Table */}
      <div className="card" style={{ padding: '16px' }}>
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Login Identifier</th>
                <th>Access Role</th>
                <th>Account Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Primary Owner Account (hardcoded admin) */}
              <tr style={{ backgroundColor: 'rgba(2, 132, 199, 0.04)' }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      backgroundColor: '#0284c7', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                    }}>
                      S
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Shiva (Owner)</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Primary Administrator</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '12px', color: '#0f172a' }}>shivat9640@gmail.com</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>+91 96409 12521</div>
                </td>
                <td>
                  <span className="badge badge-active" style={{ fontSize: '11px', fontWeight: 700 }}>
                    👑 Primary Owner
                  </span>
                </td>
                <td>
                  <span className="badge badge-paid">Active</span>
                </td>
                <td>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Current Session</span>
                </td>
                <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  Root Admin
                </td>
              </tr>

              {/* Dynamic CRM Users */}
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No additional staff accounts created yet. Click "Add Staff Account" to invite team members.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%',
                          backgroundColor: user.is_active ? '#e0f2fe' : '#f1f5f9',
                          color: user.is_active ? '#0284c7' : '#94a3b8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                        }}>
                          {(user.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ color: '#0f172a' }}>{user.name}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            Created by {user.created_by || 'Admin'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {user.email && <div style={{ fontSize: '12px', color: '#0f172a' }}>{user.email}</div>}
                      {user.phone && <div style={{ fontSize: '11px', color: '#64748b' }}>+91 {user.phone}</div>}
                    </td>
                    <td>
                      {user.role === 'full_access' ? (
                        <span className="badge badge-active" style={{ fontSize: '11px' }}>Full Access</span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '11px' }}>Partial Access (No Delete)</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-paid' : 'badge-danger'}`}>
                        {user.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {user.last_login_at ? formatDate(user.last_login_at.split('T')[0]) : 'Never logged in'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(user)}
                          title="Edit Staff Details"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          className={`btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                          onClick={() => handleToggleActive(user)}
                          title={user.is_active ? 'Deactivate Access' : 'Reactivate Access'}
                        >
                          {user.is_active ? <><UserX size={12} /> Disable</> : <><UserCheck size={12} /> Enable</>}
                        </button>
                        {isRootAdmin && (
                          <button
                            className="btn btn-sm btn-danger"
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              backgroundColor: '#ef4444',
                              color: '#ffffff',
                              border: '1px solid #dc2626'
                            }}
                            onClick={() => handleDeleteUser(user)}
                            title="Permanently Delete Staff Access"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '500px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
                {editingUser ? `Edit Staff Account — ${editingUser.name}` : 'Create New Staff Account'}
              </h2>
            </div>

            <form onSubmit={handleSave} style={{ padding: '16px' }}>
              {error && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fecaca',
                  color: '#b91c1c', padding: '8px 12px', borderRadius: '6px',
                  marginBottom: '14px', fontSize: '12px'
                }}>
                  {error}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Email ID</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. ramesh@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9848012345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Login Password *'}
                </label>
                <input
                  type="password"
                  className="form-input"
                  required={!editingUser}
                  placeholder={editingUser ? '••••••••' : 'Enter login password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Access Role *</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="partial_access">
                    Partial Access (Standard staff — View/Create/Edit, NO Delete)
                  </option>
                  <option value="full_access">
                    Full Access (Manager — All operations, including Delete)
                  </option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
