import React, { useState } from 'react';
import {
  Users, UserPlus, Shield, ShieldCheck, ShieldAlert,
  Edit2, UserX, UserCheck, Key, Mail, Phone, Clock, AlertCircle, Trash2,
  Eye, EyeOff, Copy, Check
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

  // Password visibility & unlock states (Strictly restricted to Full Access / Owner)
  const [unlockedPasswords, setUnlockedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [showCurrentPasswordInModal, setShowCurrentPasswordInModal] = useState(false);

  const users = dataService?.getCrmUsers ? dataService.getCrmUsers() : [];
  const isRootAdmin = !currentUser || currentUser.role === 'owner' || currentUser.email === 'shivat9640@gmail.com';
  const canViewPassword = !currentUser ||
    currentUser.role === 'owner' ||
    currentUser.role === 'Owner / Administrator' ||
    currentUser.role === 'full_access' ||
    currentUser.email === 'shivat9640@gmail.com';

  const toggleUnlockPassword = (userId) => {
    setUnlockedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCopyPassword = (text, id) => {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

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
    setShowModalPassword(false);
    setShowCurrentPasswordInModal(false);
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
    setShowModalPassword(false);
    setShowCurrentPasswordInModal(false);
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
                  {canViewPassword && (
                    <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: unlockedPasswords['owner'] ? '#eff6ff' : '#f8fafc',
                        border: `1px solid ${unlockedPasswords['owner'] ? '#bfdbfe' : '#e2e8f0'}`,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        transition: 'all 0.15s ease'
                      }}>
                        <Key size={11} color={unlockedPasswords['owner'] ? '#0284c7' : '#94a3b8'} />
                        {unlockedPasswords['owner'] ? (
                          <span style={{
                            fontFamily: 'Consolas, Monaco, monospace',
                            fontWeight: 600,
                            color: '#0f172a',
                            letterSpacing: '0.5px'
                          }}>
                            9640912521
                          </span>
                        ) : (
                          <span style={{ letterSpacing: '2px', color: '#94a3b8', fontSize: '12px', userSelect: 'none' }}>
                            ••••••••
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleUnlockPassword('owner')}
                          title={unlockedPasswords['owner'] ? "Hide password" : "Check / Unlock password"}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '2px',
                            cursor: 'pointer',
                            color: unlockedPasswords['owner'] ? '#0284c7' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            marginLeft: '2px'
                          }}
                        >
                          {unlockedPasswords['owner'] ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        {unlockedPasswords['owner'] && (
                          <button
                            type="button"
                            onClick={() => handleCopyPassword('9640912521', 'owner')}
                            title="Copy password"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px',
                              cursor: 'pointer',
                              color: copiedId === 'owner' ? '#16a34a' : '#64748b',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {copiedId === 'owner' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
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
                      {canViewPassword && (
                        <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: unlockedPasswords[user.id] ? '#eff6ff' : '#f8fafc',
                            border: `1px solid ${unlockedPasswords[user.id] ? '#bfdbfe' : '#e2e8f0'}`,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            transition: 'all 0.15s ease'
                          }}>
                            <Key size={11} color={unlockedPasswords[user.id] ? '#0284c7' : '#94a3b8'} />
                            {unlockedPasswords[user.id] ? (
                              <span style={{
                                fontFamily: 'Consolas, Monaco, monospace',
                                fontWeight: 600,
                                color: '#0f172a',
                                letterSpacing: '0.5px'
                              }}>
                                {dataService.getUserPassword ? (dataService.getUserPassword(user.id, currentUser) || '(Encrypted / Not set)') : '••••••••'}
                              </span>
                            ) : (
                              <span style={{ letterSpacing: '2px', color: '#94a3b8', fontSize: '12px', userSelect: 'none' }}>
                                ••••••••
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleUnlockPassword(user.id)}
                              title={unlockedPasswords[user.id] ? "Hide password" : "Check / Unlock password"}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px',
                                cursor: 'pointer',
                                color: unlockedPasswords[user.id] ? '#0284c7' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                marginLeft: '2px'
                              }}
                            >
                              {unlockedPasswords[user.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            {unlockedPasswords[user.id] && dataService.getUserPassword && dataService.getUserPassword(user.id, currentUser) && (
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(dataService.getUserPassword(user.id, currentUser), user.id)}
                                title="Copy password"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '2px',
                                  cursor: 'pointer',
                                  color: copiedId === user.id ? '#16a34a' : '#64748b',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                {copiedId === user.id ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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
        <div className="modal-backdrop">
          <div
            className="modal-card modal-content"
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Login Password *'}
                  </label>
                  {editingUser && canViewPassword && (
                    <button
                      type="button"
                      onClick={() => setShowCurrentPasswordInModal(!showCurrentPasswordInModal)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '0',
                        fontSize: '11px',
                        color: '#0284c7',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Check currently saved password for this account"
                    >
                      {showCurrentPasswordInModal ? <EyeOff size={12} /> : <Eye size={12} />}
                      {showCurrentPasswordInModal ? 'Hide Saved Password' : 'Check Account Password'}
                    </button>
                  )}
                </div>

                {editingUser && canViewPassword && showCurrentPasswordInModal && (
                  <div style={{
                    marginBottom: '8px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px'
                  }}>
                    <span style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Key size={13} color="#0284c7" />
                      Current Password:{' '}
                      <strong style={{
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '13px',
                        color: '#0f172a',
                        letterSpacing: '1px',
                        backgroundColor: '#ffffff',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e0f2fe'
                      }}>
                        {dataService.getUserPassword ? (dataService.getUserPassword(editingUser.id, currentUser) || '(Encrypted / Not set)') : '••••••••'}
                      </strong>
                    </span>
                    {dataService.getUserPassword && dataService.getUserPassword(editingUser.id, currentUser) && (
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(dataService.getUserPassword(editingUser.id, currentUser), 'modal-current')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedId === 'modal-current' ? '#16a34a' : '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}
                        title="Copy saved password"
                      >
                        {copiedId === 'modal-current' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                        {copiedId === 'modal-current' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                )}

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    className="form-input"
                    required={!editingUser}
                    placeholder={editingUser ? '••••••••' : 'Enter login password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: showModalPassword ? '#0284c7' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    title={showModalPassword ? 'Hide password' : 'Show password'}
                  >
                    {showModalPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
