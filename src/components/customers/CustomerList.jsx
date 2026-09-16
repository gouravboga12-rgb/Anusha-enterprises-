import React, { useState } from 'react';
import { Search, PlusCircle, User, Phone, MapPin, Eye, Edit, Receipt, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const CustomerList = ({
  customers,
  dataService,
  onSelectCustomer,
  onEditCustomer,
  onAddCustomer,
  onOpenNewSale,
  onOpenPayment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPendingOnly, setFilterPendingOnly] = useState(false);

  const handleDeleteCustomer = (cust) => {
    const ledger = dataService.getCustomerLedger(cust.id);
    const warning = ledger.pendingBalance > 0
      ? `\n\nWarning: This customer still owes ₹${ledger.pendingBalance.toLocaleString()}!`
      : '';
    if (window.confirm(`Delete customer account "${cust.name}"?${warning}\n\nThis will remove their account and ledger history.`)) {
      dataService.deleteCustomer(cust.id);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cust.mobile && cust.mobile.includes(searchTerm)) ||
      (cust.area && cust.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cust.customer_id && cust.customer_id.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterPendingOnly) {
      const ledger = dataService.getCustomerLedger(cust.id);
      return ledger.pendingBalance > 0;
    }

    return true;
  });

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Customer Directory & Accounts</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Manage registered clients, sales ledgers, and pending payment collections.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onAddCustomer}>
          <PlusCircle size={16} /> Add New Customer
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="#64748b" />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', background: 'transparent', padding: '6px' }}
              placeholder="Search by customer name, mobile, area, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', userSelect: 'none', color: '#0f172a', fontWeight: 500 }}>
              <input
                type="checkbox"
                checked={filterPendingOnly}
                onChange={(e) => setFilterPendingOnly(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
              />
              <span>Show Pending Dues Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Desktop Table View (Hidden on mobile/tablet) */}
      {/* Desktop Table View (Hidden on mobile/tablet) */}
      <div className="card desktop-table-view" style={{ padding: '16px' }}>
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name / Firm</th>
                <th>Mobile</th>
                <th>Area / Location</th>
                <th style={{ textAlign: 'right' }}>Total Billed</th>
                <th style={{ textAlign: 'right' }}>Total Paid</th>
                <th style={{ textAlign: 'right' }}>Pending Due</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const ledger = dataService.getCustomerLedger(cust.id);
                  return (
                    <tr key={cust.id}>
                      <td style={{ fontWeight: 600, color: '#0284c7', fontSize: '12px' }}>
                        {cust.customer_id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{cust.name}</div>
                        {cust.notes && (
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{cust.notes}</div>
                        )}
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {cust.mobile ? (
                          <a href={`tel:${cust.mobile}`} style={{ color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={13} /> {cust.mobile}
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {cust.area ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="#64748b" /> {cust.area}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(ledger.totalSales)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                        {formatCurrency(ledger.totalPaid)}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 800,
                        color: ledger.pendingBalance > 0 ? '#e11d48' : '#10b981'
                      }}>
                        {formatCurrency(ledger.pendingBalance)}
                      </td>
                      <td>
                        <span className={`badge ${cust.status === 'active' ? 'badge-paid' : 'badge-pending'}`}>
                          {cust.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          {ledger.pendingBalance > 0 && (
                            <button
                              className="btn btn-sm"
                              style={{
                                padding: '4px 8px',
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                fontWeight: 700
                              }}
                              onClick={() => onOpenPayment && onOpenPayment(cust.id, 'customer')}
                              title="Collect / Update Pending Khata Balance"
                            >
                              <Receipt size={13} /> Collect
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => onSelectCustomer(cust.id)}
                            title="View Ledger & Profile"
                          >
                            <Eye size={13} /> Ledger
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => onOpenNewSale(cust.id)}
                            title="New Sale Bill"
                          >
                            <PlusCircle size={13} /> Bill
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 7px' }}
                            onClick={() => onEditCustomer(cust)}
                            title="Edit Details"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 7px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                            onClick={() => handleDeleteCustomer(cust)}
                            title="Delete Customer Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zero-Scroll Mobile & Tablet Cards View */}
      <div className="mobile-cards-view">
        {filteredCustomers.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            No customers found matching your criteria.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const ledger = dataService.getCustomerLedger(cust.id);
            const isDue = ledger.pendingBalance > 0;

            return (
              <div key={cust.id} className="mobile-record-card">
                <div className="card-top-row">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-active" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {cust.customer_id}
                      </span>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{cust.name}</strong>
                    </div>
                    {cust.notes && (
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{cust.notes}</p>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', color: isDue ? '#be123c' : '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
                      {isDue ? 'To Collect' : 'Settled'}
                    </span>
                    <div style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: isDue ? '#e11d48' : '#10b981'
                    }}>
                      {formatCurrency(ledger.pendingBalance)}
                    </div>
                  </div>
                </div>

                <div className="card-meta-grid">
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Mobile:</span>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {cust.mobile ? (
                        <a href={`tel:${cust.mobile}`} style={{ color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {cust.mobile}
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Area / Location:</span>
                    <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cust.area || 'Nandipet'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Total Billed:</span>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {formatCurrency(ledger.totalSales)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Total Paid:</span>
                    <div style={{ fontWeight: 600, color: '#10b981' }}>
                      {formatCurrency(ledger.totalPaid)}
                    </div>
                  </div>
                </div>

                <div className="card-action-bar">
                  {ledger.pendingBalance > 0 && (
                    <button
                      className="btn btn-sm"
                      style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 700 }}
                      onClick={() => onOpenPayment && onOpenPayment(cust.id, 'customer')}
                    >
                      <Receipt size={14} /> Collect ({formatCurrency(ledger.pendingBalance)})
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectCustomer(cust.id)}
                  >
                    <Eye size={14} /> Ledger
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onOpenNewSale(cust.id)}
                  >
                    <PlusCircle size={14} /> Bill
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEditCustomer(cust)}
                    style={{ flex: 0.6 }}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ flex: 0.6, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                    onClick={() => handleDeleteCustomer(cust)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
