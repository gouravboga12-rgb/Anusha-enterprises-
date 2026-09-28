import React, { useState } from 'react';
import { Modal } from './Modal';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { Download, Printer, Edit, Calendar } from 'lucide-react';
import { exportElementToPdf } from '../../utils/pdfExport';

export const InvoiceModal = ({
  isOpen,
  onClose,
  type = 'sale', // customer invoice only
  doc: docProp,
  document: documentProp,
  dataService,
  onEdit
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [newVehicleInput, setNewVehicleInput] = useState('');
  const [isEditingEway, setIsEditingEway] = useState(false);
  const [newEwayInput, setNewEwayInput] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDateInput, setNewDateInput] = useState('');

  const baseDoc = docProp || documentProp;
  if (!baseDoc) return null;

  // Always resolve latest doc from dataService if available
  const doc = (dataService?.getSaleById ? dataService.getSaleById(baseDoc.id) : null) || baseDoc;

  // Resiliently resolve vehicle number, eway number and notes from all potential fields
  let vehicleNo = (doc.vehicle_no || doc.vehicleNo || doc.transport_no || doc.transportNo || '').trim();
  let ewayNo = (doc.eway_no || doc.ewayNo || doc.eway_bill_no || '').trim();
  let noteText = (doc.notes || doc.note || doc.remarks || doc.delivery_notes || doc.deliveryNotes || '').trim();

  // Parse if tags were saved inside notes
  if (noteText) {
    if (!vehicleNo) {
      const vMatch = noteText.match(/\[Vehicle:\s*([^\]]+)\]/i) || noteText.match(/(?:^|\n)Vehicle:\s*([^\n|]+)/i);
      if (vMatch) vehicleNo = vMatch[1].trim();
    }
    if (!ewayNo) {
      const eMatch = noteText.match(/\[EWay:\s*([^\]]+)\]/i) || noteText.match(/(?:^|\n)EWay:\s*([^\n|]+)/i);
      if (eMatch) ewayNo = eMatch[1].trim();
    }
    noteText = noteText
      .replace(/\[Vehicle:\s*[^\]]+\]/gi, '')
      .replace(/(?:^|\n)Vehicle:\s*[^\n|]+/gi, '')
      .replace(/\[EWay:\s*[^\]]+\]/gi, '')
      .replace(/(?:^|\n)EWay:\s*[^\n|]+/gi, '')
      .replace(/\[CustAddr:\s*[^\]]+\]/gi, '')
      .replace(/\(includes\s*₹?[\d,.]+\s*Advance\s*Payment\)/gi, '')
      .replace(/\[Advance:\s*[^\]]+\]/gi, '')
      .replace(/Advance\s*Payment:?\s*₹?[\d,.]+/gi, '')
      .trim();
  }

  const saleFromStore = dataService?.getSaleById ? (dataService.getSaleById(doc.id) || dataService.getSaleById(doc.invoice_no)) : null;
  const activeDoc = (doc.items && doc.items.length > 0) ? doc : (saleFromStore || doc);
  const customer = dataService?.getCustomerById(activeDoc.customer_id || doc.customer_id);
  const docNo = activeDoc.invoice_no || doc.invoice_no || 'INV';
  const items = (activeDoc.items && activeDoc.items.length > 0) ? activeDoc.items : (doc.items || []);

  // Calculate 18% GST (9% CGST + 9% SGST)
  const taxableSubtotal = (items.length > 0)
    ? items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.selling_price) || 0), 0)
    : (doc.subtotal !== undefined && doc.subtotal !== null && Number(doc.subtotal) > 0 ? Number(doc.subtotal) : 0);

  const cgstAmount = Math.round(taxableSubtotal * 0.09 * 100) / 100;
  const sgstAmount = Math.round(taxableSubtotal * 0.09 * 100) / 100;

  // The total bill amount must ALWAYS include the 18% GST (taxable subtotal + CGST 9% + SGST 9%)
  const totalAmount = Math.round((taxableSubtotal + cgstAmount + sgstAmount) * 100) / 100;

  const rawPaidAmount = Number(doc.paid_amount || activeDoc.paid_amount) || 0;
  // If payment exceeds bill amount, cap display at totalAmount (do not mention advance on invoice)
  const paidAmount = Math.min(rawPaidAmount, totalAmount);
  const pendingAmount = Math.max(0, totalAmount - rawPaidAmount);
  const paymentStatus = pendingAmount === 0 ? 'Paid' : rawPaidAmount > 0 ? 'Partially Paid' : 'Pending';

  // Customer Address: prioritize invoice-specific address then customer master address
  const customerAddress = (doc.customer_address || customer?.address || '').trim();

  const handleSaveVehicle = () => {
    try {
      const v = newVehicleInput.trim();
      dataService?.updateSale(doc.id, { vehicle_no: v }, 'Vehicle number updated from invoice view');
      setIsEditingVehicle(false);
    } catch (e) {
      console.error('Failed to update vehicle number:', e);
    }
  };

  const handleSaveEway = () => {
    try {
      const ew = newEwayInput.trim();
      dataService?.updateSale(doc.id, { eway_no: ew }, 'E-way number updated from invoice view');
      setIsEditingEway(false);
    } catch (e) {
      console.error('Failed to update E-way number:', e);
    }
  };

  const handleSaveDate = () => {
    try {
      const d = newDateInput.trim();
      if (d) {
        dataService?.updateSale(doc.id, { date: d }, 'Date updated from invoice view');
      }
      setIsEditingDate(false);
    } catch (e) {
      console.error('Failed to update date:', e);
    }
  };

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const cleanDocNo = docNo.replace(/[^a-zA-Z0-9_-]/g, '_');
      const partyName = (customer?.name || 'Customer').replace(/[^a-zA-Z0-9_-]/g, '_');
      await exportElementToPdf({
        element: '#invoice-printable-content',
        filename: `Tax_Invoice_${cleanDocNo}_${partyName}.pdf`,
        title: `Tax Invoice - ${docNo}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('invoice-printable-content');
    if (!content) {
      window.print();
      return;
    }

    try {
      const printWindow = window.open('', '_blank', 'width=900,height=800');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Tax Invoice - ${docNo}</title>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  background: #ffffff;
                  color: #0f172a;
                  padding: 20px 24px;
                  font-size: 12px;
                  line-height: 1.5;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print { display: none !important; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { padding: 8px 10px; border-bottom: 1.5px solid #cbd5e1; text-align: left; }
                th { background-color: #f1f5f9; font-weight: 800; color: #0f172a; border-bottom: 2px solid #0f172a; }
                td strong, td span { font-weight: 700; color: #0f172a; }
                .badge { border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 6px; font-size: 11px; display: inline-block; }
                .badge-paid { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
                .badge-partial { background: #fffbeb; color: #d97706; border-color: #fde68a; }
                .badge-pending { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
                @page { size: A4 portrait; margin: 10mm 12mm; }
                @media print {
                  body { padding: 0; }
                  .invoice-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; }
                }
              </style>
            </head>
            <body>
              ${content.outerHTML}
              <script>
                window.onload = function() {
                  window.focus();
                  window.print();
                  setTimeout(function() { window.close(); }, 800);
                };
              <\/script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    } catch (e) {
      console.warn('Popup print blocked or failed, falling back to window.print()', e);
    }

    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.classList.add('print-active');
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sales Invoice — ${docNo}`}
      maxWidth="860px"
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
            <span className="badge badge-active" style={{ fontSize: '12px', padding: '4px 10px', fontWeight: 700 }}>
              Customer Tax Invoice
            </span>
            <strong style={{ fontSize: '15px', color: '#0f172a' }}>{docNo}</strong>
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
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontWeight: 700 }}
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
                  onEdit(doc, 'sale');
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
                title="Edit this sale bill details and items"
              >
                <Edit size={15} />
                <span>Edit Sale</span>
              </button>
            )}
          </div>
        </div>

        {/* Printable / Downloadable Invoice Document */}
        <div className="invoice-scroll-wrapper">
          <div
            id="invoice-printable-content"
            className="print-document invoice-sheet"
            style={{
              background: '#ffffff',
              padding: '24px 28px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              color: '#0f172a'
            }}
          >
            {/* Header Banner */}
            <div className="invoice-header-banner" style={{
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '22px'
                  }}>
                    A
                  </div>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>
                      ANUSHA ENTERPRISES
                    </h2>
                  </div>
                </div>
                <div style={{ margin: '8px 0 0', fontSize: '12px', color: '#1e293b', lineHeight: 1.5, fontWeight: 600 }}>
                  HNO:7-104, Macherla (v), Armoor (M), Nizamabad Dist., T.G. - 503224<br />
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>GSTIN:</span> 36ABKFA2071L1ZB &bull; <span style={{ fontWeight: 800, color: '#0f172a' }}>Mobile:</span> 96409 12521
                </div>
              </div>

              {/* Top Right: Only TAX INVOICE (No Purchase Bill, No Supply Bill) */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '17px',
                  fontWeight: 900,
                  color: '#0284c7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '2px'
                }}>
                  TAX INVOICE
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  {docNo}
                </div>

                {/* E-way Number Custom Field (Below Invoice Number) */}
                {isEditingEway ? (
                  <div className="no-print" style={{ marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '11px', padding: '2px 6px', width: '130px', textTransform: 'uppercase' }}
                      placeholder="E-way bill no"
                      value={newEwayInput}
                      onChange={(e) => setNewEwayInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '11px', padding: '2px 6px', fontWeight: 700 }}
                      onClick={handleSaveEway}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '2px 6px' }}
                      onClick={() => setIsEditingEway(false)}
                    >
                      ✕
                    </button>
                  </div>
                ) : ewayNo ? (
                  <div style={{
                    fontSize: '12px',
                    color: '#0f172a',
                    marginTop: '4px',
                    background: '#f8fafc',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: '1.5px solid #0f172a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 800
                  }}>
                    <span>🚚 E-Way No: <strong style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>{ewayNo}</strong></span>
                    <button
                      type="button"
                      className="no-print"
                      onClick={() => {
                        setNewEwayInput(ewayNo);
                        setIsEditingEway(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#0284c7',
                        marginLeft: '3px',
                        padding: '0 2px',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                      title="Edit E-Way Number"
                    >
                      <Edit size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="no-print" style={{ marginTop: '3px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setNewEwayInput('');
                        setIsEditingEway(true);
                      }}
                      style={{
                        background: '#f8fafc',
                        border: '1px dashed #94a3b8',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#475569',
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        fontWeight: 600
                      }}
                    >
                      + Add E-Way No
                    </button>
                  </div>
                )}

                {/* Date (Option to edit date, and TIME REMOVED) */}
                <div style={{ fontSize: '12px', color: '#1e293b', marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  {isEditingDate ? (
                    <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="date"
                        className="form-input"
                        style={{ fontSize: '11px', padding: '2px 6px' }}
                        value={newDateInput}
                        onChange={(e) => setNewDateInput(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '10.5px', padding: '2px 6px', fontWeight: 700 }}
                        onClick={handleSaveDate}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '10.5px', padding: '2px 6px' }}
                        onClick={() => setIsEditingDate(false)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <strong style={{ fontWeight: 800 }}>Date:</strong> {formatDate(doc.date)}
                      <button
                        type="button"
                        className="no-print"
                        onClick={() => {
                          setNewDateInput(doc.date || getTodayDateString());
                          setIsEditingDate(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#0284c7',
                          padding: '1px 3px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Edit Invoice Date"
                      >
                        <Calendar size={12} />
                      </button>
                    </>
                  )}
                </div>

                {/* Vehicle Number Input / Display */}
                {isEditingVehicle ? (
                  <div className="no-print" style={{ marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '11px', padding: '2px 6px', width: '130px', textTransform: 'uppercase' }}
                      placeholder="Vehicle No"
                      value={newVehicleInput}
                      onChange={(e) => setNewVehicleInput(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '11px', padding: '2px 6px', fontWeight: 700 }}
                      onClick={handleSaveVehicle}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '2px 6px' }}
                      onClick={() => setIsEditingVehicle(false)}
                    >
                      ✕
                    </button>
                  </div>
                ) : vehicleNo ? (
                  <div style={{
                    fontSize: '12px',
                    color: '#0f172a',
                    marginTop: '5px',
                    background: '#eff6ff',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: '1.5px solid #0f172a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 800
                  }}>
                    <span>🚗 Vehicle: <strong style={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>{vehicleNo}</strong></span>
                    <button
                      type="button"
                      className="no-print"
                      onClick={() => {
                        setNewVehicleInput(vehicleNo);
                        setIsEditingVehicle(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#0284c7',
                        marginLeft: '3px',
                        padding: '0 2px',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                      title="Edit Vehicle Number"
                    >
                      <Edit size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="no-print" style={{ marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setNewVehicleInput('');
                        setIsEditingVehicle(true);
                      }}
                      style={{
                        background: '#f8fafc',
                        border: '1px dashed #94a3b8',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#475569',
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        fontWeight: 600
                      }}
                    >
                      + Add Vehicle No
                    </button>
                  </div>
                )}

                <div style={{ marginTop: '5px' }}>
                  <span className={`badge ${
                    paymentStatus === 'Paid' ? 'badge-paid' : paymentStatus === 'Partially Paid' ? 'badge-partial' : 'badge-pending'
                  }`} style={{ fontSize: '11px', fontWeight: 700 }}>
                    Status: {paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Party Details: Billed By Company & Billed To Customer */}
            <div className="invoice-parties-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '14px 18px'
            }}>
              {/* Left Box: Seller / Dispatcher */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  BILLED & DISPATCHED BY (COMPANY)
                </span>
                <div style={{ marginTop: '5px' }}>
                  <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>ANUSHA ENTERPRISES</strong>
                  <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                    HNO:7-104, Macherla (v), Armoor (M), Nizamabad Dist., T.G. - 503224
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                    <strong>GSTIN:</strong> 36ABKFA2071L1ZB &bull; <strong>Phone:</strong> 96409 12521
                  </div>
                </div>
              </div>

              {/* Right Box: Buyer / Recipient (Billed to Customer - KHATA term removed) */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  BILLED TO (CUSTOMER)
                </span>
                <div style={{ marginTop: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '15px', color: '#0f172a', fontWeight: 800 }}>
                      {customer ? customer.name : (doc.customer_name || 'Customer')}
                    </strong>
                    {customer?.customer_id && (
                      <span className="badge badge-active" style={{ fontSize: '10.5px', fontWeight: 700 }}>
                        {customer.customer_id}
                      </span>
                    )}
                  </div>
                  {customer?.mobile && (
                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600, marginTop: '2px' }}>
                      <strong>Phone:</strong> {customer.mobile}
                    </div>
                  )}
                  {customer?.area && (
                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                      <strong>Area:</strong> {customer.area}
                    </div>
                  )}
                  {customerAddress && (
                    <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700, marginTop: '2px' }}>
                      <strong>Address:</strong> {customerAddress}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products Table with HSN CODE (Godown column replaced) and Bold thick text */}
            <div className="table-responsive" style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              width: '100%',
              marginBottom: '20px',
              border: '1.5px solid #0f172a',
              borderRadius: '8px'
            }}>
              <table className="data-table" style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #0f172a' }}>
                    <th style={{ width: '40px', padding: '10px', textAlign: 'center', fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>#</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>PRODUCT DESCRIPTION</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>HSN CODE</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>QUANTITY & TYPE</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>UNIT PRICE (₹)</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>CALCULATION</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>TOTAL AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const prod = dataService?.getProductById(item.product_id);
                    const unit = (item.unit && String(item.unit).trim()) || prod?.unit || 'Units';
                    const hsn = (item.hsn_code && String(item.hsn_code).trim()) || prod?.hsn_code || '—';
                    const rate = Number(item.selling_price) || 0;
                    const qty = Number(item.quantity) || 0;
                    const lineTotal = Number(item.total) || (qty * rate);

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>
                          <strong style={{ color: '#0f172a', fontWeight: 800 }}>{item.product_name}</strong>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                          {hsn}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontSize: '13px' }}>
                          <strong style={{ color: '#0f172a', fontWeight: 800 }}>{qty}</strong>{' '}
                          <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: 700 }}>{unit}</span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                          {formatCurrency(rate)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                          {qty} {unit} × ₹{rate.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Split: Clean Offline Writing Notes Box & GST Financial Breakdown */}
            <div className="invoice-totals-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Notes & Offline handwriting section */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #0f172a',
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px'
              }}>
                <div>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '8px',
                    borderBottom: '1.5px solid #e2e8f0',
                    paddingBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>📋</span> INVOICE NOTES & DISPATCH DETAILS
                  </div>

                  {vehicleNo ? (
                    <div style={{
                      marginBottom: '8px',
                      padding: '6px 10px',
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ fontSize: '14px' }}>🚗</span>
                      <div style={{ fontSize: '12.5px', color: '#0f172a', fontWeight: 700 }}>
                        <span>Vehicle / Transport No: </span>
                        <strong style={{ fontWeight: 800, textTransform: 'uppercase' }}>{vehicleNo}</strong>
                      </div>
                    </div>
                  ) : null}

                  {/* Clean Notes & Offline Writing Lines */}
                  <div style={{
                    padding: '10px 12px',
                    background: '#fcfcfd',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    minHeight: '85px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#475569',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}>
                      📝 NOTE / REMARKS:
                    </div>
                    {noteText ? (
                      <div style={{
                        fontSize: '13px',
                        color: '#0f172a',
                        fontWeight: 700,
                        lineHeight: '1.45',
                        wordBreak: 'break-word',
                        marginBottom: '6px'
                      }}>
                        {noteText}
                      </div>
                    ) : null}
                    {/* Clean Handwriting Lines for Offline Writing */}
                    <div style={{ borderBottom: '1px dotted #94a3b8', height: '22px' }}></div>
                    <div style={{ borderBottom: '1px dotted #94a3b8', height: '22px' }}></div>
                  </div>
                </div>


              </div>

              {/* Financial Summary Card with 18% GST (9% CGST + 9% SGST) */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #0f172a',
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#334155' }}>
                  <span style={{ fontWeight: 600 }}>Subtotal (Taxable Amount):</span>
                  <strong style={{ color: '#0f172a', fontSize: '14px', fontWeight: 800 }}>{formatCurrency(taxableSubtotal)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#334155' }}>
                  <span style={{ fontWeight: 600 }}>Central GST (CGST 9%):</span>
                  <strong style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: 700 }}>+{formatCurrency(cgstAmount)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#334155' }}>
                  <span style={{ fontWeight: 600 }}>State GST (SGST 9%):</span>
                  <strong style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: 700 }}>+{formatCurrency(sgstAmount)}</strong>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14.5px',
                  fontWeight: 900,
                  borderTop: '1.5px solid #cbd5e1',
                  paddingTop: '8px',
                  color: '#0f172a'
                }}>
                  <span>Total Bill Amount (Incl. 18% GST):</span>
                  <span style={{ fontSize: '16px', color: '#0284c7' }}>{formatCurrency(totalAmount)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a', fontWeight: 700 }}>
                  <span>Paid / Inward Received:</span>
                  <strong>{formatCurrency(paidAmount)}</strong>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '14px',
                  fontWeight: 900,
                  borderTop: '1.5px dashed #cbd5e1',
                  paddingTop: '8px',
                  color: pendingAmount > 0 ? '#b91c1c' : '#16a34a'
                }}>
                  <span>Customer Balance Due:</span>
                  <span>{formatCurrency(pendingAmount)}</span>
                </div>
              </div>
            </div>

            {/* Footer Signatures: Receiver Sign on Left, Authorized Signatory on Right */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingTop: '20px',
              borderTop: '1.5px solid #0f172a',
              marginTop: '16px',
              fontSize: '11px',
              color: '#64748b',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              {/* Receiver Sign Part (image copy 39.png) */}
              <div style={{ textAlign: 'center', minWidth: '180px' }}>
                <div style={{ borderBottom: '1.5px solid #0f172a', height: '36px', marginBottom: '6px' }}></div>
                <strong style={{ color: '#0f172a', fontSize: '12.5px', fontWeight: 800 }}>Receiver's Signature</strong>
                <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 600 }}>Customer Acknowledgment</div>
              </div>

              <div>
                <p style={{ margin: 0, fontWeight: 600, color: '#475569' }}>* Computer-generated tax invoice from Anusha Enterprises CRM.</p>
                <p style={{ margin: '2px 0 0', fontSize: '10px' }}>
                  Date: {formatDate(getTodayDateString())}
                </p>
              </div>

              {/* Authorized Signatory */}
              <div style={{ textAlign: 'center', minWidth: '180px' }}>
                <div style={{ borderBottom: '1.5px solid #0f172a', height: '36px', marginBottom: '6px' }}></div>
                <strong style={{ color: '#0f172a', fontSize: '12.5px', fontWeight: 800 }}>Authorized Signatory</strong>
                <div style={{ fontSize: '10.5px', color: '#475569', fontWeight: 600 }}>For Anusha Enterprises</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Close & Edit */}
        <div className="modal-footer no-print" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {onEdit && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onClose();
                onEdit(doc, 'sale');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a',
                fontWeight: 700,
              }}
            >
              <Edit size={15} />
              <span>Edit Sale Bill</span>
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontWeight: 600 }}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
