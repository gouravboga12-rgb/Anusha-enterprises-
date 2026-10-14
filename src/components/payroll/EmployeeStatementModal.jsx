import React, { useState, useMemo } from 'react';
import { X, Download, Printer, Calendar, User, Phone, Briefcase, CreditCard, IndianRupee, CheckCircle2, Clock, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate, getTodayDateString } from '../../utils/formatters';
import { exportElementToPdf } from '../../utils/pdfExport';

export const EmployeeStatementModal = ({
  isOpen,
  onClose,
  employee,
  dataService,
  currentMonthYear
}) => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear || getTodayDateString().slice(0, 7));
  const [viewMode, setViewMode] = useState('month-slip'); // 'month-slip' | 'all-history'
  const [isExporting, setIsExporting] = useState(false);

  // Fetch full salary history
  const historyData = useMemo(() => {
    if (!employee || !dataService?.getEmployeeSalaryHistory) {
      return { history: [], totalMonths: 0, totalBaseSalary: 0, totalAdvance: 0, totalPaid: 0, totalPending: 0 };
    }
    return dataService.getEmployeeSalaryHistory(employee.id);
  }, [employee, dataService, isOpen]);

  // Current selected month settlement
  const currentSettlement = useMemo(() => {
    if (!historyData.history) return null;
    return historyData.history.find((s) => s.month_year === selectedMonth) || null;
  }, [historyData, selectedMonth]);

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

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const cleanName = (employee.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = viewMode === 'month-slip'
        ? `Salary_Slip_${cleanName}_${selectedMonth}.pdf`
        : `Salary_Statement_All_Months_${cleanName}.pdf`;

      await exportElementToPdf({
        element: '#salary-statement-printable',
        filename: filename,
        title: `Salary Statement - ${employee.name}`
      });
    } catch (err) {
      console.warn('PDF Export warning:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '820px', width: '96%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '16px'
            }}>
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {employee.name} — Salary Statement & History
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                <span>{employee.designation}</span>
                <span>•</span>
                <span>{employee.phone}</span>
                <span>•</span>
                <span style={{ fontWeight: 600, color: '#0284c7' }}>Base: {formatCurrency(employee.base_salary)}/mo</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* View Mode Controls Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 20px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className={`payroll-tab-btn ${viewMode === 'month-slip' ? 'active' : ''}`}
              onClick={() => setViewMode('month-slip')}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              <FileText size={14} />
              Monthly Pay Slip
            </button>
            <button
              className={`payroll-tab-btn ${viewMode === 'all-history' ? 'active' : ''}`}
              onClick={() => setViewMode('all-history')}
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              <Calendar size={14} />
              All-Time Career Statement ({historyData.totalMonths} Months)
            </button>
          </div>

          {viewMode === 'month-slip' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Select Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
              />
            </div>
          )}

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
              {isExporting ? 'Generating PDF...' : 'Download PDF Slip'}
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Content */}
        <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#f1f5f9' }}>
          
          {/* Lifetime Earnings Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Total Months</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{historyData.totalMonths}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Gross Base Salary</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{formatCurrency(historyData.totalBaseSalary)}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>Total Advances Taken</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>{formatCurrency(historyData.totalAdvance)}</div>
            </div>
            <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>Total Paid Till Date</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669', marginTop: '2px' }}>{formatCurrency(historyData.totalPaid)}</div>
            </div>
            {historyData.totalPending > 0 && (
              <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700 }}>Pending Balance Due</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>{formatCurrency(historyData.totalPending)}</div>
              </div>
            )}
          </div>

          {/* Printable Statement Sheet Container */}
          <div id="salary-statement-printable" className="salary-statement-paper" style={{ maxWidth: '750px', margin: '0 auto', background: '#ffffff' }}>
            
            {/* Slip Header with Brand Logo & Info */}
            <div className="slip-header-brand" style={{ borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '6px' }}>
                <img
                  src="/logo.png"
                  alt="Anusha Enterprises"
                  style={{ height: '40px', width: '40px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  ANUSHA ENTERPRISES
                </h2>
              </div>
              <p style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                Wholesale Dealers in Commercial Explosives & Blasting Accessories
              </p>
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                H.No 3-84, Main Road, Nandipet, Nizamabad Dist, Telangana - 503212 | Contact: 9640912521
              </p>
              <div style={{
                marginTop: '12px',
                display: 'inline-block',
                background: '#0f172a',
                color: '#ffffff',
                padding: '4px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                {viewMode === 'month-slip' ? 'EMPLOYEE MONTHLY SALARY SLIP' : 'EMPLOYEE SALARY LEDGER & STATEMENT'}
              </div>
            </div>

            {/* Employee Particulars Grid */}
            <div className="slip-info-grid" style={{ marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Employee Name:</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{employee.name}</div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>Designation: <strong>{employee.designation}</strong></div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>Contact Phone: {employee.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Statement Period:</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0284c7' }}>
                  {viewMode === 'month-slip' ? formatMonthLabel(selectedMonth) : 'All Months Till Date'}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  Bank/UPI: {employee.bank_details || 'Paid by Cash'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Generated on: {formatDate(getTodayDateString())}
                </div>
              </div>
            </div>

            {/* View 1: Specific Month Salary Slip */}
            {viewMode === 'month-slip' && (
              currentSettlement ? (
                <div>
                  <table className="slip-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Salary Component & Breakdown</th>
                        <th style={{ textAlign: 'right', width: '150px' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>Basic Monthly Salary</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Gross fixed salary for {formatMonthLabel(selectedMonth)}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(currentSettlement.base_salary)}</td>
                      </tr>

                      {Number(currentSettlement.advance_amount) > 0 && (
                        <tr style={{ background: '#fffbeb' }}>
                          <td>
                            <strong style={{ color: '#b45309' }}>Less: Advance Deducted</strong>
                            <div style={{ fontSize: '11px', color: '#b45309' }}>
                              Given on: {currentSettlement.advance_date ? formatDate(currentSettlement.advance_date) : 'Earlier this month'}
                              {currentSettlement.advance_notes ? ` (${currentSettlement.advance_notes})` : ''}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#b45309' }}>
                            - {formatCurrency(currentSettlement.advance_amount)}
                          </td>
                        </tr>
                      )}

                      <tr style={{ background: '#eff6ff', borderTop: '2px solid #93c5fd' }}>
                        <td>
                          <strong style={{ color: '#1e40af' }}>Net Salary Payable</strong>
                          <div style={{ fontSize: '11px', color: '#1e40af' }}>After advance deductions</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#1e40af' }}>
                          {formatCurrency(currentSettlement.net_payable)}
                        </td>
                      </tr>

                      <tr style={{ background: '#ecfdf5' }}>
                        <td>
                          <strong style={{ color: '#047857' }}>Net Amount Disbursed</strong>
                          <div style={{ fontSize: '11px', color: '#047857' }}>
                            Disbursed via {currentSettlement.payment_mode} on {formatDate(currentSettlement.payment_date)}
                            {currentSettlement.reference_no ? ` (Ref: ${currentSettlement.reference_no})` : ''}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                          {formatCurrency(currentSettlement.paid_amount)}
                        </td>
                      </tr>

                      {Number(currentSettlement.pending_balance) > 0 && (
                        <tr style={{ background: '#fef2f2' }}>
                          <td>
                            <strong style={{ color: '#b91c1c' }}>Remaining Balance Due</strong>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#b91c1c' }}>
                            {formatCurrency(currentSettlement.pending_balance)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}>
                    <div>
                      <strong>Status: </strong>
                      <span style={{
                        color: currentSettlement.status === 'Paid' ? '#059669' : '#dc2626',
                        fontWeight: 800
                      }}>
                        {currentSettlement.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <strong>Recorded By: </strong>{currentSettlement.recorded_by || 'Admin'}
                    </div>
                  </div>

                  {currentSettlement.notes && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                      Remarks: {currentSettlement.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <Clock size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#475569' }}>
                    No Settlement Record Found for {formatMonthLabel(selectedMonth)}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Standard base salary for this staff is ₹{formatCurrency(employee.base_salary)} per month. You can record advance or settle their salary from the main payroll screen.
                  </p>
                </div>
              )
            )}

            {/* View 2: All Months Ledger History */}
            {viewMode === 'all-history' && (
              <div>
                {historyData.history.length > 0 ? (
                  <table className="slip-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Month</th>
                        <th style={{ textAlign: 'right' }}>Base</th>
                        <th style={{ textAlign: 'right' }}>Advance</th>
                        <th style={{ textAlign: 'right' }}>Paid Amount</th>
                        <th style={{ textAlign: 'center' }}>Date & Mode</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.history.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 700 }}>{formatMonthLabel(s.month_year)}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(s.base_salary)}</td>
                          <td style={{ textAlign: 'right', color: Number(s.advance_amount) > 0 ? '#d97706' : '#94a3b8' }}>
                            {Number(s.advance_amount) > 0 ? formatCurrency(s.advance_amount) : '—'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                            {formatCurrency(s.paid_amount)}
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '11px' }}>
                            <div>{formatDate(s.payment_date)}</div>
                            <span style={{ color: '#64748b' }}>{s.payment_mode}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '10px',
                              background: s.status === 'Paid' ? '#ecfdf5' : '#fef2f2',
                              color: s.status === 'Paid' ? '#059669' : '#dc2626'
                            }}>
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                        <td>TOTALS</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(historyData.totalBaseSalary)}</td>
                        <td style={{ textAlign: 'right', color: '#d97706' }}>{formatCurrency(historyData.totalAdvance)}</td>
                        <td style={{ textAlign: 'right', color: '#16a34a' }}>{formatCurrency(historyData.totalPaid)}</td>
                        <td colSpan={2} style={{ textAlign: 'center', color: '#64748b' }}>
                          {historyData.totalMonths} months processed
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                    <Clock size={32} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#475569' }}>No Historical Records Yet</h4>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Settlement records for this employee will appear here once saved.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Official Signatures Row */}
            <div className="slip-signatures">
              <div className="signature-block">
                <div className="signature-line">
                  Employee Signature / Fingerprint
                </div>
              </div>
              <div className="signature-block">
                <div className="signature-line">
                  Authorized Signatory<br />
                  <span style={{ fontSize: '10px', color: '#64748b' }}>For Anusha Enterprises</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
