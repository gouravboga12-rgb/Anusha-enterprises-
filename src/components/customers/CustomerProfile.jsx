import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  PlusCircle,
  Receipt,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Printer,
  Download
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';

export const CustomerProfile = ({
  customerId,
  dataService,
  currentUser,
  onBack,
  onOpenNewSale,
  onOpenPayment,
  onEditCustomer,
  onViewBillDetails,
  onEditSale,
  onViewInvoice,
  initialTab = 'ledger'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'ledger');
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const customer = dataService.getCustomerById(customerId);
  if (!customer) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <p>Customer account not found or was deleted.</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '12px' }}>
          <ArrowLeft size={16} /> Back to Customer List
        </button>
      </div>
    );
  }

  const ledgerData = dataService.getCustomerLedger(customerId);
  const sales = dataService.getSales().filter((s) => s.customer_id === customerId);
  const payments = dataService.getPayments().filter((p) => p.customer_id === customerId && p.type === 'customer_payment');

  const filteredLedgerEntries = useMemo(() => {
    if (!ledgerData?.entries) return [];
    return ledgerData.entries.filter((entry) => {
      if (ledgerStartDate && entry.date < ledgerStartDate) return false;
      if (ledgerEndDate && entry.date > ledgerEndDate) return false;
      return true;
    });
  }, [ledgerData?.entries, ledgerStartDate, ledgerEndDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleSavePdf = async () => {
    setIsSavingPdf(true);
    const element = document.getElementById('customer-profile-ledger-document');
    const cleanName = (customer.name || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateSuffix = (ledgerStartDate || ledgerEndDate)
      ? `_${ledgerStartDate || 'Start'}_to_${ledgerEndDate || 'Latest'}`
      : '_All_Records';
    await exportElementToPdf({
      element,
      filename: `${cleanName}_Ledger_${customer.customer_id || 'Statement'}${dateSuffix}.pdf`,
      title: `${customer.name} - Customer Ledger`
    });
    setIsSavingPdf(false);
  };

  const handleDeleteCustomer = async () => {
    const warning = ledgerData.pendingBalance > 0
      ? `\n\nWarning: This customer still has a pending balance of ₹${ledgerData.pendingBalance.toLocaleString()}!`
      : '';
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}"?${warning}\n\nThis will remove their profile and all transactions.`)) {
      try {
        await dataService.deleteCustomer(customerId, currentUser);
        onBack();
      } catch (err) {
        alert(err.message || 'Failed to delete customer');
      }
    }
  };

  const handleDeleteSale = async (sale) => {
    if (window.confirm(`Delete Sale Bill ${sale.invoice_no} (${formatCurrency(sale.total_amount)})?\n\nThis will automatically return the sold items back to your product inventory and remove the bill from the customer ledger.`)) {
      try {
        await dataService.deleteSale(sale.id, currentUser);
      } catch (err) {
        alert(err.message || 'Failed to delete sale bill');
      }
    }
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm(`Delete Payment Receipt ${payment.receipt_no} (${formatCurrency(payment.amount)})?\n\nThis will recalculate the customer's pending balance.`)) {
      try {
        await dataService.deletePayment(payment.id, currentUser);
      } catch (err) {
        alert(err.message || 'Failed to delete payment receipt');
      }
    }
  };

  return (
    <div>
      {/* Top navigation */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onBack}
        >
          <ArrowLeft size={15} /> Back to Customers
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onEditCustomer && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onEditCustomer(customer)}
              title="Edit customer details"
            >
              <Edit size={14} /> Edit Customer
            </button>
          )}
          <button
            className="btn btn-danger btn-sm"
            style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
            onClick={handleDeleteCustomer}
            title="Delete this customer account"
          >
            <Trash2 size={14} /> Delete Customer
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="card no-print" style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-active">{customer.customer_id}</span>
              <h1 style={{ fontSize: '22px' }}>{customer.name}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', flexWrap: 'wrap', color: '#64748b', fontSize: '13px' }}>
              {customer.mobile && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} color="#0284c7" /> {customer.mobile}
                </span>
              )}
              {customer.area && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="#0284c7" /> {customer.area}
                </span>
              )}
            </div>
            {customer.address && (
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                {customer.address}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onOpenNewSale(customer.id)}
            >
              <PlusCircle size={15} /> New Sale Bill
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const pendingSales = sales.filter((s) => s.pending_amount > 0);
                const firstSaleId = pendingSales.length > 0 ? pendingSales[0].id : '';
                onOpenPayment(customer.id, 'customer', firstSaleId);
              }}
            >
              <Receipt size={15} color="#0284c7" /> Collect Payment
            </button>
          </div>
        </div>

        {/* Account Financial Balance Summary */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL BILLED</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {formatCurrency(ledgerData.totalSales)}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Across {sales.length} invoices</span>
          </div>

          <div style={{ background: '#ecfdf5', padding: '12px 16px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
            <span style={{ fontSize: '11px', color: '#047857', fontWeight: 600 }}>TOTAL RECEIVED</span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46', marginTop: '2px' }}>
              {formatCurrency(ledgerData.totalPaid)}
            </div>
            <span style={{ fontSize: '11px', color: '#047857' }}>{payments.length} payment installments</span>
          </div>

          <div style={{
            background: ledgerData.pendingBalance > 0 ? '#fff1f2' : '#f8fafc',
            padding: '12px 16px',
            borderRadius: '10px',
            border: `1px solid ${ledgerData.pendingBalance > 0 ? '#fecdd3' : '#e2e8f0'}`
          }}>
            <span style={{ fontSize: '11px', color: ledgerData.pendingBalance > 0 ? '#be123c' : '#64748b', fontWeight: 600 }}>
              PENDING BALANCE
            </span>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: ledgerData.pendingBalance > 0 ? '#e11d48' : '#10b981',
              marginTop: '2px'
            }}>
              {formatCurrency(ledgerData.pendingBalance)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: ledgerData.pendingBalance > 0 ? '#be123c' : '#10b981' }}>
                {ledgerData.pendingBalance > 0 ? 'Due for collection' : 'All accounts settled'}
              </span>
              {ledgerData.pendingBalance > 0 && (
                <button
                  className="btn btn-sm"
                  style={{
                    background: '#e11d48',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    padding: '2px 8px',
                    fontSize: '11px'
                  }}
                  onClick={() => {
                    const pendingSales = sales.filter((s) => s.pending_amount > 0);
                    const firstSaleId = pendingSales.length > 0 ? pendingSales[0].id : '';
                    onOpenPayment && onOpenPayment(customer.id, 'customer', firstSaleId);
                  }}
                >
                  <Receipt size={12} /> Collect Due
                </button>
              )}
            </div>
          </div>

          <div style={{
            background: ledgerData.advanceBalance > 0 ? '#f0fdf4' : '#f8fafc',
            padding: '12px 16px',
            borderRadius: '10px',
            border: `1px solid ${ledgerData.advanceBalance > 0 ? '#86efac' : '#e2e8f0'}`
          }}>
            <span style={{ fontSize: '11px', color: ledgerData.advanceBalance > 0 ? '#15803d' : '#64748b', fontWeight: 600 }}>
              ADVANCE CREDIT (SURPLUS)
            </span>
            <div style={{
              fontSize: '18px',
              fontWeight: 800,
              color: ledgerData.advanceBalance > 0 ? '#16a34a' : '#64748b',
              marginTop: '2px'
            }}>
              {formatCurrency(ledgerData.advanceBalance || 0)}
            </div>
            <span style={{ fontSize: '11px', color: ledgerData.advanceBalance > 0 ? '#15803d' : '#94a3b8' }}>
              {ledgerData.advanceBalance > 0 ? 'Prepaid credit with customer' : 'No advance recorded'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="profile-tabs-nav no-print" style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
        <button
          className={`btn btn-sm ${activeTab === 'ledger' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ledger')}
        >
          <BookOpen size={15} /> Customer Digital Ledger
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sales')}
        >
          <FileText size={15} /> All Invoices & Orders ({sales.length})
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('payments')}
        >
          <Receipt size={15} /> Payment History ({payments.length})
        </button>
      </div>

      {/* TAB 1: LEDGER */}
      {activeTab === 'ledger' && (
        <>
          {/* Desktop Ledger Table */}
          <div id="customer-profile-ledger-document" className="card print-document customer-ledger-panel" style={{ padding: '16px' }}>
            {/* Printable Statement Document Header (visible only on print) */}
            <div className="print-header" style={{ display: 'none', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.5px' }}>ANUSHA ENTERPRISES</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#475569' }}>
                    Main Road, Nandipet, Nizamabad Dist. • Telangana • Ph: 96409 12521
                  </p>
                  <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    CUSTOMER LEDGER & ACCOUNT STATEMENT
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#334155', lineHeight: 1.5 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{customer.name}</div>
                  <div><strong>Customer ID:</strong> {customer.customer_id}</div>
                  {customer.phone && <div><strong>Phone:</strong> {customer.phone}</div>}
                  <div><strong>Area / City:</strong> {customer.area || 'Nandipet'}</div>
                  <div><strong>Statement Date:</strong> {formatDate(getTodayDateString())}</div>
                  <div>
                    <strong>Period:</strong>{' '}
                    {ledgerStartDate || ledgerEndDate
                      ? `${ledgerStartDate ? formatDate(ledgerStartDate) : 'Start'} to ${ledgerEndDate ? formatDate(ledgerEndDate) : 'Latest'}`
                      : 'All Transactions (Complete Statement)'}
                  </div>
                </div>
              </div>

              {/* Financial Summary Strip on Print */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: ledgerData.advanceBalance > 0 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr',
                gap: '10px',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #e2e8f0',
                fontSize: '11px'
              }}>
                <div style={{ background: '#f8fafc', padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>TOTAL BILLED: </span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{formatCurrency(ledgerData.totalSales)}</strong>
                </div>
                <div style={{ background: '#ecfdf5', padding: '6px 10px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                  <span style={{ color: '#047857', fontSize: '10px', fontWeight: 600 }}>TOTAL RECEIVED: </span>
                  <strong style={{ fontSize: '13px', color: '#065f46' }}>{formatCurrency(ledgerData.totalPaid)}</strong>
                </div>
                <div style={{
                  background: ledgerData.pendingBalance > 0 ? '#fff1f2' : '#f8fafc',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: `1px solid ${ledgerData.pendingBalance > 0 ? '#fecdd3' : '#e2e8f0'}`
                }}>
                  <span style={{ color: ledgerData.pendingBalance > 0 ? '#be123c' : '#64748b', fontSize: '10px', fontWeight: 600 }}>PENDING BALANCE: </span>
                  <strong style={{ fontSize: '13px', color: ledgerData.pendingBalance > 0 ? '#e11d48' : '#10b981' }}>{formatCurrency(ledgerData.pendingBalance)}</strong>
                </div>
                {ledgerData.advanceBalance > 0 && (
                  <div style={{ background: '#f0fdf4', padding: '6px 10px', borderRadius: '4px', border: '1px solid #86efac' }}>
                    <span style={{ color: '#15803d', fontSize: '10px', fontWeight: 600 }}>ADVANCE CREDIT: </span>
                    <strong style={{ fontSize: '13px', color: '#16a34a' }}>{formatCurrency(ledgerData.advanceBalance)}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="card-header no-print" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 className="card-title">Digital Customer Ledger</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Chronological debit (sales) and credit (payments) with automatic running balance.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSavePdf}
                  disabled={isSavingPdf}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    padding: '6px 14px',
                    cursor: isSavingPdf ? 'wait' : 'pointer',
                    background: '#f0fdf4',
                    color: '#16a34a',
                    border: '1px solid #bbf7d0',
                    touchAction: 'manipulation'
                  }}
                  onTouchEnd={(e) => { e.preventDefault(); if (!isSavingPdf) handleSavePdf(); }}
                  title="Download Ledger Statement as PDF File"
                >
                  <Download size={15} /> {isSavingPdf ? 'Generating PDF...' : 'Save PDF'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handlePrint}
                  onTouchEnd={(e) => { e.preventDefault(); handlePrint(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    padding: '6px 14px',
                    cursor: 'pointer',
                    touchAction: 'manipulation'
                  }}
                  title="Print or Save PDF Statement"
                >
                  <Printer size={15} /> PDF Print
                </button>
              </div>
            </div>

            {/* Date-wise Filter Strip (Highlighted directly above ledger table) */}
            <div className="no-print" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={14} color="#0284c7" /> Date Filter:
                </span>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto', fontSize: '12px', padding: '4px 8px' }}
                  value={ledgerStartDate}
                  onChange={(e) => setLedgerStartDate(e.target.value)}
                  title="From Date"
                />
                <span style={{ fontSize: '12px', color: '#64748b' }}>to</span>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto', fontSize: '12px', padding: '4px 8px' }}
                  value={ledgerEndDate}
                  onChange={(e) => setLedgerEndDate(e.target.value)}
                  title="To Date"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => {
                    const d = new Date();
                    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
                    setLedgerStartDate(firstDay);
                    setLedgerEndDate(getTodayDateString());
                  }}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '3px 8px' }}
                  onClick={() => {
                    setLedgerStartDate(getTodayDateString());
                    setLedgerEndDate(getTodayDateString());
                  }}
                >
                  Today
                </button>
                {(ledgerStartDate || ledgerEndDate) && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                    onClick={() => {
                      setLedgerStartDate('');
                      setLedgerEndDate('');
                    }}
                  >
                    Clear (All Dates)
                  </button>
                )}
              </div>

              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Showing <strong>{filteredLedgerEntries.length}</strong> of {ledgerData.entries.length} records
                {ledgerStartDate || ledgerEndDate ? (
                  <span style={{ color: '#0284c7', fontWeight: 600, marginLeft: '6px' }}>
                    ({ledgerStartDate ? formatDate(ledgerStartDate) : 'Start'} to {ledgerEndDate ? formatDate(ledgerEndDate) : 'Latest'})
                  </span>
                ) : (
                  <span style={{ color: '#10b981', fontWeight: 600, marginLeft: '6px' }}>(All Transactions)</span>
                )}
              </div>
            </div>

            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Ref #</th>
                    <th>Particulars</th>
                    <th style={{ textAlign: 'right', color: '#b91c1c' }}>Debit (Sale ₹)</th>
                    <th style={{ textAlign: 'right', color: '#15803d' }}>Credit (Paid ₹)</th>
                    <th style={{ textAlign: 'right', color: '#0284c7' }}>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        {ledgerData.entries.length === 0 ? 'No ledger transactions recorded yet for this customer.' : 'No ledger transactions match the selected date range.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLedgerEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600 }}>{formatDate(entry.date)}</div>
                          <div style={{ color: '#64748b', fontSize: '11px' }}>{entry.time}</div>
                        </td>
                        <td>
                          <span className={`badge ${entry.type === 'SALE' ? 'badge-credit' : 'badge-debit'}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '12px' }}>{entry.reference}</td>
                        <td style={{ fontSize: '13px', maxWidth: '300px' }}>{entry.particulars}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#b91c1c' }}>
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#15803d' }}>
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '13px' }}>
                          {entry.balanceStatus === 'ADVANCE' ? (
                            <span style={{ color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                              +{formatCurrency(entry.advance || Math.abs(entry.runningRaw))} Adv
                            </span>
                          ) : entry.balanceStatus === 'SETTLED' || entry.balance === 0 ? (
                            <span style={{ color: '#10b981' }}>₹0</span>
                          ) : (
                            <span style={{ color: '#b91c1c' }}>
                              {formatCurrency(entry.balance)} Due
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Print Footer with signature line */}
            <div className="print-header" style={{ display: 'none', marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', fontSize: '11px', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <p style={{ margin: 0 }}>* This is a computer-generated account statement from Anusha Enterprises Digital Ledger.</p>
                  <p style={{ margin: '2px 0 0', fontSize: '10px' }}>Printed on: {formatDateTime(getTodayDateString(), getCurrentTimeString())}</p>
                </div>
                <div style={{ textAlign: 'center', minWidth: '160px' }}>
                  <div style={{ borderBottom: '1px solid #0f172a', height: '30px', marginBottom: '4px' }}></div>
                  <strong style={{ color: '#0f172a' }}>Authorized Signature</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Ledger Cards (Zero-scroll) */}
          <div className="mobile-cards-view no-print">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Ledger Records</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSavePdf}
                  disabled={isSavingPdf}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                >
                  <Download size={13} /> {isSavingPdf ? '...' : 'PDF'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handlePrint}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px' }}
                >
                  <Printer size={13} /> Print
                </button>
              </div>
            </div>

            {/* Mobile Date Filter Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
              background: '#f8fafc',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '10px'
            }}>
              <Calendar size={13} color="#0284c7" />
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', fontSize: '11px', padding: '2px 6px' }}
                value={ledgerStartDate}
                onChange={(e) => setLedgerStartDate(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: '#64748b' }}>to</span>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', fontSize: '11px', padding: '2px 6px' }}
                value={ledgerEndDate}
                onChange={(e) => setLedgerEndDate(e.target.value)}
              />
              {(ledgerStartDate || ledgerEndDate) && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ fontSize: '10px', padding: '2px 6px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                  onClick={() => {
                    setLedgerStartDate('');
                    setLedgerEndDate('');
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {filteredLedgerEntries.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                {ledgerData.entries.length === 0 ? 'No ledger transactions recorded yet for this customer.' : 'No ledger transactions match the selected date range.'}
              </div>
            ) : (
              filteredLedgerEntries.map((entry) => (
                <div key={entry.id} className="mobile-record-card">
                  <div className="card-top-row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${entry.type === 'SALE' ? 'badge-credit' : 'badge-debit'}`}>
                          {entry.type}
                        </span>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{entry.reference}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {formatDate(entry.date)} • {entry.time}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                        {entry.balanceStatus === 'ADVANCE' ? 'Advance Credit' : 'Balance Due'}
                      </span>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        color: entry.balanceStatus === 'ADVANCE' ? '#16a34a' : (entry.balance > 0 ? '#e11d48' : '#10b981')
                      }}>
                        {entry.balanceStatus === 'ADVANCE' ? `+${formatCurrency(entry.advance || Math.abs(entry.runningRaw))}` : formatCurrency(entry.balance)}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                    {entry.particulars}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                    {entry.debit > 0 && (
                      <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                        Debit (Billed): +{formatCurrency(entry.debit)}
                      </span>
                    )}
                    {entry.credit > 0 && (
                      <span style={{ color: '#15803d', fontWeight: 600 }}>
                        Credit (Received): -{formatCurrency(entry.credit)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* TAB 2: SALES */}
      {activeTab === 'sales' && (
        <>
          {/* Desktop Sales Table */}
          <div className="card desktop-table-view" style={{ padding: '16px' }}>
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date & Time</th>
                    <th>Items Sold</th>
                    <th>Total Amount</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No sales recorded for this customer.
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id}>
                        <td style={{ fontWeight: 700, color: '#0284c7' }}>
                          <div>{sale.invoice_no}</div>
                          {sale.vehicle_no && (
                            <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 600, background: '#eff6ff', padding: '1px 5px', borderRadius: '4px', border: '1px solid #bfdbfe', display: 'inline-block', marginTop: '3px' }}>
                              🚗 {sale.vehicle_no}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {formatDate(sale.date)} <span style={{ color: '#64748b' }}>{sale.time}</span>
                        </td>
                        <td>
                          {sale.items.map((i, idx) => (
                            <div key={idx} style={{ fontSize: '12px' }}>
                              {i.product_name} <span style={{ color: '#64748b' }}>({i.quantity} × {formatCurrency(i.selling_price)})</span>
                            </div>
                          ))}
                        </td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(sale.total_amount)}</td>
                        <td style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(sale.paid_amount)}</td>
                        <td style={{ color: sale.pending_amount > 0 ? '#e11d48' : '#64748b', fontWeight: 600 }}>
                          {formatCurrency(sale.pending_amount)}
                        </td>
                        <td>
                          <span className={`badge ${
                            sale.payment_status === 'Paid' ? 'badge-paid' :
                            sale.payment_status === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                          }`}>
                            {sale.payment_status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px', color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff', fontWeight: 600 }}
                              onClick={() => onViewInvoice && onViewInvoice(sale)}
                              title="View, Print & Download Tax Invoice"
                            >
                              <FileText size={13} /> Invoice
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px' }}
                              onClick={() => onViewBillDetails && onViewBillDetails(sale)}
                              title="View Bill & Payment History"
                            >
                              <Receipt size={13} /> View
                            </button>
                            {sale.pending_amount > 0 && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '3px 8px' }}
                                onClick={() => onOpenPayment && onOpenPayment(customer.id, 'customer', sale.id)}
                                title="Add Payment for this Bill"
                              >
                                <PlusCircle size={13} /> Pay
                              </button>
                            )}
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 7px' }}
                              onClick={() => onEditSale && onEditSale(sale)}
                              title="Edit Bill Details"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '3px 7px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                              onClick={() => handleDeleteSale(sale)}
                              title="Delete Bill (Restores items to stock)"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Sales Cards (Zero-scroll) */}
          <div className="mobile-cards-view">
            {sales.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                No sales recorded for this customer.
              </div>
            ) : (
              sales.map((sale) => (
                <div key={sale.id} className="mobile-record-card">
                  <div className="card-top-row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-active" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {sale.invoice_no}
                        </span>
                        <span className={`badge ${
                          sale.payment_status === 'Paid' ? 'badge-paid' :
                          sale.payment_status === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                        }`}>
                          {sale.payment_status}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        {formatDate(sale.date)} • {sale.time}
                      </div>
                      {sale.vehicle_no && (
                        <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 600, marginTop: '2px' }}>
                          🚗 Vehicle: {sale.vehicle_no}
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Bill Amount</span>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(sale.total_amount)}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600, color: '#475569', marginBottom: '4px', fontSize: '11px' }}>ITEMS BILLED:</div>
                    {sale.items.map((i, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#1e293b', marginBottom: '2px' }}>
                        <span>{i.product_name}</span>
                        <span style={{ color: '#64748b' }}>{i.quantity} × {formatCurrency(i.selling_price)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#10b981', fontWeight: 600, marginRight: '10px' }}>Paid: {formatCurrency(sale.paid_amount)}</span>
                      {sale.pending_amount > 0 && (
                        <span style={{ color: '#e11d48', fontWeight: 700 }}>Due: {formatCurrency(sale.pending_amount)}</span>
                      )}
                    </div>
                  </div>

                  <div className="card-action-bar">
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#0284c7', borderColor: '#bae6fd', background: '#f0f9ff', fontWeight: 600 }}
                      onClick={() => onViewInvoice && onViewInvoice(sale)}
                      title="View, Print & Download Tax Invoice"
                    >
                      <FileText size={13} /> Invoice
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewBillDetails && onViewBillDetails(sale)}
                    >
                      <Receipt size={13} /> Bill & Payments
                    </button>
                    {sale.pending_amount > 0 && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => onOpenPayment && onOpenPayment(customer.id, 'customer', sale.id)}
                      >
                        <PlusCircle size={13} /> Pay
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ minWidth: '38px', width: '38px', padding: '6px 0', flex: '0 0 38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => onEditSale && onEditSale(sale)}
                      title="Edit Bill"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ minWidth: '38px', width: '38px', padding: '6px 0', flex: '0 0 38px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => handleDeleteSale(sale)}
                      title="Delete Bill"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* TAB 3: PAYMENTS */}
      {activeTab === 'payments' && (
        <>
          {/* Desktop Payments Table */}
          <div className="card desktop-table-view" style={{ padding: '16px' }}>
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date & Time</th>
                    <th>Amount Received</th>
                    <th>Payment Mode</th>
                    <th>Reference #</th>
                    <th>Notes</th>
                    <th>Recorded By</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: '#0284c7' }}>{p.receipt_no}</td>
                        <td style={{ fontSize: '12px' }}>
                          {formatDate(p.date)} <span style={{ color: '#64748b' }}>{p.time}</span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#10b981', fontSize: '14px' }}>
                          {formatCurrency(p.amount)}
                        </td>
                        <td>
                          <span className="badge badge-paid">{p.payment_mode}</span>
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{p.reference_no || '—'}</td>
                        <td style={{ fontSize: '12px' }}>{p.notes || '—'}</td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>{p.recorded_by}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '3px 8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                            onClick={() => handleDeletePayment(p)}
                            title="Delete Payment (Recalculates balance)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Payments Cards (Zero-scroll) */}
          <div className="mobile-cards-view">
            {payments.length === 0 ? (
              <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                No payment records found.
              </div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="mobile-record-card">
                  <div className="card-top-row">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-active" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {p.receipt_no}
                        </span>
                        <span className="badge badge-paid">{p.payment_mode}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        {formatDate(p.date)} • {p.time}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', color: '#047857', fontWeight: 600 }}>RECEIVED</span>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: '#10b981' }}>
                        +{formatCurrency(p.amount)}
                      </div>
                    </div>
                  </div>

                  {(p.reference_no || p.notes) && (
                    <div style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                      {p.reference_no && <div>Ref: {p.reference_no}</div>}
                      {p.notes && <div>{p.notes}</div>}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #f1f5f9', fontSize: '11px', color: '#64748b' }}>
                    <span>By: {p.recorded_by}</span>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '3px 8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                      onClick={() => handleDeletePayment(p)}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
