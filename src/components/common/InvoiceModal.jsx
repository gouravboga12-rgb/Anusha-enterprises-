import React, { useState } from 'react';
import { Modal } from './Modal';
import { formatCurrency, formatDate, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { Download, Printer, CheckCircle2, ShieldCheck, Building2, User, FileText, ArrowRight, Edit } from 'lucide-react';
import { exportElementToPdf } from '../../utils/pdfExport';

export const InvoiceModal = ({
  isOpen,
  onClose,
  type = 'sale', // 'sale' | 'purchase'
  doc: docProp,
  document: documentProp,
  dataService,
  onEdit
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const doc = docProp || documentProp;
  if (!doc) return null;

  const isSale = type === 'sale';
  const customer = isSale ? dataService?.getCustomerById(doc.customer_id) : null;
  const supplier = !isSale ? dataService?.getSupplierById(doc.supplier_id) : null;
  const primaryGodown = !isSale ? dataService?.getGodownById(doc.godown_id) : null;

  const docNo = isSale ? (doc.invoice_no || 'INV') : (doc.purchase_no || 'PUR');
  const items = doc.items || [];
  const totalAmount = doc.total_amount || 0;
  const paidAmount = doc.paid_amount || 0;
  const pendingAmount = doc.pending_amount || 0;
  const paymentStatus = doc.payment_status || (pendingAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Pending');

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const cleanDocNo = docNo.replace(/[^a-zA-Z0-9_-]/g, '_');
      const partyName = (isSale ? (customer?.name || 'Customer') : (supplier?.company_name || 'Supplier')).replace(/[^a-zA-Z0-9_-]/g, '_');
      await exportElementToPdf({
        element: '#invoice-printable-content',
        filename: `${isSale ? 'Sales_Invoice' : 'Purchase_Bill'}_${cleanDocNo}_${partyName}.pdf`,
        title: `${isSale ? 'Sales Invoice' : 'Purchase Bill'} - ${docNo}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSale ? `Sales Invoice — ${docNo}` : `Supplier Purchase Bill — ${docNo}`}
      maxWidth="840px"
    >
      <div>
        {/* Action Bar (Top) */}
        <div className="no-print" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isSale ? 'badge-active' : 'badge-warning'}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
              {isSale ? 'Customer Tax Invoice' : 'Supplier Inward Bill'}
            </span>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{docNo}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f0fdf4',
                color: '#16a34a',
                border: '1px solid #bbf7d0',
                fontWeight: 700,
                padding: '6px 14px'
              }}
            >
              <Download size={15} />
              <span>{isExporting ? 'Preparing PDF...' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontWeight: 600 }}
            >
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>
            {onEdit && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  onClose();
                  onEdit(doc, type);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  fontWeight: 700,
                  padding: '6px 14px'
                }}
                title={isSale ? 'Edit this sale bill details and items' : 'Edit this purchase bill details and items'}
              >
                <Edit size={15} />
                <span>{isSale ? 'Edit Sale' : 'Edit Purchase'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Printable / Downloadable Invoice Document */}
        <div
          id="invoice-printable-content"
          className="print-document"
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '24px 28px',
            color: '#0f172a',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Header Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2.5px solid #0284c7',
            paddingBottom: '16px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '18px'
                }}>
                  A
                </div>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    ANUSHA ENTERPRISES
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b' }}>
                    Electricals, Electronics & General Hardware Trading
                  </p>
                </div>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                Main Road, Nandipet, Nizamabad Dist. • Telangana - 503212<br />
                <strong>Mobile:</strong> 96409 12521 • <strong>GST / Trade:</strong> Verified Digital Ledger
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 800,
                color: isSale ? '#0284c7' : '#d97706',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '4px'
              }}>
                {isSale ? 'TAX INVOICE / SALES BILL' : 'SUPPLIER PURCHASE BILL'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                {docNo}
              </div>
              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '3px' }}>
                <strong>Date:</strong> {formatDate(doc.date)}
              </div>
              {doc.time && (
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  <strong>Time:</strong> {doc.time}
                </div>
              )}
              <div style={{ marginTop: '5px' }}>
                <span className={`badge ${
                  paymentStatus === 'Paid' ? 'badge-paid' : paymentStatus === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                }`} style={{ fontSize: '10.5px' }}>
                  Status: {paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Party Details: From & To */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 18px'
          }}>
            {/* Left Box: Seller / Dispatcher */}
            <div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isSale ? 'BILLED & DISPATCHED BY (COMPANY)' : 'PURCHASED & RECEIVED FROM (SUPPLIER)'}
              </span>
              {isSale ? (
                <div style={{ marginTop: '4px' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>ANUSHA ENTERPRISES</strong>
                  <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                    Main Road, Nandipet, Nizamabad Dist.
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#475569' }}>
                    Phone: 96409 12521
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '4px' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                    {supplier ? supplier.company_name : 'Supplier'}
                  </strong>
                  {supplier?.supplier_id && (
                    <span className="badge badge-warning" style={{ marginLeft: '6px', fontSize: '10px' }}>
                      {supplier.supplier_id}
                    </span>
                  )}
                  {supplier?.supplier_name && (
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                      Contact: {supplier.supplier_name}
                    </div>
                  )}
                  {supplier?.mobile && (
                    <div style={{ fontSize: '11.5px', color: '#475569' }}>
                      Phone: {supplier.mobile}
                    </div>
                  )}
                  {supplier?.area && (
                    <div style={{ fontSize: '11.5px', color: '#475569' }}>
                      Area: {supplier.area}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Box: Buyer / Recipient */}
            <div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {isSale ? 'BILLED TO (CUSTOMER / KHATA)' : 'DELIVERED & CONSIGNED TO (COMPANY)'}
              </span>
              {isSale ? (
                <div style={{ marginTop: '4px' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                    {customer ? customer.name : 'Walk-in Customer'}
                  </strong>
                  {customer?.customer_id && (
                    <span className="badge badge-active" style={{ marginLeft: '6px', fontSize: '10px' }}>
                      {customer.customer_id}
                    </span>
                  )}
                  {customer?.mobile && (
                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                      Phone: {customer.mobile}
                    </div>
                  )}
                  {customer?.area && (
                    <div style={{ fontSize: '11.5px', color: '#475569' }}>
                      Area: {customer.area}
                    </div>
                  )}
                  {customer?.address && (
                    <div style={{ fontSize: '11.5px', color: '#475569' }}>
                      Address: {customer.address}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: '4px' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>ANUSHA ENTERPRISES</strong>
                  <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                    Destination Godown: <strong>{primaryGodown?.name || 'Main Godown'}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#475569' }}>
                    Main Road, Nandipet, Nizamabad Dist.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products Billed Table with Quantity & Quantity Type Multiplied by Price */}
          <div style={{ marginBottom: '20px' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ width: '40px', padding: '10px', textAlign: 'center', fontSize: '11px' }}>#</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px' }}>Product Description</th>
                  <th style={{ padding: '10px', textAlign: 'left', fontSize: '11px' }}>Godown</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontSize: '11px' }}>Quantity & Type</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px' }}>Unit Price (₹)</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px' }}>Calculation</th>
                  <th style={{ padding: '10px', textAlign: 'right', fontSize: '11px' }}>Total Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const prod = dataService?.getProductById(item.product_id);
                  const unit = (item.unit && String(item.unit).trim()) || prod?.unit || 'Units';
                  const g = dataService?.getGodownById(item.godown_id) || primaryGodown;
                  const rate = isSale ? (Number(item.selling_price) || 0) : (Number(item.purchase_price) || 0);
                  const qty = Number(item.quantity) || 0;
                  const lineTotal = Number(item.total) || (qty * rate);

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px', fontSize: '12.5px' }}>
                        <strong style={{ color: '#0f172a' }}>{item.product_name}</strong>
                      </td>
                      <td style={{ padding: '10px', fontSize: '11.5px', color: '#64748b' }}>
                        {g ? g.name : '—'}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontSize: '12.5px' }}>
                        <strong style={{ color: '#0284c7' }}>{qty}</strong>{' '}
                        <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>{unit}</span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '12.5px', color: '#334155' }}>
                        {formatCurrency(rate)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '11.5px', color: '#64748b' }}>
                        {qty} {unit} × ₹{rate.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Split: Notes & Payment Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Notes / Transport Reference */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  {isSale ? 'Delivery Reference / Notes' : 'Transport LR# / Delivery Reference'}
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#334155', fontStyle: doc.notes ? 'normal' : 'italic' }}>
                  {doc.notes || 'No special delivery instructions recorded.'}
                </p>
              </div>

              <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b' }}>
                Recorded by: <strong>{doc.recorded_by || 'Admin'}</strong>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#475569' }}>
                <span>Total Bill Amount:</span>
                <strong style={{ color: '#0f172a', fontSize: '15px' }}>{formatCurrency(totalAmount)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#16a34a' }}>
                <span>Paid / Inward Received:</span>
                <strong>{formatCurrency(paidAmount)}</strong>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
                fontWeight: 800,
                borderTop: '1.5px dashed #cbd5e1',
                paddingTop: '8px',
                color: pendingAmount > 0 ? '#b91c1c' : '#16a34a'
              }}>
                <span>{isSale ? 'Customer Balance Due:' : 'Balance Payable to Supplier:'}</span>
                <span>{formatCurrency(pendingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: '24px',
            borderTop: '1px solid #e2e8f0',
            marginTop: '20px',
            fontSize: '11px',
            color: '#64748b',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <p style={{ margin: 0 }}>* This is a computer-generated invoice from Anusha Enterprises CRM System.</p>
              <p style={{ margin: '2px 0 0', fontSize: '10px' }}>
                Generated on: {formatDate(getTodayDateString())} {getCurrentTimeString()}
              </p>
            </div>

            <div style={{ textAlign: 'center', minWidth: '180px' }}>
              <div style={{ borderBottom: '1px solid #0f172a', height: '36px', marginBottom: '6px' }}></div>
              <strong style={{ color: '#0f172a', fontSize: '12px' }}>Authorized Signatory</strong>
              <div style={{ fontSize: '10px', color: '#64748b' }}>For Anusha Enterprises</div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
