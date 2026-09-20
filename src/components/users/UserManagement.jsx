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
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'partial_access', is_active: true });
  const [error, setError] = useState('');

  const [unlockedPasswords, setUnlockedPasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [showCurrentPasswordInModal, setShowCurrentPasswordInModal] = useState(false);

  const users = dataService?.getCrmUsers ? dataService.getCrmUsers() : [];
  const isRootAdmin = !currentUser || currentUser.role === 'owner' || currentUser.email === 'shivat9640@gmail.com';
  const canViewPassword = !currentUser || currentUser.role === 'owner' || currentUser.role === 'Owner / Administrator' || currentUser.role === 'full_access' || currentUser.email === 'shivat9640@gmail.com';

  const toggleUnlockPassword = (userId) => {
    setUnlockedPasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleCopyPassword = (text, id) => {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text); }
      else {
        const ta = document.createElement('textarea'); ta.value = text;
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      }
      setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
    } catch (e) { console.warn('Copy failed:', e); }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', phone: '', password: '', role: 'partial_access', is_active: true });
    setError(''); setShowModalPassword(false); setShowCurrentPasswordInModal(false); setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '', password: '', role: user.role || 'partial_access', is_active: user.is_active !== false });
    setError(''); setShowModalPassword(false); setShowCurrentPasswordInModal(false); setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault(); setError('');
    if (!formData.name.trim()) { setError('Staff member name is required.'); return; }
    if (!formData.email.trim() && !formData.phone.trim()) { setError('Either Email ID or Mobile Number is required for login.'); return; }
    if (!editingUser && !formData.password.trim()) { setError('Password is required for new staff accounts.'); return; }
    try {
      dataService.saveCrmUser({
        ...(editingUser ? { id: editingUser.id } : {}),
        name: formData.name.trim(), email: formData.email.trim() || null, phone: formData.phone.trim() || null,
        password: formData.password.trim() || undefined, role: formData.role, is_active: formData.is_active
      }, currentUser);
      setIsModalOpen(false);
    } catch (err) { setError(err.message || 'Failed to save staff account.'); }
  };

  const handleToggleActive = (user) => {
    if (user.is_active) {
      if (window.confirm(`Deactivate staff access for "${user.name}"? They will not be able to log in.`))
        dataService.deactivateCrmUser(user.id, currentUser);
    } else {
      dataService.saveCrmUser({ ...user, is_active: true }, currentUser);
    }
  };

  const handleDeleteUser = (user) => {
    if (window.confirm(`Permanently delete staff account for "${user.name}"?\n\nThis will completely remove their access and credentials.`)) {
      try { dataService.deleteCrmUser(user.id, currentUser); }
      catch (err) { alert(err.message || 'Failed to delete staff account.'); }
    }
  };

  const PasswordWidget = ({ userId, storedPassword }) => (
    canViewPassword ? (
      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: unlockedPasswords[userId] ? '#eff6ff' : '#f8fafc', border: `1px solid ${unlockedPasswords[userId] ? '#bfdbfe' : '#e2e8f0'}`, padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>
          <Key size={11} color={unlockedPasswords[userId] ? '#0284c7' : '#94a3b8'} />
          {unlockedPasswords[userId]
            ? <span style={{ fontFamily: 'Consolas, Monaco, monospace', fontWeight: 600, color: '#0f172a', letterSpacing: '0.5px' }}>{storedPassword || '(Encrypted)'}</span>
            : <span style={{ letterSpacing: '2px', color: '#94a3b8', userSelect: 'none' }}>••••••••</span>}
          <button type="button" onClick={() => toggleUnlockPassword(userId)} title={unlockedPasswords[userId] ? 'Hide' : 'Unlock password'}
            style={{ background: 'none', border: 'none', padding: '1px', cursor: 'pointer', color: unlockedPasswords[userId] ? '#0284c7' : '#64748b', display: 'flex', alignItems: 'center' }}>
            {unlockedPasswords[userId] ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
          {unlockedPasswords[userId] && storedPassword && (
            <button type="button" onClick={() => handleCopyPassword(storedPassword, userId)} title="Copy password"
              style={{ background: 'none', border: 'none', padding: '1px', cursor: 'pointer', color: copiedId === userId ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center' }}>
              {copiedId === userId ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>
    ) : null
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Users size={20} color="#0284c7" /> Staff &amp; Access Control
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', margin: '3px 0 0' }}>
            Manage staff credentials and assign Full/Partial Access roles.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd} style={{ fontSize: '13px' }}>
          <UserPlus size={15} /> Add Staff
        </button>
      </div>

      {/* Role Info Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={16} color="#16a34a" />
            <strong style={{ fontSize: '12px', color: '#166534' }}>Full Access Role</strong>
          </div>
          <p style={{ fontSize: '11px', color: '#15803d', margin: 0, lineHeight: 1.4 }}>
            Can view, record, edit all sales, purchases, stock &amp; wallet. Allowed to delete records.
          </p>
        </div>
        <div style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid #fed7aa', backgroundColor: '#fff7ed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldAlert size={16} color="#ea580c" />
            <strong style={{ fontSize: '12px', color: '#9a3412' }}>Partial Access Role</strong>
          </div>
          <p style={{ fontSize: '11px', color: '#c2410c', margin: 0, lineHeight: 1.4 }}>
            Operational staff. Can view, create &amp; correct — <strong>CANNOT delete</strong> any data.
          </p>
        </div>
      </div>

      {/* Staff Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Primary Owner Card */}
        <div className="card" style={{ padding: '16px', background: 'rgba(2,132,199,0.03)', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>S</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>Shiva (Owner)</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Primary Administrator</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-active" style={{ fontSize: '10px' }}>👑 Primary Owner</span>
                  <span className="badge badge-paid" style={{ fontSize: '10px' }}>Active</span>
                </div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '12px', color: '#0f172a' }}>shivat9640@gmail.com</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>+91 96409 12521</div>
                <PasswordWidget userId="owner" storedPassword="9640912521" />
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>Last Login: Current Session</div>
            </div>
          </div>
        </div>

        {/* Dynamic CRM Users */}
        {users.length === 0 ? (
          <div className="card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
            <Users size={36} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>No additional staff accounts yet.</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Click "Add Staff" to invite team members.</div>
          </div>
        ) : (
          users.map((user) => {
            const storedPwd = dataService.getUserPassword ? (dataService.getUserPassword(user.id, currentUser) || '') : '';
            return (
              <div key={user.id} className="card" style={{ padding: '16px', opacity: user.is_active ? 1 : 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: user.is_active ? '#e0f2fe' : '#f1f5f9', color: user.is_active ? '#0284c7' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
                    {(user.name || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + Badges row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{user.name}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Created by {user.created_by || 'Admin'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {user.role === 'full_access'
                          ? <span className="badge badge-active" style={{ fontSize: '10px' }}>Full Access</span>
                          : <span className="badge badge-warning" style={{ fontSize: '10px' }}>Partial Access</span>}
                        <span className={`badge ${user.is_active ? 'badge-paid' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                          {user.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div style={{ marginTop: '8px' }}>
                      {user.email && <div style={{ fontSize: '12px', color: '#0f172a' }}>{user.email}</div>}
                      {user.phone && <div style={{ fontSize: '11px', color: '#64748b' }}>+91 {user.phone}</div>}
                      <PasswordWidget userId={user.id} storedPassword={storedPwd} />
                    </div>

                    {/* Last login */}
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} /> {user.last_login_at ? formatDate(user.last_login_at.split('T')[0]) : 'Never logged in'}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(user)} title="Edit Staff Details" style={{ fontSize: '12px' }}>
                        <Edit2 size={13} /> Edit
                      </button>
                      <button className={`btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                        onClick={() => handleToggleActive(user)}>
                        {user.is_active ? <><UserX size={12} /> Disable</> : <><UserCheck size={12} /> Enable</>}
                      </button>
                      {isRootAdmin && (
                        <button className="btn btn-sm"
                          style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#ef4444', color: '#fff', border: '1px solid #dc2626', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleDeleteUser(user)} title="Permanently Delete">
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-content" style={{ maxWidth: '500px', width: '96%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                {editingUser ? `Edit Staff — ${editingUser.name}` : 'Create New Staff Account'}
              </h2>
            </div>
            <form onSubmit={handleSave} style={{ padding: '16px' }}>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>{error}</div>}

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" required placeholder="e.g. Ramesh Kumar"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Email ID</label>
                  <input type="email" className="form-input" placeholder="e.g. ramesh@gmail.com"
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Mobile Number</label>
                  <input type="tel" className="form-input" placeholder="e.g. 9848012345"
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Login Password *'}
                  </label>
                  {editingUser && canViewPassword && (
                    <button type="button" onClick={() => setShowCurrentPasswordInModal(!showCurrentPasswordInModal)}
                      style={{ background: 'none', border: 'none', padding: 0, fontSize: '11px', color: '#0284c7', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      {showCurrentPasswordInModal ? <EyeOff size={12} /> : <Eye size={12} />}
                      {showCurrentPasswordInModal ? 'Hide' : 'Check Password'}
                    </button>
                  )}
                </div>
                {editingUser && canViewPassword && showCurrentPasswordInModal && (
                  <div style={{ marginBottom: '8px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Key size={13} color="#0284c7" />
                      Current:{' '}
                      <strong style={{ fontFamily: 'Consolas, Monaco, monospace', fontSize: '13px', color: '#0f172a', letterSpacing: '1px', backgroundColor: '#fff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e0f2fe' }}>
                        {dataService.getUserPassword ? (dataService.getUserPassword(editingUser.id, currentUser) || '(Encrypted / Not set)') : '••••••••'}
                      </strong>
                    </span>
                    {dataService.getUserPassword && dataService.getUserPassword(editingUser.id, currentUser) && (
                      <button type="button" onClick={() => handleCopyPassword(dataService.getUserPassword(editingUser.id, currentUser), 'modal-current')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === 'modal-current' ? '#16a34a' : '#0284c7', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                        {copiedId === 'modal-current' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                        {copiedId === 'modal-current' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                )}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type={showModalPassword ? 'text' : 'password'} className="form-input"
                    required={!editingUser} placeholder={editingUser ? '••••••••' : 'Enter login password'}
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{ paddingRight: '40px' }} />
                  <button type="button" onClick={() => setShowModalPassword(!showModalPassword)}
                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: showModalPassword ? '#0284c7' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    {showModalPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Access Role *</label>
                <select className="form-select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="partial_access">Partial Access (Standard staff — View/Create/Edit, NO Delete)</option>
                  <option value="full_access">Full Access (Manager — All operations, including Delete)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
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
