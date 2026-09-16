import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { formatCurrency, formatDate, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';

export const RecordPaymentModal = ({
  isOpen,
  onClose,
  dataService,
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

  const customers = dataService.getCustomers();
  const suppliers = dataService.getSuppliers();
  const sales = dataService.getSales();
  const purchases = dataService.getPurchases();

  useEffect(() => {
    if (isOpen) {
      const type = initialPartyType || 'customer';
      const pId = initialPartyId || '';
      const dId = initialDocId || '';

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

  // Filter bills for selected party
  const partySales = sales.filter((s) => s.customer_id === partyId && s.pending_amount > 0);
  const partyPurchases = purchases.filter((p) => p.supplier_id === partyId && p.pending_amount > 0);

  const selectedSale = sales.find((s) => s.id === docId);
  const selectedPurchase = purchases.find((p) => p.id === docId);

  const partyLedger = partyId
    ? (partyType === 'customer' ? dataService.getCustomerLedger(partyId) : dataService.getSupplierLedger(partyId))
    : null;
  const partyPendingTotal = partyLedger ? partyLedger.pendingBalance : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0');
      return;
    }

    if (!partyId) {
      setError(`Please select a ${partyType}`);
      return;
    }

    try {
      if (partyType === 'customer') {
        const pay = dataService.recordCustomerPayment({
          customer_id: partyId,
          sale_id: docId || null,
          amount: numAmount,
          payment_mode: paymentMode,
          reference_no: referenceNo,
          date,
          time,
          notes
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
          notes
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment / Installment Entry"
      maxWidth="650px"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Party Type Toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`btn btn-sm ${partyType === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => {
              setPartyType('customer');
              setPartyId('');
              setDocId('');
              setAmount('');
            }}
          >
            Customer Payment Received (Inward)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${partyType === 'supplier' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => {
              setPartyType('supplier');
              setPartyId('');
              setDocId('');
              setAmount('');
            }}
          >
            Supplier Payment Made (Outward)
          </button>
        </div>

        {/* Party Selector */}
        <div className="form-group">
          <label className="form-label">
            {partyType === 'customer' ? 'Select Customer *' : 'Select Supplier *'}
          </label>
          <select
            className="form-select"
            required
            value={partyId}
            onChange={(e) => {
              setPartyId(e.target.value);
              setDocId('');
              setAmount('');
            }}
          >
            <option value="">-- Choose Party --</option>
            {partyType === 'customer'
              ? customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_id}) - {c.area || 'Nandipet'}
                  </option>
                ))
              : suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name} ({s.supplier_id}) - {s.area || 'Hub'}
                  </option>
                ))}
          </select>

          {partyId && (
            <div style={{ marginTop: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>
                {partyType === 'customer' ? 'Total Customer Pending Balance:' : 'Total Payable to Supplier:'}
              </span>
              <span style={{ fontWeight: 800, color: partyPendingTotal > 0 ? (partyType === 'customer' ? '#e11d48' : '#d97706') : '#10b981', background: '#f8fafc', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                {formatCurrency(partyPendingTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Invoice / Bill Link */}
        {partyId && (
          <div className="form-group">
            <label className="form-label">
              Select Bill / Invoice to Clear
            </label>
            <select
              className="form-select"
              value={docId}
              onChange={(e) => {
                setDocId(e.target.value);
                const item = partyType === 'customer'
                  ? partySales.find((s) => s.id === e.target.value)
                  : partyPurchases.find((p) => p.id === e.target.value);
                if (item) {
                  setAmount(String(item.pending_amount));
                } else {
                  setAmount('');
                }
              }}
            >
              <option value="">-- General Account Payment (All Outstanding Bills) --</option>
              {partyType === 'customer'
                ? partySales.map((s) => {
                    const productSummary = s.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ');
                    return (
                      <option key={s.id} value={s.id}>
                        {s.invoice_no} ({formatDate(s.date)}) - Items: {productSummary} - Due: {formatCurrency(s.pending_amount)}
                      </option>
                    );
                  })
                : partyPurchases.map((p) => {
                    const productSummary = p.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ');
                    return (
                      <option key={p.id} value={p.id}>
                        {p.purchase_no} ({formatDate(p.date)}) - Items: {productSummary} - Due: {formatCurrency(p.pending_amount)}
                      </option>
                    );
                  })}
            </select>
          </div>
        )}

        {/* Highlight details of linked bill */}
        {(selectedSale || selectedPurchase) && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, color: '#166534', fontSize: '14px' }}>
                Bill #{selectedSale?.invoice_no || selectedPurchase?.purchase_no} ({formatDate(selectedSale?.date || selectedPurchase?.date)})
              </span>
              <span className="badge badge-paid">
                {selectedSale?.payment_status || selectedPurchase?.payment_status}
              </span>
            </div>

            {/* Products on this bill */}
            {docItems.length > 0 && (
              <div style={{ background: '#ffffff', border: '1px solid #dcfce7', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  PRODUCTS ON THIS BILL:
                </div>
                {docItems.map((i, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#1e293b', marginBottom: '2px' }}>
                    <span>• {i.product_name}</span>
                    <span style={{ color: '#64748b' }}>
                      {i.quantity} {i.unit || ''} × {formatCurrency(i.selling_price || i.purchase_price)} = {formatCurrency(i.total || (i.quantity * (i.selling_price || i.purchase_price)))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', fontWeight: 600 }}>
              <span>Total Bill Amount:</span>
              <span>{formatCurrency(selectedSale?.total_amount || selectedPurchase?.total_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', marginTop: '4px' }}>
              <span>Already Paid Previously:</span>
              <span>{formatCurrency(selectedSale?.paid_amount || selectedPurchase?.paid_amount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c', fontWeight: 800, marginTop: '4px', borderTop: '1px dashed #a7f3d0', paddingTop: '6px', fontSize: '14px' }}>
              <span>Remaining Pending on this Bill:</span>
              <span>{formatCurrency(selectedSale?.pending_amount || selectedPurchase?.pending_amount)}</span>
            </div>
          </div>
        )}

        {/* Amount & Mode */}
        <div className="form-row">
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>Payment Amount (₹) *</label>
              {(selectedSale?.pending_amount > 0 || selectedPurchase?.pending_amount > 0 || partyPendingTotal > 0) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '1px 8px' }}
                  onClick={() => setAmount(String(selectedSale?.pending_amount || selectedPurchase?.pending_amount || partyPendingTotal))}
                >
                  Pay Full Due ({formatCurrency(selectedSale?.pending_amount || selectedPurchase?.pending_amount || partyPendingTotal)})
                </button>
              )}
            </div>
            <input
              type="number"
              className="form-input"
              required
              min="1"
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Mode *</label>
            <input
              type="number"
              className="form-input"
              required
              min="1"
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Mode *</label>
            <select
              className="form-select"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
              <option value="Cash">Cash (Hand-to-Hand)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Date, Time, Ref */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Payment Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Exact Time</label>
            <input
              type="text"
              className="form-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Reference / UTR #</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. UPI/260916/88912"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. 2nd Installment paid at shop"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-footer" style={{ margin: '16px -24px -24px', padding: '16px 24px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Record Individual Payment Slip
          </button>
        </div>
      </form>
    </Modal>
  );
};
