import React, { useState, useMemo } from 'react';
import {
  X, Download, Printer, Calendar, User, Phone, Briefcase, CreditCard,
  IndianRupee, CheckCircle2, Clock, FileText, ArrowRight, ArrowDownRight,
  TrendingDown, TrendingUp, AlertCircle
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
  // Default to 'ledger' view mode as requested
  const [viewMode, setViewMode] = useState('ledger'); // 'ledger' | 'month-slip'
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('all'); // 'all' or 'YYYY-MM'
  const [slipMonth, setSlipMonth] = useState(currentMonthYear || getTodayDateString().slice(0, 7));
  const [isExporting, setIsExporting] = useState(false);

  // Fetch full salary history from dataService
  const historyData = useMemo(() => {
    if (!employee || !dataService?.getEmployeeSalaryHistory) {
      return { history: [], totalMonths: 0, totalBaseSalary: 0, totalAdvance: 0, totalPaid: 0, totalPending: 0 };
    }
    return dataService.getEmployeeSalaryHistory(employee.id);
  }, [employee, dataService, isOpen]);

  // Ensure current month is present in month groups even if not yet settled
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

    // Filter by selectedMonthFilter if not 'all'
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

  // Helper to extract granular date-by-date transactions for each monthly block
  const getMonthTransactions = (settlement) => {
    const transactions = [];

    // 1. Advance transactions
    if (settlement.advance_history && Array.isArray(settlement.advance_history) && settlement.advance_history.length > 0) {
      settlement.advance_history.forEach((adv, idx) => {
        transactions.push({
          id: adv.id || `adv-${idx}-${adv.date}`,
          date: adv.date || settlement.advance_date || settlement.created_at?.slice(0, 10),
          type: 'ADVANCE',
          typeLabel: 'Advance Taken',
          payment_mode: adv.payment_mode || 'Cash',
          reference_no: '',
          notes: adv.notes || 'Interim salary advance',
          debit: Number(adv.amount) || 0,
          credit: 0
        });
      });
    } else if (Number(settlement.advance_amount) > 0) {
      transactions.push({
        id: `adv-single-${settlement.id}`,
        date: settlement.advance_date || settlement.created_at?.slice(0, 10),
        type: 'ADVANCE',
        typeLabel: 'Advance Taken',
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
        const isDuePayment = pay.notes?.toLowerCase().includes('due') || pay.id?.startsWith('pay-');
        transactions.push({
          id: pay.id || `pay-${idx}-${pay.date}`,
          date: pay.date || settlement.payment_date || settlement.created_at?.slice(0, 10),
          type: isDuePayment ? 'DUE_CLEARANCE' : 'SALARY_CREDITED',
          typeLabel: isDuePayment ? 'Due Balance Cleared' : 'Salary Disbursed',
          payment_mode: pay.payment_mode || settlement.payment_mode || 'Cash',
          reference_no: pay.reference_no || settlement.reference_no || '',
          notes: pay.notes || 'Salary disbursement',
          debit: 0,
          credit: Number(pay.amount) || 0
        });
      });
    } else if (Number(settlement.paid_amount) > 0) {
      transactions.push({
        id: `pay-single-${settlement.id}`,
        date: settlement.payment_date || settlement.created_at?.slice(0, 10),
        type: 'SALARY_CREDITED',
        typeLabel: 'Salary Disbursed',
        payment_mode: settlement.payment_mode || 'Cash',
        reference_no: settlement.reference_no || '',
        notes: settlement.notes || 'Monthly salary payment',
        debit: 0,
        credit: Number(settlement.paid_amount) || 0
      });
    }

    // Sort transactions chronologically (oldest to newest within that month)
    transactions.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return transactions;
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const cleanName = (employee.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = viewMode === 'ledger'
        ? `Employee_Salary_Ledger_${cleanName}_${getTodayDateString()}.pdf`
        : `Salary_Slip_${cleanName}_${slipMonth}.pdf`;

      await exportElementToPdf({
        element: '#employee-ledger-printable',
        filename: filename,
        title: `Employee Salary Ledger - ${employee.name}`
      });
    } catch (err) {
      console.warn('PDF Export fallback to print:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Find settlement for slip view
  const currentSlipSettlement = (historyData.history || []).find((s) => s.month_year === slipMonth);

  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        style={{
          maxWidth: '920px',
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
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '18px',
                border: '1.5px solid #bfdbfe'
              }}
            >
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {employee.name}
                </h2>
                <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                  Employee Ledger
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                <span>{employee.designation}</span>
                <span>•</span>
                <span>{employee.phone}</span>
                <span>•</span>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>
                  Fixed Base Salary: {formatCurrency(employee.base_salary)}/mo
                </span>
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
          {/* View Mode Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={`payroll-tab-btn ${viewMode === 'ledger' ? 'active' : ''}`}
              onClick={() => setViewMode('ledger')}
              style={{
                fontSize: '12.5px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: viewMode === 'ledger' ? 800 : 600
              }}
            >
              <Calendar size={15} />
              Month-wise Transaction Ledger
            </button>
            <button
              className={`payroll-tab-btn ${viewMode === 'month-slip' ? 'active' : ''}`}
              onClick={() => setViewMode('month-slip')}
              style={{
                fontSize: '12.5px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: viewMode === 'month-slip' ? 800 : 600
              }}
            >
              <FileText size={15} />
              Pay Slip View
            </button>
          </div>

          {/* Month Filter Selector */}
          {viewMode === 'ledger' ? (
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
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Select Slip Month:</span>
              <input
                type="month"
                value={slipMonth}
                onChange={(e) => setSlipMonth(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              />
            </div>
          )}

          {/* Print & PDF Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
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

        {/* Scrollable Modal Content */}
        <div
          className="modal-body"
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            flex: 1,
            background: '#f1f5f9'
          }}
        >
          {/* Printable Document Container */}
          <div
            id="employee-ledger-printable"
            style={{
              maxWidth: '850px',
              margin: '0 auto',
              background: '#ffffff',
              borderRadius: '10px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            {/* Printable Brand Header */}
            <div
              style={{
                borderBottom: '2px solid #0f172a',
                paddingBottom: '16px',
                marginBottom: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
                <img
                  src="/logo.png"
                  alt="Anusha Enterprises"
                  style={{ height: '36px', width: '36px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>
                  ANUSHA ENTERPRISES
                </h2>
              </div>
              <p style={{ fontSize: '11.5px', color: '#475569', fontWeight: 600 }}>
                Wholesale Dealers in Commercial Explosives & Accessories • Nandipet, Nizamabad Dist - 503212
              </p>
              <div
                style={{
                  marginTop: '10px',
                  display: 'inline-block',
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '4px 14px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase'
                }}
              >
                {viewMode === 'ledger' ? 'STAFF SALARY LEDGER & TRANSACTION PASSBOOK' : 'EMPLOYEE SALARY SLIP'}
              </div>
            </div>

            {/* Employee Particulars Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                fontSize: '12px'
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>Employee Name:</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{employee.name}</div>
                <div style={{ color: '#475569', marginTop: '2px' }}>Role: <strong>{employee.designation}</strong></div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Contact Phone:</span>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{employee.phone}</div>
                <div style={{ color: '#475569', marginTop: '2px' }}>Payment Pref: <strong>{employee.payment_mode_preference || 'Cash'}</strong></div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Base Monthly Salary:</span>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#0284c7' }}>
                  {formatCurrency(employee.base_salary)}
                </div>
                {employee.bank_details && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {employee.bank_details}
                  </div>
                )}
              </div>
            </div>

            {/* Lifetime Summary KPI Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                marginBottom: '24px'
              }}
            >
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Total Months</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                  {historyData.totalMonths || 1}
                </div>
              </div>
              <div style={{ background: '#fffbeb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700 }}>Total Advances Given</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#b45309', marginTop: '2px' }}>
                  {formatCurrency(historyData.totalAdvance)}
                </div>
              </div>
              <div style={{ background: '#ecfdf5', padding: '10px 12px', borderRadius: '8px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>Total Credited / Paid</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                  {formatCurrency(historyData.totalPaid)}
                </div>
              </div>
              <div style={{ background: historyData.totalPending > 0 ? '#fef2f2' : '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: historyData.totalPending > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: historyData.totalPending > 0 ? '#dc2626' : '#64748b', fontWeight: 700 }}>Current Due Balance</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: historyData.totalPending > 0 ? '#dc2626' : '#059669', marginTop: '2px' }}>
                  {historyData.totalPending > 0 ? formatCurrency(historyData.totalPending) : '₹0 (All Settled)'}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* VIEW 1: MONTH-WISE CLASSIFIED TRANSACTION LEDGER (REQUESTED USER DESIGN) */}
            {/* ========================================================================= */}
            {viewMode === 'ledger' && (
              <div>
                {monthlyGroups.length > 0 ? (
                  monthlyGroups.map((settlement) => {
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
                          marginBottom: '24px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}
                      >
                        {/* Monthly Classification Header Box */}
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
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: isPaid ? '#ecfdf5' : isPartial ? '#fffbeb' : '#fef2f2',
                                color: isPaid ? '#059669' : isPartial ? '#b45309' : '#dc2626',
                                border: isPaid ? '1px solid #a7f3d0' : isPartial ? '1px solid #fde68a' : '1px solid #fecaca'
                              }}
                            >
                              {isPaid ? 'Fully Settled' : isPartial ? `Due ${formatCurrency(pendingDue)}` : 'Pending Disbursement'}
                            </span>
                          </div>

                          {/* Month Summary Numbers */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '14px',
                              fontSize: '12px',
                              flexWrap: 'wrap'
                            }}
                          >
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
                              <span style={{ color: '#64748b' }}>Credited (Paid): </span>
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

                        {/* Date-by-Date Transaction Passbook Table for this Month */}
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>
                                <th style={{ textAlign: 'left', padding: '9px 14px', width: '130px' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '9px 14px', width: '150px' }}>Type</th>
                                <th style={{ textAlign: 'left', padding: '9px 14px' }}>Particulars / Mode / Note</th>
                                <th style={{ textAlign: 'right', padding: '9px 14px', width: '130px', color: '#b45309' }}>Advance Deducted</th>
                                <th style={{ textAlign: 'right', padding: '9px 14px', width: '140px', color: '#059669' }}>Credited to Staff</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                  <tr
                                    key={tx.id}
                                    style={{
                                      borderBottom: '1px solid #f1f5f9',
                                      background: tx.type === 'ADVANCE' ? '#fffdfa' : '#ffffff'
                                    }}
                                  >
                                    {/* BOLD DATE AS REQUESTED */}
                                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>
                                        {tx.date ? formatDate(tx.date) : '—'}
                                      </div>
                                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                        {tx.date}
                                      </div>
                                    </td>

                                    {/* Transaction Badge */}
                                    <td style={{ padding: '10px 14px' }}>
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          fontWeight: 700,
                                          padding: '2px 8px',
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
                                        {tx.type === 'ADVANCE' && <TrendingDown size={12} />}
                                        {tx.type === 'SALARY_CREDITED' && <CheckCircle2 size={12} />}
                                        {tx.type === 'DUE_CLEARANCE' && <TrendingUp size={12} />}
                                        {tx.typeLabel}
                                      </span>
                                    </td>

                                    {/* Particulars & Reference */}
                                    <td style={{ padding: '10px 14px', color: '#334155' }}>
                                      <div style={{ fontWeight: 600 }}>
                                        {tx.payment_mode ? `Mode: ${tx.payment_mode}` : 'Cash'}
                                        {tx.reference_no ? ` • Ref: ${tx.reference_no}` : ''}
                                      </div>
                                      {tx.notes && (
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                          {tx.notes}
                                        </div>
                                      )}
                                    </td>

                                    {/* Advance Column */}
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#b45309' }}>
                                      {tx.debit > 0 ? `- ${formatCurrency(tx.debit)}` : '—'}
                                    </td>

                                    {/* Credited Column */}
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#059669', fontSize: '13px' }}>
                                      {tx.credit > 0 ? `+ ${formatCurrency(tx.credit)}` : '—'}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan={5}
                                    style={{
                                      padding: '24px 14px',
                                      textAlign: 'center',
                                      color: '#64748b',
                                      fontStyle: 'italic',
                                      background: '#fafafa'
                                    }}
                                  >
                                    <Clock size={20} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
                                    No payment or advance transactions recorded yet for {formatMonthLabel(monthYear)}.
                                    <div style={{ fontSize: '11px', marginTop: '2px', color: '#94a3b8' }}>
                                      Base Monthly Salary: {formatCurrency(baseSalary)} is pending settlement.
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>

                            {/* Monthly Totals Row */}
                            {transactions.length > 0 && (
                              <tfoot>
                                <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #cbd5e1', fontWeight: 800, fontSize: '12px' }}>
                                  <td colSpan={3} style={{ padding: '8px 14px', color: '#475569' }}>
                                    Total for {formatMonthLabel(monthYear)}:
                                  </td>
                                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#b45309' }}>
                                    {advanceAmount > 0 ? `- ${formatCurrency(advanceAmount)}` : '₹0'}
                                  </td>
                                  <td style={{ padding: '8px 14px', textAlign: 'right', color: '#059669', fontSize: '13px' }}>
                                    {formatCurrency(paidAmount)}
                                  </td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '36px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <Clock size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#475569' }}>No Historical Records Yet</h4>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Settlement and advance records for this employee will appear here once saved.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW 2: FORMAL MONTHLY PAY SLIP (FOR SPECIFIC SIGNED PRINT) */}
            {/* ========================================================================= */}
            {viewMode === 'month-slip' && (
              currentSlipSettlement ? (
                <div>
                  <table className="slip-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ textAlign: 'left', padding: '10px 14px', border: '1px solid #cbd5e1' }}>Salary Component & Particulars</th>
                        <th style={{ textAlign: 'right', width: '160px', padding: '10px 14px', border: '1px solid #cbd5e1' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>
                          <strong>Basic Monthly Salary</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Gross fixed salary for {formatMonthLabel(slipMonth)}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, padding: '10px 14px', border: '1px solid #cbd5e1' }}>
                          {formatCurrency(currentSlipSettlement.base_salary)}
                        </td>
                      </tr>

                      {Number(currentSlipSettlement.advance_amount) > 0 && (
                        <tr style={{ background: '#fffbeb' }}>
                          <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>
                            <strong style={{ color: '#b45309' }}>Less: Advance Deducted</strong>
                            <div style={{ fontSize: '11px', color: '#b45309' }}>
                              Date: <strong>{currentSlipSettlement.advance_date ? formatDate(currentSlipSettlement.advance_date) : 'Earlier this month'}</strong>
                              {currentSlipSettlement.advance_notes ? ` (${currentSlipSettlement.advance_notes})` : ''}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#b45309', padding: '10px 14px', border: '1px solid #cbd5e1' }}>
                            - {formatCurrency(currentSlipSettlement.advance_amount)}
                          </td>
                        </tr>
                      )}

                      <tr style={{ background: '#eff6ff' }}>
                        <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>
                          <strong style={{ color: '#1e40af' }}>Net Salary Payable</strong>
                          <div style={{ fontSize: '11px', color: '#1e40af' }}>After advance deduction</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#1e40af', padding: '10px 14px', border: '1px solid #cbd5e1' }}>
                          {formatCurrency(currentSlipSettlement.net_payable)}
                        </td>
                      </tr>

                      <tr style={{ background: '#ecfdf5' }}>
                        <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>
                          <strong style={{ color: '#047857' }}>Net Disbursed / Paid</strong>
                          <div style={{ fontSize: '11px', color: '#047857' }}>
                            Disbursed via {currentSlipSettlement.payment_mode} on <strong>{formatDate(currentSlipSettlement.payment_date)}</strong>
                            {currentSlipSettlement.reference_no ? ` (Ref: ${currentSlipSettlement.reference_no})` : ''}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 900, color: '#047857', padding: '10px 14px', border: '1px solid #cbd5e1' }}>
                          {formatCurrency(currentSlipSettlement.paid_amount)}
                        </td>
                      </tr>

                      {Number(currentSlipSettlement.pending_balance) > 0 && (
                        <tr style={{ background: '#fef2f2' }}>
                          <td style={{ padding: '10px 14px', border: '1px solid #cbd5e1' }}>
                            <strong style={{ color: '#b91c1c' }}>Remaining Balance Due</strong>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 900, color: '#b91c1c', padding: '10px 14px', border: '1px solid #cbd5e1' }}>
                            {formatCurrency(currentSlipSettlement.pending_balance)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <strong>Status: </strong>
                      <span style={{ color: currentSlipSettlement.status === 'Paid' ? '#059669' : '#dc2626', fontWeight: 800 }}>
                        {currentSlipSettlement.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <strong>Recorded By: </strong>{currentSlipSettlement.recorded_by || 'Admin'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <Clock size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#475569' }}>
                    No Settlement Record Found for {formatMonthLabel(slipMonth)}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Switch to the Transaction Ledger tab to see all monthly history, or settle this month's salary from the main screen.
                  </p>
                </div>
              )
            )}

            {/* Official Signatures Row */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '36px',
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

        {/* Modal Pinned Footer */}
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
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
