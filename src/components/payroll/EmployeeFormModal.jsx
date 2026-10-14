import React, { useState, useEffect } from 'react';
import { X, User, Phone, Briefcase, IndianRupee, CreditCard, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { getTodayDateString } from '../../utils/formatters';

export const EmployeeFormModal = ({ isOpen, onClose, onSave, employee }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    designation: 'Staff Member',
    base_salary: '',
    payment_mode_preference: 'Cash',
    bank_details: '',
    joining_date: getTodayDateString(),
    status: 'active',
    notes: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        phone: employee.phone || '',
        designation: employee.designation || 'Staff Member',
        base_salary: employee.base_salary !== undefined ? employee.base_salary : '',
        payment_mode_preference: employee.payment_mode_preference || 'Cash',
        bank_details: employee.bank_details || '',
        joining_date: employee.joining_date || getTodayDateString(),
        status: employee.status || 'active',
        notes: employee.notes || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        designation: 'Staff Member',
        base_salary: '',
        payment_mode_preference: 'Cash',
        bank_details: '',
        joining_date: getTodayDateString(),
        status: 'active',
        notes: ''
      });
    }
    setError('');
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Employee name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Contact mobile number is required.');
      return;
    }
    const sal = Number(formData.base_salary);
    if (isNaN(sal) || sal <= 0) {
      setError('Please enter a valid monthly base salary amount (greater than 0).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...(employee ? { id: employee.id } : {}),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        designation: formData.designation.trim(),
        base_salary: sal,
        payment_mode_preference: formData.payment_mode_preference,
        bank_details: formData.bank_details.trim(),
        joining_date: formData.joining_date,
        status: formData.status,
        notes: formData.notes.trim()
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to save employee profile.');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '540px', width: '95%' }}>
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {employee ? 'Edit Employee Details' : 'Add New Employee'}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Set up base monthly salary and payment preferences
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Goud"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9848012345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Designation / Role
                </label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="e.g. Delivery Van Driver"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Monthly Base Salary (₹) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <IndianRupee size={16} color="#0284c7" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="e.g. 20000"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #0284c7', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Preferred Payment Mode
                </label>
                <select
                  value={formData.payment_mode_preference}
                  onChange={(e) => setFormData({ ...formData, payment_mode_preference: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="PhonePe / UPI">PhonePe / GPay (UPI)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  Joining Date
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Bank / UPI Details (Account No, IFSC, or UPI ID)
              </label>
              <div style={{ position: 'relative' }}>
                <CreditCard size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="e.g. SBI A/c: 38291048291, IFSC: SBIN0001234 or 9848012345@ybl"
                  value={formData.bank_details}
                  onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Staff Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#fff' }}
              >
                <option value="active">Active Staff (Currently Employed)</option>
                <option value="inactive">Inactive / Relieved Staff</option>
              </select>
            </div>

            <div style={{ marginTop: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                Notes / Assigned Vehicles / Address
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Assigned explosive delivery van AP-25-T-4590, resident of Nandipet"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Saving...' : employee ? 'Update Employee' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
