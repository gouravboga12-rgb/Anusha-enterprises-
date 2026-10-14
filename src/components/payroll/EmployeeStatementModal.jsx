import React, { useState, useMemo } from 'react';
import {
  X, Download, Printer, Calendar, User, Phone, Briefcase, CreditCard,
  IndianRupee, CheckCircle2, Clock, FileText, ArrowRight, ArrowDownRight,
  TrendingDown, TrendingUp, AlertCircle, BookOpen, Layers
} from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';

export const EmployeeStatementModal = ({
  isOpen,
  onClose,
  employee,
  dataService,
  currentMonthYear
}) => {
  // Two clean record view modes: 'passbook' (all-time continuous transactions) or 'monthly' (month-by-month classified boxes)
  const [viewMode, setViewMode] = useState('passbook'); // 'passbook' | 'monthly'
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all'); // 'all' or 'YYYY-MM'
  const [isExporting, setIsExporting] = useState(false);

  // Fetch full salary history from dataService
  const historyData = useMemo(() => {
    if (!employee || !dataService?.getEmployeeSalaryHistory) {
      return { history: [], totalMonths: 0, totalBaseSalary: 0, totalAdvance: 0, totalPaid: 0, totalPending: 0 };
    }
    return dataService.getEmployeeSalaryHistory(employee.id);
  }, [employee, dataService, isOpen]);

  // Ensure current month is included if missing
  const monthlyGroups = useMemo(() => {
    const list = [...(historyData.history || [])];
    const curMonth = currentMonthYear || getTodayDateString().slice(0, 7);
    const hasCurMonth = list.some((s) => s.month_year === curMonth);

    if (!hasCurMonth && employee) {
      list.push({
        id: 'placeholder-current',
        employee_id: employee.id,
        employee_name: employee.name,
        month_year: curMonth,
        base_salary: Number(employee.base_salary) || 0,
        advance_amount: 0,
        paid_amount: 0,
        net_payable: Number(employee.base_salary) || 0,
        pending_balance: Number(employee.base_salary) || 0,
        payment_date: null,
        payment_mode: employee.payment_mode_preference || 'Cash',
        status: 'Pending',
        is_placeholder: true
      });
    }

    // Sort newest month first
    list.sort((a, b) => (b.month_year || '').localeCompare(a.month_year || ''));

    if (selectedMonthFilter !== 'all') {
      return list.filter((s) => s.month_year === selectedMonthFilter);
    }

    return list;
  }, [historyData.history, currentMonthYear, employee, selectedMonthFilter]);

  if (!isOpen || !employee) return null;

  const formatMonthLabel = (my) => {
    if (!my) return '';
    try {
      const [year, month] = my.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return my;
    }
  };

  // Helper to extract granular date-by-date transactions for each monthly settlement
  const getMonthTransactions = (settlement) => {
    const transactions = [];

    // 1. Advance transactions
    if (settlement.advance_history && Array.isArray(settlement.advance_history) && settlement.advance_history.length > 0) {
      settlement.advance_history.forEach((adv, idx) => {
        transactions.push({
          id: adv.id || `adv-${idx}-${adv.date}`,
          month_year: settlement.month_year,
          date: adv.date || settlement.advance_date || settlement.created_at?.slice(0, 10),
          type: 'ADVANCE',
          typeLabel: 'Advance Deducted',
          payment_mode: adv.payment_mode || 'Cash',
          reference_no: '',
          notes: adv.notes || 'Interim salary advance taken',
          debit: Number(adv.amount) || 0,
          credit: 0
        });
      });
    } else if (Number(settlement.advance_amount) > 0) {
      transactions.push({
        id: `adv-single-${settlement.id}`,
        month_year: settlement.month_year,
        date: settlement.advance_date || settlement.created_at?.slice(0, 10),
        type: 'ADVANCE',
        typeLabel: 'Advance Deducted',
        payment_mode: 'Cash',
        reference_no: '',
        notes: settlement.advance_notes || 'Salary advance deduction',
        debit: Number(settlement.advance_amount) || 0,
        credit: 0
      });
    }

    // 2. Disbursement & Due Clearance transactions
    if (settlement.payment_history && Array.isArray(settlement.payment_history) && settlement.payment_history.length > 0) {
      settlement.payment_history.forEach((pay, idx) => {
        const isDuePayment = pay.notes?.toLowerCase().includes('due') || pay.id?.startsWith('pay-due');
        transactions.push({
          id: pay.id || `pay-${idx}-${pay.date}`,
          month_year: settlement.month_year,
          date: pay.date || settlement.payment_date || settlement.created_at?.slice(0, 10),
          type: isDuePayment ? 'DUE_CLEARANCE' : 'SALARY_CREDITED',
          typeLabel: isDuePayment ? 'Due Balance Cleared' : 'Salary Disbursed',
          payment_mode: pay.payment_mode || settlement.payment_mode || 'Cash',
          reference_no: pay.reference_no || settlement.reference_no || '',
          notes: pay.notes || 'Monthly salary disbursement',
          debit: 0,
          credit: Number(pay.amount) || 0
        });
      });
    } else if (Number(settlement.paid_amount) > 0) {
      transactions.push({
        id: `pay-single-${settlement.id}`,
        month_year: settlement.month_year,
        date: settlement.payment_date || settlement.created_at?.slice(0, 10),
        type: 'SALARY_CREDITED',
        typeLabel: 'Salary Disbursed',
        payment_mode: settlement.payment_mode || 'Cash',
        reference_no: settlement.reference_no || '',
        notes: settlement.notes || 'Monthly salary disbursement',
        debit: 0,
        credit: Number(settlement.paid_amount) || 0
      });
    }

    // Sort transactions chronologically
    transactions.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return transactions;
  };

  // Unified all-time continuous passbook list (newest first)
  const allTimePassbookEntries = useMemo(() => {
    const list = [];
    (historyData.history || []).forEach((settlement) => {
      const txs = getMonthTransactions(settlement);
      txs.forEach((tx) => list.push(tx));
    });

    if (selectedMonthFilter !== 'all') {
      return list.filter((t) => t.month_year === selectedMonthFilter)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }

    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [historyData.history, selectedMonthFilter]);

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const cleanName = (employee.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      await exportElementToPdf({
        element: '#employee-ledger-records-container',
        filename: `Employee_Ledger_Records_${cleanName}_${getTodayDateString()}.pdf`,
        title: `Employee Salary Ledger Records - ${employee.name}`
      });
    } catch (err) {
      console.warn('PDF export fallback:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{
          maxWidth: '960px',
          width: '96%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#eff6ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '20px',
                border: '1.5px solid #bfdbfe'
              }}
            >
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {employee.name} — Salary Ledger Records
                </h2>
                <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  Passbook Records
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', marginTop: '2px', flexWrap: 'wrap' }}>
                <span>{employee.designation}</span>
                <span>•</span>
                <span>Phone: {employee.phone}</span>
                <span>•</span>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>
                  Fixed Salary: {formatCurrency(employee.base_salary)}/mo
                </span>
                <span>•</span>
                <span>Mode: {employee.payment_mode_preference || 'Cash'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* View Controls & Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '12px 22px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0
          }}
        >
          {/* Record View Mode Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={`payroll-tab-btn ${viewMode === 'passbook' ? 'active' : ''}`}
              onClick={() => setViewMode('passbook')}
              style={{
                fontSize: '12.5px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: viewMode === 'passbook' ? 800 : 600
              }}
            >
              <BookOpen size={15} />
              📜 All-Time Passbook (Date-by-Date Records)
            </button>
            <button
              className={`payroll-tab-btn ${viewMode === 'monthly' ? 'active' : ''}`}
              onClick={() => setViewMode('monthly')}
              style={{
                fontSize: '12.5px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: viewMode === 'monthly' ? 800 : 600
              }}
            >
              <Layers size={15} />
              📅 Month-Wise Breakdown ({historyData.totalMonths || 1} Months)
            </button>
          </div>

          {/* Month Filter Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Filter Month:</span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 700,
                background: '#ffffff',
                color: '#0f172a'
              }}
            >
              <option value="all">All Months ({historyData.totalMonths || 1})</option>
              {monthlyGroups.map((s) => (
                <option key={s.month_year} value={s.month_year}>
                  {formatMonthLabel(s.month_year)}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => window.print()}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              {isExporting ? 'Generating PDF...' : 'Download Statement PDF'}
            </button>
          </div>
        </div>

        {/* Scrollable Records Body */}
        <div
          className="modal-body"
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            flex: 1,
            background: '#f1f5f9'
          }}
        >
          {/* Printable Document Sheet */}
          <div
            id="employee-ledger-records-container"
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              background: '#ffffff',
              borderRadius: '10px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            {/* Header Brand */}
            <div
              style={{
                borderBottom: '2px solid #0f172a',
                paddingBottom: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src="/logo.png"
                    alt="Anusha Enterprises"
                    style={{ height: '32px', width: '32px', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    ANUSHA ENTERPRISES
                  </h2>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Wholesale Commercial Explosives • Main Road, Nandipet, Nizamabad - 503212
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>
                  EMPLOYEE SALARY LEDGER & PASSBOOK RECORDS
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Generated: {formatDate(getTodayDateString())}
                </div>
              </div>
            </div>

            {/* Employee Particulars Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                fontSize: '12px'
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>Staff Name:</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{employee.name}</div>
                <div style={{ color: '#475569' }}>{employee.designation}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Phone Number:</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{employee.phone}</div>
                <div style={{ color: '#64748b' }}>Joined: {formatDate(employee.joining_date)}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Monthly Base Salary:</span>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#0284c7' }}>
                  {formatCurrency(employee.base_salary)}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{employee.bank_details || 'Paid in Cash'}</div>
              </div>
            </div>

            {/* Lifetime Summary KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                marginBottom: '24px'
              }}
            >
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Total Months on Record</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                  {historyData.totalMonths || 1} Months
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Gross Total Salary</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                  {formatCurrency(historyData.totalBaseSalary)}
                </div>
              </div>
              <div style={{ background: '#fffbeb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700 }}>Total Advances Given</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#b45309', marginTop: '2px' }}>
                  {formatCurrency(historyData.totalAdvance)}
                </div>
              </div>
              <div style={{ background: '#ecfdf5', padding: '10px 12px', borderRadius: '8px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>Total Disbursed (Paid)</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                  {formatCurrency(historyData.totalPaid)}
                </div>
              </div>
              <div style={{ background: historyData.totalPending > 0 ? '#fef2f2' : '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: historyData.totalPending > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: historyData.totalPending > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>Current Pending Due</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: historyData.totalPending > 0 ? '#dc2626' : '#059669', marginTop: '2px' }}>
                  {historyData.totalPending > 0 ? formatCurrency(historyData.totalPending) : '₹0 (All Settled)'}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* VIEW 1: 📜 ALL-TIME CONTINUOUS PASSBOOK (DATE-BY-DATE TRANSACTION RECORDS) */}
            {/* ========================================================================= */}
            {viewMode === 'passbook' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} color="#0284c7" />
                    Transaction Passbook Entries ({allTimePassbookEntries.length} Recorded Transactions)
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Showing newest transactions first
                  </span>
                </div>

                <div style={{ overflowX: 'auto', border: '1.5px solid #cbd5e1', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#0f172a', color: '#ffffff', fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ textAlign: 'left', padding: '10px 12px', width: '120px' }}>Date</th>
                        <th style={{ textAlign: 'left', padding: '10px 12px', width: '100px' }}>Month</th>
                        <th style={{ textAlign: 'left', padding: '10px 12px', width: '140px' }}>Record Type</th>
                        <th style={{ textAlign: 'left', padding: '10px 12px' }}>Particulars / Mode / Reference / Note</th>
                        <th style={{ textAlign: 'right', padding: '10px 12px', width: '120px', color: '#fde68a' }}>Advance / Deduct (₹)</th>
                        <th style={{ textAlign: 'right', padding: '10px 12px', width: '130px', color: '#86efac' }}>Amount Credited (Paid ₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTimePassbookEntries.length > 0 ? (
                        allTimePassbookEntries.map((tx, idx) => (
                          <tr
                            key={tx.id || idx}
                            style={{
                              borderBottom: '1px solid #e2e8f0',
                              background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                            }}
                          >
                            {/* BOLD DATE */}
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '12.5px' }}>
                                {tx.date ? formatDate(tx.date) : '—'}
                              </div>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                {tx.date}
                              </div>
                            </td>

                            {/* Month Badge */}
                            <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                                {formatMonthLabel(tx.month_year)}
                              </span>
                            </td>

                            {/* Record Type Badge */}
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: tx.type === 'ADVANCE'
                                    ? '#fef3c7'
                                    : tx.type === 'DUE_CLEARANCE'
                                    ? '#e0e7ff'
                                    : '#ecfdf5',
                                  color: tx.type === 'ADVANCE'
                                    ? '#92400e'
                                    : tx.type === 'DUE_CLEARANCE'
                                    ? '#3730a3'
                                    : '#065f46'
                                }}
                              >
                                {tx.type === 'ADVANCE' && <TrendingDown size={11} />}
                                {tx.type === 'SALARY_CREDITED' && <CheckCircle2 size={11} />}
                                {tx.type === 'DUE_CLEARANCE' && <TrendingUp size={11} />}
                                {tx.typeLabel}
                              </span>
                            </td>

                            {/* Particulars & Reference */}
                            <td style={{ padding: '10px 12px', color: '#334155' }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>
                                {tx.payment_mode ? `Disbursed via ${tx.payment_mode}` : 'Cash'}
                                {tx.reference_no ? ` • Ref: ${tx.reference_no}` : ''}
                              </div>
                              {tx.notes && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  {tx.notes}
                                </div>
                              )}
                            </td>

                            {/* Advance Column */}
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#b45309' }}>
                              {tx.debit > 0 ? `- ${formatCurrency(tx.debit)}` : '—'}
                            </td>

                            {/* Credited Column */}
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, color: '#059669', fontSize: '13px' }}>
                              {tx.credit > 0 ? `+ ${formatCurrency(tx.credit)}` : '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            No transaction records found for this employee.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 900, fontSize: '12.5px' }}>
                        <td colSpan={4} style={{ padding: '10px 12px', color: '#0f172a' }}>
                          ALL-TIME TOTALS:
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#b45309' }}>
                          - {formatCurrency(historyData.totalAdvance)}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#059669', fontSize: '13.5px' }}>
                          + {formatCurrency(historyData.totalPaid)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: 📅 MONTH-BY-MONTH RECORD BREAKDOWN (CLASSIFIED MONTHLY BOXES)     */}
            {/* ========================================================================= */}
            {viewMode === 'monthly' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={16} color="#0284c7" />
                    Month-Wise Classification ({monthlyGroups.length} Months Tracked)
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Each month records its own base, advances, and payments separately
                  </span>
                </div>

                {monthlyGroups.map((settlement) => {
                  const monthYear = settlement.month_year;
                  const baseSalary = Number(settlement.base_salary) || Number(employee.base_salary) || 0;
                  const advanceAmount = Number(settlement.advance_amount) || 0;
                  const paidAmount = Number(settlement.paid_amount) || 0;
                  const netPayable = Math.max(0, baseSalary - advanceAmount);
                  const pendingDue = Number(settlement.pending_balance) >= 0
                    ? Number(settlement.pending_balance)
                    : Math.max(0, netPayable - paidAmount);

                  const isPaid = pendingDue === 0 && (paidAmount > 0 || (advanceAmount >= baseSalary && advanceAmount > 0));
                  const isPartial = paidAmount > 0 && pendingDue > 0;
                  const isPending = !isPaid && !isPartial;

                  const transactions = getMonthTransactions(settlement);

                  return (
                    <div
                      key={monthYear}
                      style={{
                        background: '#ffffff',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        marginBottom: '20px',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Month Header Banner */}
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '12px 16px',
                          borderBottom: '1.5px solid #cbd5e1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Calendar size={18} color="#0284c7" />
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            {formatMonthLabel(monthYear)}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              background: isPaid ? '#ecfdf5' : isPartial ? '#fffbeb' : '#fef2f2',
                              color: isPaid ? '#059669' : isPartial ? '#b45309' : '#dc2626',
                              border: isPaid ? '1px solid #a7f3d0' : isPartial ? '1px solid #fde68a' : '1px solid #fecaca'
                            }}
                          >
                            {isPaid ? 'Fully Settled' : isPartial ? `Due ${formatCurrency(pendingDue)}` : 'Pending Disbursement'}
                          </span>
                        </div>

                        {/* Month Summary Stats */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ color: '#64748b' }}>Base: </span>
                            <strong style={{ color: '#0f172a' }}>{formatCurrency(baseSalary)}</strong>
                          </div>
                          {advanceAmount > 0 && (
                            <div>
                              <span style={{ color: '#64748b' }}>Advance: </span>
                              <strong style={{ color: '#d97706' }}>- {formatCurrency(advanceAmount)}</strong>
                            </div>
                          )}
                          <div>
                            <span style={{ color: '#64748b' }}>Disbursed: </span>
                            <strong style={{ color: '#059669' }}>{formatCurrency(paidAmount)}</strong>
                          </div>
                          <div>
                            <span style={{ color: '#64748b' }}>Balance Due: </span>
                            <strong style={{ color: pendingDue > 0 ? '#dc2626' : '#059669' }}>
                              {pendingDue > 0 ? formatCurrency(pendingDue) : '₹0'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Month's Date-by-Date Transaction Entries */}
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>
                              <th style={{ textAlign: 'left', padding: '8px 14px', width: '130px' }}>Date</th>
                              <th style={{ textAlign: 'left', padding: '8px 14px', width: '140px' }}>Type</th>
                              <th style={{ textAlign: 'left', padding: '8px 14px' }}>Particulars / Mode / Note</th>
                              <th style={{ textAlign: 'right', padding: '8px 14px', width: '120px', color: '#b45309' }}>Advance Deduct</th>
                              <th style={{ textAlign: 'right', padding: '8px 14px', width: '130px', color: '#059669' }}>Credited (Paid)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.length > 0 ? (
                              transactions.map((tx) => (
                                <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}>
                                    <div style={{ fontWeight: 800, color: '#0f172a' }}>
                                      {tx.date ? formatDate(tx.date) : '—'}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{tx.date}</div>
                                  </td>
                                  <td style={{ padding: '8px 14px' }}>
                                    <span style={{
                                      fontSize: '10.5px',
                                      fontWeight: 700,
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: tx.type === 'ADVANCE' ? '#fef3c7' : '#ecfdf5',
                                      color: tx.type === 'ADVANCE' ? '#92400e' : '#065f46'
                                    }}>
                                      {tx.typeLabel}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 14px', color: '#334155' }}>
                                    <span style={{ fontWeight: 600 }}>{tx.payment_mode}</span>
                                    {tx.reference_no ? ` • Ref: ${tx.reference_no}` : ''}
                                    {tx.notes && <span style={{ color: '#64748b' }}> — {tx.notes}</span>}
                                  </td>
                                  <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 800, color: '#b45309' }}>
                                    {tx.debit > 0 ? `- ${formatCurrency(tx.debit)}` : '—'}
                                  </td>
                                  <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 900, color: '#059669' }}>
                                    {tx.credit > 0 ? `+ ${formatCurrency(tx.credit)}` : '—'}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                                  No transaction records recorded yet for {formatMonthLabel(monthYear)}. Base salary {formatCurrency(baseSalary)} is pending settlement.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Official Signatures Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px dashed #cbd5e1',
                fontSize: '11px'
              }}
            >
              <div style={{ textAlign: 'center', width: '200px' }}>
                <div style={{ height: '35px' }}></div>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#334155' }}>
                  Employee Signature / Thumb
                </div>
              </div>

              <div style={{ textAlign: 'center', width: '220px' }}>
                <div style={{ height: '35px' }}></div>
                <div style={{ borderTop: '1px solid #0f172a', paddingTop: '4px', fontWeight: 700, color: '#0f172a' }}>
                  Authorized Signatory<br />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>For Anusha Enterprises</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Pinned Modal Footer */}
        <div
          className="modal-footer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '14px 22px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            flexShrink: 0
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Ledger Records
          </button>
        </div>
      </div>
    </div>
  );
};
