import React, { useState } from 'react';
import { Search, PlusCircle, Phone, MapPin, Eye, Edit, ShoppingBag, Truck, Trash2, Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const SupplierList = ({
  suppliers,
  dataService,
  onSelectSupplier,
  onEditSupplier,
  onAddSupplier,
  onOpenNewPurchase,
  onOpenPayment
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleDeleteSupplier = (supp) => {
    const ledger = dataService.getSupplierLedger(supp.id);
    const warning = ledger.pendingBalance > 0
      ? `\n\nWarning: We still owe ₹${ledger.pendingBalance.toLocaleString()} to this supplier!`
      : '';
    if (window.confirm(`Delete supplier "${supp.company_name}"?${warning}\n\nThis will remove their account and inward purchase history.`)) {
      dataService.deleteSupplier(supp.id);
    }
  };

  const filteredSuppliers = suppliers.filter((supp) => {
    return (
      supp.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supp.supplier_name && supp.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supp.mobile && supp.mobile.includes(searchTerm)) ||
      (supp.area && supp.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supp.supplier_id && supp.supplier_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Supplier Management</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Suppliers, inward product inventory, and balance payables.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onAddSupplier}>
          <PlusCircle size={16} /> Add New Supplier
        </button>
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            className="form-input"
            style={{ border: 'none', background: 'transparent', padding: '6px' }}
            placeholder="Search suppliers by company name, contact person, mobile, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop Table View (hidden on tablet/mobile) */}
      <div className="card desktop-table-view" style={{ padding: '16px' }}>
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier ID</th>
                <th>Company / Vendor</th>
                <th>Contact Person</th>
                <th>Mobile</th>
                <th>Area / Hub</th>
                <th style={{ textAlign: 'right' }}>Total Purchases</th>
                <th style={{ textAlign: 'right' }}>Total Paid</th>
                <th style={{ textAlign: 'right' }}>Payable Due</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No suppliers found matching your query.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supp) => {
                  const ledger = dataService.getSupplierLedger(supp.id);
                  return (
                    <tr key={supp.id}>
                      <td style={{ fontWeight: 600, color: '#0284c7', fontSize: '12px' }}>
                        {supp.supplier_id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{supp.company_name}</div>
                        {supp.notes && (
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{supp.notes}</div>
                        )}
                      </td>
                      <td style={{ fontSize: '13px' }}>{supp.supplier_name || '—'}</td>
                      <td style={{ fontSize: '13px' }}>
                        {supp.mobile ? (
                          <a href={`tel:${supp.mobile}`} style={{ color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Phone size={13} /> {supp.mobile}
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {supp.area ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="#64748b" /> {supp.area}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(ledger.totalPurchases)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                        {formatCurrency(ledger.totalPaid)}
                      </td>
                      <td style={{
                        textAlign: 'right',
                        fontWeight: 800,
                        color: ledger.pendingBalance > 0 ? '#d97706' : '#10b981'
                      }}>
                        {formatCurrency(ledger.pendingBalance)}
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
                              onClick={() => {
                                const pendingPurchases = dataService.getPurchases().filter((p) => p.supplier_id === supp.id && p.pending_amount > 0);
                                const firstPurchaseId = pendingPurchases.length > 0 ? pendingPurchases[0].id : '';
                                onOpenPayment && onOpenPayment(supp.id, 'supplier', firstPurchaseId);
                              }}
                              title="Pay / Update Outstanding Supplier Balance"
                            >
                              <Receipt size={13} /> Pay
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => onSelectSupplier(supp.id)}
                            title="View Supplier Ledger"
                          >
                            <Eye size={13} /> Ledger
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => onOpenNewPurchase(supp.id)}
                            title="New Purchase Entry"
                          >
                            <ShoppingBag size={13} /> Buy
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 7px' }}
                            onClick={() => onEditSupplier(supp)}
                            title="Edit Supplier"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 7px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                            onClick={() => handleDeleteSupplier(supp)}
                            title="Delete Supplier Account"
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
        {filteredSuppliers.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            No suppliers found matching your query.
          </div>
        ) : (
          filteredSuppliers.map((supp) => {
            const ledger = dataService.getSupplierLedger(supp.id);
            const isDue = ledger.pendingBalance > 0;

            return (
              <div key={supp.id} className="mobile-record-card">
                <div className="card-top-row">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-active" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {supp.supplier_id}
                      </span>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>{supp.company_name}</strong>
                    </div>
                    {supp.supplier_name && (
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Contact: {supp.supplier_name}
                      </div>
                    )}
                    {supp.notes && (
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{supp.notes}</p>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', color: isDue ? '#b45309' : '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
                      {isDue ? 'Payable Due' : 'Settled'}
                    </span>
                    <div style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: isDue ? '#d97706' : '#10b981'
                    }}>
                      {formatCurrency(ledger.pendingBalance)}
                    </div>
                  </div>
                </div>

                <div className="card-meta-grid">
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Mobile:</span>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {supp.mobile ? (
                        <a href={`tel:${supp.mobile}`} style={{ color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} /> {supp.mobile}
                        </a>
                      ) : '—'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Area / Hub:</span>
                    <div style={{ fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {supp.area || '—'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Total Inward Purchases:</span>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {formatCurrency(ledger.totalPurchases)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Total Paid to Vendor:</span>
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
                      onClick={() => {
                        const pendingPurchases = dataService.getPurchases().filter((p) => p.supplier_id === supp.id && p.pending_amount > 0);
                        const firstPurchaseId = pendingPurchases.length > 0 ? pendingPurchases[0].id : '';
                        onOpenPayment && onOpenPayment(supp.id, 'supplier', firstPurchaseId);
                      }}
                    >
                      <Receipt size={14} /> Pay ({formatCurrency(ledger.pendingBalance)})
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectSupplier(supp.id)}
                  >
                    <Eye size={14} /> Ledger
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onOpenNewPurchase(supp.id)}
                  >
                    <ShoppingBag size={14} /> Buy
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEditSupplier(supp)}
                    style={{ flex: 0.6 }}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ flex: 0.6, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                    onClick={() => handleDeleteSupplier(supp)}
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
