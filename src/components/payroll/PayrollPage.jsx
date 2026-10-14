import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote, PlusCircle, Search, Filter, Calendar, ChevronLeft, ChevronRight,
  UserCheck, AlertCircle, CheckCircle2, Clock, IndianRupee, ArrowDownRight,
  FileText, Download, Edit2, Trash2, ShieldCheck, MoreVertical, Phone, CreditCard
} from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { EmployeeFormModal } from './EmployeeFormModal';
import { SalarySettlementModal } from './SalarySettlementModal';
import { EmployeeStatementModal } from './EmployeeStatementModal';
import { PayDueModal } from './PayDueModal';
import { AdvanceModal } from './AdvanceModal';
import './payroll.css';

export const PayrollPage = ({ dataService, currentUser }) => {
  const [, setTick] = useState(0);

  // Month navigation: format "YYYY-MM" (e.g. "2026-10")
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    return getTodayDateString().slice(0, 7);
  });

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'paid' | 'partial'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementTargetEmployee, setSettlementTargetEmployee] = useState(null);

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementTargetEmployee, setStatementTargetEmployee] = useState(null);

  const [isPayDueModalOpen, setIsPayDueModalOpen] = useState(false);
  const [payDueTarget, setPayDueTarget] = useState(null);

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceTargetEmployee, setAdvanceTargetEmployee] = useState(null);

  // Subscribe to live data changes
  useEffect(() => {
    if (!dataService) return;
    return dataService.subscribe(() => setTick((t) => t + 1));
  }, [dataService]);


  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setSelectedMonthYear(d.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonthYear.split('-').map(Number);
    const d = new Date(year, month, 1);
    setSelectedMonthYear(d.toISOString().slice(0, 7));
  };

  const handleCurrentMonth = () => {
    setSelectedMonthYear(getTodayDateString().slice(0, 7));
  };

  const formatMonthTitle = (my) => {
    if (!my) return '';
    try {
      const [year, month] = my.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    } catch {
      return my;
    }
  };

  // Fetch employees and settlements for selected month
  const employees = dataService?.getEmployees ? dataService.getEmployees('active') : [];
  const settlements = dataService?.getSalarySettlements ? dataService.getSalarySettlements({ month_year: selectedMonthYear }) : [];

  // Map settlements by employee_id for O(1) lookup
  const settlementsMap = useMemo(() => {
    const map = new Map();
    settlements.forEach((s) => map.set(s.employee_id, s));
    return map;
  }, [settlements]);

  // Combined records for each employee in this month
  const employeeRecords = useMemo(() => {
    return employees.map((emp) => {
      const settlement = settlementsMap.get(emp.id) || null;
      const baseSalary = settlement ? Number(settlement.base_salary) : Number(emp.base_salary) || 0;
      const advanceAmount = settlement ? Number(settlement.advance_amount) : 0;
      const paidAmount = settlement ? Number(settlement.paid_amount) : 0;
      const netPayable = Math.max(0, baseSalary - advanceAmount);
      const pendingBalance = settlement ? Number(settlement.pending_balance) : baseSalary;

      let status = 'Pending';
      if (settlement) {
        status = settlement.status || 'Pending';
      }

      return {
        employee: emp,
        settlement,
        baseSalary,
        advanceAmount,
        paidAmount,
        netPayable,
        pendingBalance,
        status, // 'Paid' | 'Partially Paid' | 'Pending'
        advanceDate: settlement?.advance_date || null,
        advanceNotes: settlement?.advance_notes || '',
        paymentDate: settlement?.payment_date || null,
        paymentMode: settlement?.payment_mode || emp.payment_mode_preference || 'Cash',
        referenceNo: settlement?.reference_no || ''
      };
    });
  }, [employees, settlementsMap]);

  // KPI Calculations
  const summaryKpis = useMemo(() => {
    let totalBase = 0;
    let totalAdv = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let partialCount = 0;

    employeeRecords.forEach((r) => {
      if (r.employee.status !== 'inactive') {
        totalBase += r.baseSalary;
        totalAdv += r.advanceAmount;
        totalPaid += r.paidAmount;
        totalPending += r.pendingBalance;

        if (r.status === 'Paid') {
          paidCount++;
        } else if (r.status === 'Partially Paid') {
          partialCount++;
        } else {
          pendingCount++;
        }
      }
    });

    return {
      totalBase,
      totalAdv,
      totalPaid,
      totalPending,
      paidCount,
      pendingCount,
      partialCount,
      totalActive: employees.filter((e) => e.status !== 'inactive').length
    };
  }, [employeeRecords, employees]);

  // Filtered employee records
  const filteredRecords = useMemo(() => {
    return employeeRecords.filter((r) => {
      // 1. Status Filter
      if (statusFilter === 'pending') {
        if (r.status !== 'Pending') return false;
      } else if (statusFilter === 'paid') {
        if (r.status !== 'Paid') return false;
      } else if (statusFilter === 'partial') {
        if (r.status !== 'Partially Paid' && r.advanceAmount === 0) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const empName = (r.employee.name || '').toLowerCase();
        const empPhone = (r.employee.phone || '').toLowerCase();
        const empDesig = (r.employee.designation || '').toLowerCase();
        return empName.includes(q) || empPhone.includes(q) || empDesig.includes(q);
      }

      return true;
    });
  }, [employeeRecords, statusFilter, searchQuery]);

  // Action Handlers
  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenSettlement = (emp) => {
    setSettlementTargetEmployee(emp);
    setIsSettlementModalOpen(true);
  };

  const handleOpenStatement = (emp) => {
    setStatementTargetEmployee(emp);
    setIsStatementModalOpen(true);
  };

  const handleOpenPayDue = (emp, settlement) => {
    setPayDueTarget({
      employee: emp,
      settlement: settlement || {
        employee_id: emp.id,
        base_salary: emp.base_salary,
        pending_balance: emp.base_salary,
        net_payable: emp.base_salary,
        paid_amount: 0,
        advance_amount: 0
      }
    });
    setIsPayDueModalOpen(true);
  };

  const handleOpenAdvance = (emp) => {
    setAdvanceTargetEmployee(emp);
    setIsAdvanceModalOpen(true);
  };

  const handleDeleteEmployee = async (emp) => {
    if (window.confirm(`Are you sure you want to permanently delete staff member "${emp.name}"? This will delete their profile and all associated salary records.`)) {
      try {
        await dataService.deleteEmployee(emp.id, currentUser);
        setTick((t) => t + 1);
      } catch (err) {
        alert(err?.message || 'Failed to delete employee profile.');
      }
    }
  };

  return (
    <div className="payroll-container">
      {/* Page Header */}
      <div className="payroll-header">
        <div className="payroll-title-section">
          <h1>
            <Banknote size={28} color="#0284c7" />
            Employee Salaries & Payroll
          </h1>
          <p>
            Monthly salary settlements, advance tracking, and verified staff statement slips
          </p>
        </div>

        {/* Month Selector & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="payroll-month-selector">
            <button
              className="month-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="current-month-display">
              {formatMonthTitle(selectedMonthYear)}
            </div>
            <button
              className="month-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleCurrentMonth}
            className="btn btn-secondary"
            style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 600 }}
          >
            This Month
          </button>


          <button
            onClick={handleOpenAddEmployee}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '13px' }}
          >
            <PlusCircle size={16} />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="payroll-kpi-grid">
        <div className="payroll-kpi-card">
          <div className="payroll-kpi-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>
            <IndianRupee size={22} />
          </div>
          <div className="payroll-kpi-info">
            <div className="payroll-kpi-label">Total Monthly Payroll</div>
            <div className="payroll-kpi-value">{formatCurrency(summaryKpis.totalBase)}</div>
            <div className="payroll-kpi-subtext">Active Staff ({summaryKpis.totalActive} Members)</div>
          </div>
        </div>

        <div className="payroll-kpi-card">
          <div className="payroll-kpi-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <ArrowDownRight size={22} />
          </div>
          <div className="payroll-kpi-info">
            <div className="payroll-kpi-label">Advances Deducted</div>
            <div className="payroll-kpi-value" style={{ color: '#d97706' }}>{formatCurrency(summaryKpis.totalAdv)}</div>
            <div className="payroll-kpi-subtext">Adjusted this month</div>
          </div>
        </div>

        <div className="payroll-kpi-card">
          <div className="payroll-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="payroll-kpi-info">
            <div className="payroll-kpi-label">Total Salary Disbursed</div>
            <div className="payroll-kpi-value" style={{ color: '#059669' }}>{formatCurrency(summaryKpis.totalPaid)}</div>
            <div className="payroll-kpi-subtext">{summaryKpis.paidCount} Fully Settled</div>
          </div>
        </div>

        <div className="payroll-kpi-card">
          <div className="payroll-kpi-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <Clock size={22} />
          </div>
          <div className="payroll-kpi-info">
            <div className="payroll-kpi-label">Pending / Unpaid Balance</div>
            <div className="payroll-kpi-value" style={{ color: '#dc2626' }}>{formatCurrency(summaryKpis.totalPending)}</div>
            <div className="payroll-kpi-subtext">
              <strong style={{ color: '#dc2626' }}>{summaryKpis.pendingCount} Staff</strong> not yet paid
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="payroll-filter-bar">
        <div className="payroll-tabs">
          <button
            className={`payroll-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Staff
            <span className="payroll-tab-badge">{employeeRecords.length}</span>
          </button>

          <button
            className={`payroll-tab-btn ${statusFilter === 'pending' ? 'active-pending' : ''}`}
            onClick={() => setStatusFilter('pending')}
            title="Filter to staff who have not yet received salary for this month"
          >
            🚨 Unpaid / Pending
            <span className="payroll-tab-badge" style={{ background: statusFilter === 'pending' ? 'rgba(255,255,255,0.3)' : '#fee2e2', color: statusFilter === 'pending' ? '#fff' : '#b91c1c' }}>
              {summaryKpis.pendingCount}
            </span>
          </button>

          <button
            className={`payroll-tab-btn ${statusFilter === 'paid' ? 'active-paid' : ''}`}
            onClick={() => setStatusFilter('paid')}
          >
            ✅ Fully Paid
            <span className="payroll-tab-badge" style={{ background: statusFilter === 'paid' ? 'rgba(255,255,255,0.3)' : '#dcfce7', color: statusFilter === 'paid' ? '#fff' : '#15803d' }}>
              {summaryKpis.paidCount}
            </span>
          </button>

          <button
            className={`payroll-tab-btn ${statusFilter === 'partial' ? 'active' : ''}`}
            onClick={() => setStatusFilter('partial')}
          >
            ⏳ Advance Taken / Partial
            <span className="payroll-tab-badge">{summaryKpis.partialCount}</span>
          </button>
        </div>

        <div className="payroll-search-box">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by name, phone or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content: Desktop Table View */}
      <div className="payroll-table-container">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee / Role</th>
              <th style={{ textAlign: 'right' }}>Base Salary</th>
              <th style={{ textAlign: 'right' }}>Advance Taken</th>
              <th style={{ textAlign: 'right' }}>Net Payable</th>
              <th style={{ textAlign: 'right' }}>Amount Paid</th>
              <th style={{ textAlign: 'center' }}>Settlement Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((r) => {
                const emp = r.employee;
                const isPaid = r.status === 'Paid';
                const isPartial = r.status === 'Partially Paid';
                const isPending = r.status === 'Pending';

                return (
                  <tr key={emp.id} style={{ opacity: emp.status === 'inactive' ? 0.6 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isPaid ? '#ecfdf5' : isPartial ? '#fffbeb' : '#fef2f2',
                          color: isPaid ? '#059669' : isPartial ? '#d97706' : '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px'
                        }}>
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {emp.designation} • {emp.phone}
                          </div>
                          {emp.bank_details && (
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                              {emp.bank_details}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {formatCurrency(r.baseSalary)}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {r.advanceAmount > 0 ? (
                        <div>
                          <span style={{ fontWeight: 700, color: '#d97706' }}>
                            - {formatCurrency(r.advanceAmount)}
                          </span>
                          {r.advanceDate && (
                            <div style={{ fontSize: '10px', color: '#92400e' }}>
                              {formatDate(r.advanceDate)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                      {formatCurrency(r.netPayable)}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {r.paidAmount > 0 ? (
                        <div>
                          <span style={{ fontWeight: 800, color: '#059669' }}>
                            {formatCurrency(r.paidAmount)}
                          </span>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            {r.paymentMode} {r.paymentDate ? `(${formatDate(r.paymentDate)})` : ''}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>₹0</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-chip ${isPaid ? 'paid' : isPartial ? 'partial' : 'pending'}`}>
                        {isPaid && <CheckCircle2 size={12} />}
                        {isPartial && <Clock size={12} />}
                        {isPending && <AlertCircle size={12} />}
                        {isPaid ? 'Paid' : isPartial ? `Due ₹${formatCurrency(r.pendingBalance)}` : 'Pending'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {r.pendingBalance > 0 && (
                          <button
                            onClick={() => handleOpenPayDue(emp, r.settlement)}
                            className="btn btn-primary"
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#059669',
                              borderColor: '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Pay remaining due balance"
                          >
                            <IndianRupee size={12} />
                            Pay Due ({formatCurrency(r.pendingBalance)})
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenAdvance(emp)}
                          className="btn btn-secondary"
                          style={{
                            padding: '5px 9px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#d97706',
                            borderColor: '#fde68a',
                            background: '#fffbeb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Give Advance (For this month or next month)"
                        >
                          <PlusCircle size={12} />
                          + Advance
                        </button>

                        <button
                          onClick={() => handleOpenSettlement(emp)}
                          className={isPaid ? 'btn btn-secondary' : 'btn btn-primary'}
                          style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700 }}
                          title={isPaid ? 'Edit Salary / Settlement' : 'Settle Salary'}
                        >
                          {isPaid ? 'Edit Salary' : 'Settle Salary'}
                        </button>

                        <button
                          onClick={() => handleOpenStatement(emp)}
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="View Ledger Statement & Download PDF Slip"
                        >
                          <FileText size={13} />
                          Ledger
                        </button>

                        <button
                          onClick={() => handleOpenEditEmployee(emp)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                          title="Edit Staff Member"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteEmployee(emp)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                          title="Delete / Deactivate Staff Member"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <Clock size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>
                    No Staff Records Found
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    {searchQuery ? 'Try clearing your search query' : 'Add your first staff member to get started'}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile & Tablet Card Layout */}
      <div className="payroll-mobile-cards">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((r) => {
            const emp = r.employee;
            const isPaid = r.status === 'Paid';
            const isPartial = r.status === 'Partially Paid';
            const isPending = r.status === 'Pending';

            return (
              <div key={emp.id} className="payroll-emp-card">
                <div className="payroll-emp-card-header">
                  <div className="payroll-emp-details">
                    <h3>{emp.name}</h3>
                    <p>{emp.designation} • {emp.phone}</p>
                    {emp.bank_details && <p style={{ fontSize: '11px', color: '#94a3b8' }}>{emp.bank_details}</p>}
                  </div>

                  <span className={`status-chip ${isPaid ? 'paid' : isPartial ? 'partial' : 'pending'}`}>
                    {isPaid ? 'Paid' : isPartial ? `Due ₹${formatCurrency(r.pendingBalance)}` : 'Pending'}
                  </span>
                </div>

                <div className="payroll-emp-breakdown-grid">
                  <div className="payroll-breakdown-item">
                    <span>Base Monthly Salary</span>
                    <span>{formatCurrency(r.baseSalary)}</span>
                  </div>

                  <div className="payroll-breakdown-item">
                    <span>Advance Taken</span>
                    <span style={{ color: r.advanceAmount > 0 ? '#d97706' : '#64748b' }}>
                      {r.advanceAmount > 0 ? `- ${formatCurrency(r.advanceAmount)}` : '₹0'}
                    </span>
                  </div>

                  <div className="payroll-breakdown-item">
                    <span>Net Payable Due</span>
                    <span style={{ color: '#0284c7' }}>{formatCurrency(r.netPayable)}</span>
                  </div>

                  <div className="payroll-breakdown-item">
                    <span>Disbursed</span>
                    <span style={{ color: '#059669' }}>{formatCurrency(r.paidAmount)}</span>
                  </div>
                </div>

                <div className="payroll-actions-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {r.pendingBalance > 0 && (
                    <button
                      onClick={() => handleOpenPayDue(emp, r.settlement)}
                      className="btn btn-primary"
                      style={{
                        flex: '1 1 calc(50% - 4px)',
                        padding: '8px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: '#059669',
                        borderColor: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px'
                      }}
                    >
                      <IndianRupee size={13} />
                      Pay Due ({formatCurrency(r.pendingBalance)})
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenAdvance(emp)}
                    className="btn btn-secondary"
                    style={{
                      flex: '1 1 calc(50% - 4px)',
                      padding: '8px 10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#d97706',
                      borderColor: '#fde68a',
                      background: '#fffbeb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <PlusCircle size={13} />
                    + Advance
                  </button>

                  <button
                    onClick={() => handleOpenSettlement(emp)}
                    className={isPaid ? 'btn btn-secondary' : 'btn btn-primary'}
                    style={{ flex: '1 1 calc(50% - 4px)', padding: '8px 10px', fontSize: '12px', fontWeight: 700 }}
                  >
                    {isPaid ? 'Edit Salary' : 'Settle Salary'}
                  </button>

                  <button
                    onClick={() => handleOpenStatement(emp)}
                    className="btn btn-secondary"
                    style={{ flex: '1 1 calc(30% - 4px)', padding: '8px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <FileText size={14} />
                    Ledger
                  </button>

                  <button
                    onClick={() => handleOpenEditEmployee(emp)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 10px', fontSize: '12px' }}
                    title="Edit Employee"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    onClick={() => handleDeleteEmployee(emp)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 10px', fontSize: '12px', color: '#ef4444' }}
                    title="Delete Staff Member"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '36px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Clock size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, color: '#334155' }}>No Staff Records Found</div>
          </div>
        )}
      </div>

      {/* Employee Add/Edit Modal */}
      {isEmployeeModalOpen && (
        <EmployeeFormModal
          isOpen={isEmployeeModalOpen}
          onClose={() => setIsEmployeeModalOpen(false)}
          employee={editingEmployee}
          onSave={async (empData) => {
            await dataService.saveEmployee(empData, currentUser);
          }}
        />
      )}

      {/* Salary Settlement Modal */}
      {isSettlementModalOpen && settlementTargetEmployee && (
        <SalarySettlementModal
          isOpen={isSettlementModalOpen}
          onClose={() => {
            setIsSettlementModalOpen(false);
            setSettlementTargetEmployee(null);
          }}
          employee={settlementTargetEmployee}
          monthYear={selectedMonthYear}
          existingSettlement={settlementsMap.get(settlementTargetEmployee.id) || null}
          onSave={async (settlementData) => {
            await dataService.saveSalarySettlement(settlementData, currentUser);
          }}
          onDelete={async (settlementId) => {
            await dataService.deleteSalarySettlement(settlementId, currentUser);
          }}
        />
      )}

      {/* Employee Statement & Slip Modal */}
      {isStatementModalOpen && statementTargetEmployee && (
        <EmployeeStatementModal
          isOpen={isStatementModalOpen}
          onClose={() => {
            setIsStatementModalOpen(false);
            setStatementTargetEmployee(null);
          }}
          employee={statementTargetEmployee}
          dataService={dataService}
          currentMonthYear={selectedMonthYear}
        />
      )}

      {/* Pay Due Modal */}
      {isPayDueModalOpen && payDueTarget && (
        <PayDueModal
          isOpen={isPayDueModalOpen}
          onClose={() => {
            setIsPayDueModalOpen(false);
            setPayDueTarget(null);
          }}
          employee={payDueTarget.employee}
          settlement={payDueTarget.settlement}
          monthYear={selectedMonthYear}
          onSave={async (paymentData) => {
            await dataService.recordDuePayment(
              payDueTarget.employee.id,
              selectedMonthYear,
              paymentData,
              currentUser
            );
          }}
        />
      )}

      {/* Advance Modal */}
      {isAdvanceModalOpen && advanceTargetEmployee && (
        <AdvanceModal
          isOpen={isAdvanceModalOpen}
          onClose={() => {
            setIsAdvanceModalOpen(false);
            setAdvanceTargetEmployee(null);
          }}
          employee={advanceTargetEmployee}
          currentMonthYear={selectedMonthYear}
          onSave={async (advanceData, targetMonth) => {
            await dataService.recordAdvance(
              advanceTargetEmployee.id,
              targetMonth,
              advanceData,
              currentUser
            );
          }}
        />
      )}
    </div>
  );
};
