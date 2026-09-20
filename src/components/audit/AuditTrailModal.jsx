import React from 'react';
import { Modal } from '../common/Modal';
import { History, ShieldCheck, Clock, User, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const AuditTrailModal = ({ isOpen, onClose, tableName, recordId, recordRef, dataService }) => {
  if (!isOpen) return null;

  const auditRecords = dataService?.getAuditTrail
    ? dataService.getAuditTrail(tableName, recordId)
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Correction Audit Trail — ${recordRef || recordId}`}
      maxWidth="700px"
    >
      <div style={{ padding: '8px 0' }}>
        <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px', marginTop: 0 }}>
          Immutable log of all changes, quantity corrections, and revisions made to this financial record.
        </p>

        {auditRecords.length === 0 ? (
          <div style={{
            padding: '36px',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            color: '#64748b'
          }}>
            <ShieldCheck size={32} color="#10b981" style={{ margin: '0 auto 10px', opacity: 0.8 }} />
            <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>Original Record Untouched</p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
              No corrections or edits have been recorded for this transaction.
            </p>
          </div>
        ) : (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Field Changed</th>
                  <th>Correction Detail</th>
                  <th>Reason Given</th>
                  <th>Changed By</th>
                </tr>
              </thead>
              <tbody>
                {auditRecords.map((r, i) => {
                  const dateObj = new Date(r.changed_at);
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = formatDate(r.changed_at.split('T')[0]);

                  return (
                    <tr key={r.id || i}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{dateStr}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{timeStr}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                          {r.field_name}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>{String(r.old_value)}</span>
                          {' → '}
                          <span style={{ color: '#10b981', fontWeight: 600 }}>{String(r.new_value)}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 500 }}>
                          {r.reason || 'No reason specified'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                          <User size={12} />
                          <span>{r.changed_by || 'Admin'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
