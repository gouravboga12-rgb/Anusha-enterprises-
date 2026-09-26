import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { Receipt, CheckCircle2, AlertCircle, ShieldCheck, ArrowRight, DollarSign, Calendar, Clock, UserPlus } from 'lucide-react';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { SupplierFormModal } from '../suppliers/SupplierFormModal';

export const RecordPaymentModal = ({
  isOpen,
  onClose,
  dataService,
  currentUser,
  initialPartyId = '',
  initialPartyType = 'customer',
  initialDocId = '',
  onPaymentRecorded
}) => {
  const [partyType, setPartyType] = useState(initialPartyType); // 'customer' or 'supplier'
  const [partyId, setPartyId] = useState(initialPartyId);
  const [docId, setDocId] = useState(initialDocId); // sale_id or purchase_id
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [referenceNo, setReferenceNo] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isQuickSupplierOpen, setIsQuickSupplierOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!dataService) return;
    return dataService.subscribe(() => setTick((t) => t + 1));
  }, [dataService]);

  const customers = dataService.getCustomers();
  const suppliers = dataService.getSuppliers();
  const sales = dataService.getSales();
  const purchases = dataService.getPurchases();

  // Reset and auto-link on open
  useEffect(() => {
    if (isOpen) {
      const type = initialPartyType || 'customer';
      const pId = initialPartyId || '';
      let dId = initialDocId || '';

      // Auto-target pending bill if not specified
      if (!dId && pId) {
        if (type === 'customer') {
          const pending = sales.filter((s) => s.customer_id === pId && s.pending_amount > 0);
          if (pending.length > 0) dId = pending[0].id;
        } else {
          const pending = purchases.filter((p) => p.supplier_id === pId && p.pending_amount > 0);
          if (pending.length > 0) dId = pending[0].id;
        }
      }

      setPartyType(type);
      setPartyId(pId);
      setDocId(dId);
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setPaymentMode(type === 'customer' ? 'Cash' : 'Bank Transfer');
      setReferenceNo('');
      setNotes('');
      setError('');

      if (dId) {
        if (type === 'customer') {
          const s = sales.find((sale) => sale.id === dId);
          setAmount(s && s.pending_amount > 0 ? String(s.pending_amount) : '');
        } else {
          const p = purchases.find((pur) => pur.id === dId);
          setAmount(p && p.pending_amount > 0 ? String(p.pending_amount) : '');
        }
      } else {
        setAmount('');
      }
    }
  }, [isOpen, initialPartyId, initialPartyType, initialDocId]);

  // When partyId changes in dropdown, auto-select their first pending bill
  const handlePartyChange = (newPartyId) => {
    if (newPartyId === '__CREATE_NEW__') {
      if (partyType === 'customer') {
        setIsQuickCustomerOpen(true);
      } else {
        setIsQuickSupplierOpen(true);
      }
      return;
    }

    setPartyId(newPartyId);
    setError('');

    if (newPartyId) {
      const pendingBills = partyType === 'customer'
        ? sales.filter((s) => s.customer_id === newPartyId && s.pending_amount > 0)
        : purchases.filter((p) => p.supplier_id === newPartyId && p.pending_amount > 0);

      if (pendingBills.length > 0) {
        setDocId(pendingBills[0].id);
        setAmount(String(pendingBills[0].pending_amount));
      } else {
        setDocId('');
        setAmount('');
      }
    } else {
      setDocId('');
      setAmount('');
    }
  };

  // Filter bills for selected party
  const partySales = sales.filter((s) => s.customer_id === partyId && s.pending_amount > 0);
  const partyPurchases = purchases.filter((p) => p.supplier_id === partyId && p.pending_amount > 0);

  const selectedSale = sales.find((s) => s.id === docId);
  const selectedPurchase = purchases.find((p) => p.id === docId);

  const partyLedger = partyId
    ? (partyType === 'customer' ? dataService.getCustomerLedger(partyId) : dataService.getSupplierLedger(partyId))
    : null;
  const partyPendingTotal = partyLedger ? partyLedger.pendingBalance : 0;

  // Selected party object
  const selectedParty = partyType === 'customer'
    ? customers.find((c) => c.id === partyId)
    : suppliers.find((s) => s.id === partyId);

  // Live calculation numbers
  const numAmount = Number(amount) || 0;
  const targetBillTotal = selectedSale ? selectedSale.total_amount : (selectedPurchase ? selectedPurchase.total_amount : 0);
  const targetPreviousPaid = selectedSale ? selectedSale.paid_amount : (selectedPurchase ? selectedPurchase.paid_amount : 0);
  const targetPendingBefore = selectedSale ? selectedSale.pending_amount : (selectedPurchase ? selectedPurchase.pending_amount : partyPendingTotal);
  
  const projectedPaid = targetPreviousPaid + numAmount;
  const projectedRemaining = Math.max(0, targetPendingBefore - numAmount);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!partyId) {
      setError(`Please select a ${partyType === 'customer' ? 'Customer' : 'Supplier'}`);
      return;
    }

    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }

    try {
      const recordedBy = currentUser?.name || currentUser?.username || 'Staff';
      if (partyType === 'customer') {
        const pay = dataService.recordCustomerPayment({
          customer_id: partyId,
          sale_id: docId || null,
          amount: numAmount,
          payment_mode: paymentMode,
          reference_no: referenceNo,
          date,
          time,
          recorded_by: recordedBy,
          notes: notes || (selectedSale ? `Installment payment for ${selectedSale.invoice_no}` : 'Account payment')
        });
        if (onPaymentRecorded) onPaymentRecorded(pay);
      } else {
        const pay = dataService.recordSupplierPayment({
          supplier_id: partyId,
          purchase_id: docId || null,
          amount: numAmount,
          payment_mode: paymentMode,
          reference_no: referenceNo,
          date,
          time,
          recorded_by: recordedBy,
          notes: notes || (selectedPurchase ? `Payout installment for ${selectedPurchase.purchase_no}` : 'Account payout')
        });
        if (onPaymentRecorded) onPaymentRecorded(pay);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    }
  };

  const docItems = selectedSale?.items || selectedPurchase?.items || [];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={partyType === 'customer' ? 'Collect Customer Payment / Installment' : 'Record Supplier Payout / Installment'}
        maxWidth="680px"
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Toggle (Customer Collection vs Supplier Payout) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              className={`btn btn-sm ${partyType === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px', fontWeight: 700 }}
              onClick={() => {
                setPartyType('customer');
                setPartyId('');
                setDocId('');
                setAmount('');
              }}
            >
              Customer Payment (Money Inward)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${partyType === 'supplier' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, padding: '8px', fontWeight: 700 }}
              onClick={() => {
                setPartyType('supplier');
                setPartyId('');
                setDocId('');
                setAmount('');
              }}
            >
              Supplier Payout (Money Outward)
            </button>
          </div>

          {/* Party Selector with Direct Add New Option */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                {partyType === 'customer' ? 'Select Customer *' : 'Select Supplier *'}
              </label>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  color: '#0284c7',
                  borderColor: '#bae6fd',
                  background: '#f0f9ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 700
                }}
                onClick={() => {
                  if (partyType === 'customer') {
                    setIsQuickCustomerOpen(true);
                  } else {
                    setIsQuickSupplierOpen(true);
                  }
                }}
                title={partyType === 'customer' ? 'Quick add a new customer' : 'Quick add a new supplier'}
              >
                <UserPlus size={12} /> + Add New {partyType === 'customer' ? 'Customer' : 'Supplier'}
              </button>
            </div>
            <select
              className="form-select"
              required
              value={partyId}
              onChange={(e) => handlePartyChange(e.target.value)}
              style={{ fontSize: '14px', padding: '10px 12px' }}
            >
              <option value="">-- Choose Party --</option>
              <option value="__CREATE_NEW__" style={{ fontWeight: 700, color: '#0284c7', background: '#f0f9ff' }}>
                ➕ + Add New {partyType === 'customer' ? 'Customer' : 'Supplier'}...
              </option>
              {partyType === 'customer'
                ? customers.map((c) => {
                    const l = dataService.getCustomerLedger(c.id);
                    const dueTag = l.pendingBalance > 0 ? ` [DUE: ${formatCurrency(l.pendingBalance)}]` : ' [Settled]';
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customer_id}) - {c.area || 'Nandipet'}{dueTag}
                      </option>
                    );
                  })
                : suppliers.map((s) => {
                    const l = dataService.getSupplierLedger(s.id);
                    const dueTag = l.pendingBalance > 0 ? ` [PAYABLE: ${formatCurrency(l.pendingBalance)}]` : ' [Settled]';
                    return (
                      <option key={s.id} value={s.id}>
                        {s.company_name} ({s.supplier_id}) - {s.area || 'Hub'}{dueTag}
                      </option>
                    );
                  })}
            </select>

          {partyId && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px'
            }}>
              <span style={{ color: '#64748b' }}>
                {partyType === 'customer' ? 'Total Customer Pending Balance:' : 'Total Outstanding to Supplier:'}
              </span>
              <strong style={{
                fontSize: '14px',
                color: partyPendingTotal > 0 ? (partyType === 'customer' ? '#e11d48' : '#d97706') : '#10b981'
              }}>
                {formatCurrency(partyPendingTotal)}
              </strong>
            </div>
          )}
        </div>

        {/* Bill Selection - Visual Cards if pending bills exist */}
        {partyId && (partySales.length > 0 || partyPurchases.length > 0) && (
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: '6px' }}>
              Select Bill / Invoice to Clear:
            </label>
            <div style={{ display: 'grid', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {partyType === 'customer'
                ? partySales.map((s) => {
                    const isSelected = docId === s.id;
                    const itemsStr = (s.items || []).map((i) => `${i.product_name} (${i.quantity} ${i.unit || 'Units'})`).join(', ');
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setDocId(s.id);
                          setAmount(String(s.pending_amount));
                        }}
                        style={{
                          border: `2px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '13px' }}>{s.invoice_no}</strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>({formatDate(s.date)})</span>
                            <span className="badge badge-partial">{s.payment_status}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', maxWidth: '380px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {itemsStr}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Pending Due</div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#e11d48' }}>
                            {formatCurrency(s.pending_amount)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                : partyPurchases.map((p) => {
                    const isSelected = docId === p.id;
                    const itemsStr = (p.items || []).map((i) => `${i.product_name} (${i.quantity} ${i.unit || 'Units'})`).join(', ');
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setDocId(p.id);
                          setAmount(String(p.pending_amount));
                        }}
                        style={{
                          border: `2px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                          background: isSelected ? '#f0f9ff' : '#ffffff',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ color: '#0f172a', fontSize: '13px' }}>{p.purchase_no}</strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>({formatDate(p.date)})</span>
                            <span className="badge badge-partial">{p.payment_status}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', maxWidth: '380px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {itemsStr}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Pending Payable</div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#d97706' }}>
                            {formatCurrency(p.pending_amount)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}

        {/* Selected Bill Breakdown Card */}
        {(selectedSale || selectedPurchase) && (
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                Target Bill: #{selectedSale?.invoice_no || selectedPurchase?.purchase_no} ({formatDate(selectedSale?.date || selectedPurchase?.date)})
              </span>
              <span className="badge badge-paid">
                Total Bill: {formatCurrency(targetBillTotal)}
              </span>
            </div>

            {/* Products on bill */}
            {docItems.length > 0 && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                  ITEMS IN THIS BILL:
                </div>
                {docItems.map((i, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#334155', marginBottom: '2px' }}>
                    <span>• {i.product_name}</span>
                    <span>{i.quantity} {i.unit || 'Units'} × {formatCurrency(i.selling_price || i.purchase_price)} = {formatCurrency(i.total || (i.quantity * (i.selling_price || i.purchase_price)))}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Previous Payments Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
              <span>Previously Paid on this Bill:</span>
              <strong style={{ color: '#059669' }}>{formatCurrency(targetPreviousPaid)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#e11d48', fontWeight: 700, marginTop: '4px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px' }}>
              <span>Current Unpaid Balance:</span>
              <span>{formatCurrency(targetPendingBefore)}</span>
            </div>
          </div>
        )}

        {/* Amount Input with Quick-Fill Chips */}
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>
              Payment Amount to Record (₹) *
            </label>
            {targetPendingBefore > 0 && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '2px 8px', fontWeight: 600 }}
                  onClick={() => setAmount(String(targetPendingBefore))}
                >
                  Full Due ({formatCurrency(targetPendingBefore)})
                </button>
                {targetPendingBefore >= 2000 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => setAmount(String(Math.floor(targetPendingBefore / 2)))}
                  >
                    50% ({formatCurrency(Math.floor(targetPendingBefore / 2))})
                  </button>
                )}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>
              ₹
            </span>
            <input
              type="number"
              className="form-input"
              required
              min="1"
              placeholder="e.g. 5000"
              style={{ paddingLeft: '28px', fontSize: '16px', fontWeight: 700 }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Live Calculation Preview */}
        {numAmount > 0 && (selectedSale || selectedPurchase || partyId) && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '6px' }}>
              LIVE LEDGER CALCULATION PREVIEW:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #dbeafe' }}>
                <div style={{ color: '#64748b', fontSize: '11px' }}>Previous Paid</div>
                <strong style={{ color: '#0f172a', fontSize: '13px' }}>{formatCurrency(targetPreviousPaid)}</strong>
              </div>
              <div style={{ background: '#ecfdf5', padding: '6px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                <div style={{ color: '#047857', fontSize: '11px' }}>This Payment</div>
                <strong style={{ color: '#059669', fontSize: '13px' }}>+{formatCurrency(numAmount)}</strong>
              </div>
              <div style={{ background: projectedRemaining === 0 ? '#ecfdf5' : '#fef2f2', padding: '6px 8px', borderRadius: '6px', border: `1px solid ${projectedRemaining === 0 ? '#a7f3d0' : '#fecaca'}` }}>
                <div style={{ color: projectedRemaining === 0 ? '#047857' : '#be123c', fontSize: '11px' }}>New Balance</div>
                <strong style={{ color: projectedRemaining === 0 ? '#059669' : '#e11d48', fontSize: '13px' }}>{formatCurrency(projectedRemaining)}</strong>
              </div>
            </div>
            {projectedRemaining === 0 && (
              <div style={{ marginTop: '8px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={14} /> This payment will fully settle and mark this bill as Paid!
              </div>
            )}
          </div>
        )}

        {/* Payment Mode Selection */}
        <div className="form-row" style={{ marginBottom: '12px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Payment Mode *</label>
            <select
              className="form-select"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="Cash">Cash (Hand-to-Hand)</option>
              <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Reference / UTR / Cheque #</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. UPI-260916-99128"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
          </div>
        </div>

        {/* Date & Time */}
        <div className="form-row" style={{ marginBottom: '12px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Time</label>
            <input
              type="text"
              className="form-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label">Notes / Remarks</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 2nd Installment collected at shop"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Safety & Independent Voucher Assurance */}
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '12px',
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <ShieldCheck size={18} color="#15803d" />
          <span>
            <strong>Independent Record:</strong> This entry will be saved as a brand-new receipt voucher (REC-xxx) in the customer's passbook. Previous payment records remain permanently intact.
          </span>
        </div>

        <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: '1 1 auto', minWidth: '100px' }}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" style={{ flex: '2 1 auto', padding: '10px 16px', fontWeight: 700, minWidth: '180px' }}>
            <Receipt size={16} /> Save & Record Payment Voucher
          </button>
        </div>
      </form>
    </Modal>

    {/* Embedded Quick Add Customer Modal */}
    <CustomerFormModal
      isOpen={isQuickCustomerOpen}
      onClose={() => setIsQuickCustomerOpen(false)}
      customer={null}
      zIndex={1100}
      onSave={async (cData) => {
        const newC = await dataService.saveCustomer(cData, currentUser);
        if (newC?.id) {
          handlePartyChange(newC.id);
          setIsQuickCustomerOpen(false);
        }
      }}
    />

    {/* Embedded Quick Add Supplier Modal */}
    <SupplierFormModal
      isOpen={isQuickSupplierOpen}
      onClose={() => setIsQuickSupplierOpen(false)}
      supplier={null}
      dataService={dataService}
      currentUser={currentUser}
      zIndex={1100}
      onSave={async (sData, productIds) => {
        const newS = await dataService.saveSupplier(sData, currentUser);
        if (productIds && newS?.id) {
          await dataService.saveSupplierProducts(newS.id, productIds, currentUser);
        }
        if (newS?.id) {
          handlePartyChange(newS.id);
          setIsQuickSupplierOpen(false);
        }
      }}
    />
  </>
  );
};
