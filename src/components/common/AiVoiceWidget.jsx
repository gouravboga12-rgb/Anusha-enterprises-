import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Volume2, VolumeX, ArrowRight, Send, Search, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency, getTodayDateString, formatDate } from '../../utils/formatters';
import { dataService } from '../../api/dataService';

export const AiVoiceWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [customQuestion, setCustomQuestion] = useState('');
  const [customAnswer, setCustomAnswer] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [, setTick] = useState(0);

  // Subscribe to dataService updates so AI summary is always 100% live and accurate
  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsub;
  }, []);

  // Cancel speech when closing
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const todayStr = getTodayDateString();
  const dayBook = dataService.getDayBook(todayStr);
  const profitReport = dataService.getProfitReport();
  const products = dataService.getProducts();
  const customers = dataService.getCustomers();
  const suppliers = dataService.getSuppliers();
  const sales = dataService.getSales();

  // Dynamic calculations
  const lowStock = products.filter((p) => p.current_stock <= (p.min_stock_alert || 20));

  // Customers who actually owe money right now
  const debtorCustomers = customers
    .map((c) => {
      const custSales = sales.filter((s) => s.customer_id === c.id);
      const totalSold = custSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const totalPaid = custSales.reduce((sum, s) => sum + (s.paid_amount || 0), 0);
      const pending = Math.max(0, totalSold - totalPaid);
      return { ...c, pending };
    })
    .filter((c) => c.pending > 0)
    .sort((a, b) => b.pending - a.pending);

  // Top pending suppliers
  const purchases = dataService.getPurchases();
  const creditorSuppliers = suppliers
    .map((s) => {
      const suppPurchases = purchases.filter((p) => p.supplier_id === s.id);
      const totalPurchased = suppPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);
      const totalPaid = suppPurchases.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
      const pending = Math.max(0, totalPurchased - totalPaid);
      return { ...s, pending };
    })
    .filter((s) => s.pending > 0)
    .sort((a, b) => b.pending - a.pending);

  const buildDebtorText = () => {
    if (debtorCustomers.length === 0) {
      return `Total pending customer receivables are ${formatCurrency(profitReport.pendingCustomerReceivables)}. All customer accounts are fully settled and in good standing!`;
    }
    const topDebtors = debtorCustomers.slice(0, 3).map((c) => `${c.name} (${formatCurrency(c.pending)})`).join(', ');
    return `Total pending customer receivables are ${formatCurrency(profitReport.pendingCustomerReceivables)} across ${debtorCustomers.length} customer(s). Top pending: ${topDebtors}.`;
  };

  const buildLowStockText = () => {
    if (lowStock.length === 0) {
      return "All products currently have adequate stock levels above their safety thresholds. No shortages reported.";
    }
    const itemsList = lowStock.slice(0, 4).map((p) => `${p.name} (${p.current_stock} ${p.unit} left)`).join(', ');
    return `Attention: ${lowStock.length} item(s) are running low: ${itemsList}. Please place purchase orders with suppliers soon.`;
  };

  const buildDaySummaryText = () => {
    const saleCount = dayBook.events.filter((e) => e.type === 'customer_sale').length;
    return `Today's Summary for ${formatDate(todayStr)}: We recorded ${dayBook.events.length} total transaction(s) including ${saleCount} sale(s). Total Sales Value: ${formatCurrency(dayBook.totalSalesAmount)}, Cash & UPI Inflow: ${formatCurrency(dayBook.cashInflow)}, Outflow: ${formatCurrency(dayBook.cashOutflow)}, resulting in Net Cash Movement of ${formatCurrency(dayBook.netCashMovement)}.`;
  };

  const buildProfitText = () => {
    return `Estimated gross profit stands at ${formatCurrency(profitReport.grossProfit)} with an average profit margin of ${profitReport.profitMargin}%, across ${profitReport.totalUnitsSold} units sold catalog-wide. Total business revenue is ${formatCurrency(profitReport.totalRevenue)}.`;
  };

  const buildSupplierText = () => {
    if (creditorSuppliers.length === 0) {
      return `Total pending supplier payables are ${formatCurrency(profitReport.pendingSupplierPayables)}. We have zero pending supplier debts.`;
    }
    const topSupps = creditorSuppliers.slice(0, 3).map((s) => `${s.company_name || s.supplier_name} (${formatCurrency(s.pending)})`).join(', ');
    return `Total pending supplier payables are ${formatCurrency(profitReport.pendingSupplierPayables)}. Top suppliers awaiting payment: ${topSupps}.`;
  };

  const questions = [
    {
      q: "What happened today in my business?",
      getAnswer: buildDaySummaryText
    },
    {
      q: "Who owes us money right now?",
      getAnswer: buildDebtorText
    },
    {
      q: "Are any products low in stock?",
      getAnswer: buildLowStockText
    },
    {
      q: "What is our estimated gross profit and margin?",
      getAnswer: buildProfitText
    },
    {
      q: "Which suppliers do we need to pay?",
      getAnswer: buildSupplierText
    }
  ];

  const currentDisplayAnswer = customAnswer !== null
    ? customAnswer
    : (questions[selectedIdx] ? questions[selectedIdx].getAnswer() : buildDaySummaryText());

  // Voice narration using Web Speech API
  const handleSpeak = (textToSpeak) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => v.lang === 'en-IN' || v.name.includes('India') || v.lang.startsWith('en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleAskCustom = (e) => {
    e.preventDefault();
    const query = (customQuestion || '').trim().toLowerCase();
    if (!query) return;

    if (query.includes('today') || query.includes('day') || query.includes('sale today') || query.includes('inflow') || query.includes('cash')) {
      setCustomAnswer(buildDaySummaryText());
    } else if (query.includes('owe') || query.includes('customer') || query.includes('pending') || query.includes('credit') || query.includes('balance') || query.includes('debt')) {
      setCustomAnswer(buildDebtorText());
    } else if (query.includes('stock') || query.includes('product') || query.includes('inventory') || query.includes('low') || query.includes('shortage')) {
      setCustomAnswer(buildLowStockText());
    } else if (query.includes('profit') || query.includes('margin') || query.includes('revenue') || query.includes('income')) {
      setCustomAnswer(buildProfitText());
    } else if (query.includes('supplier') || query.includes('purchase') || query.includes('pay') || query.includes('payable')) {
      setCustomAnswer(buildSupplierText());
    } else {
      // General overview answer
      setCustomAnswer(
        `Business Snapshot: Today's sales are ${formatCurrency(dayBook.totalSalesAmount)} with ${formatCurrency(dayBook.cashInflow)} in cash/UPI inflow. Outstanding customer balance: ${formatCurrency(profitReport.pendingCustomerReceivables)}. Low stock items: ${lowStock.length}. Gross profit: ${formatCurrency(profitReport.grossProfit)} (${profitReport.profitMargin}% margin).`
      );
    }
  };

  return (
    <>
      <button
        className="ai-widget"
        onClick={() => {
          setIsOpen(true);
          setCustomAnswer(null);
        }}
        title="Click to ask Anusha AI Business Assistant"
      >
        <div className={`soundwave ${isSpeaking ? 'speaking' : ''}`}>
          <span className="soundwave-bar"></span>
          <span className="soundwave-bar"></span>
          <span className="soundwave-bar"></span>
          <span className="soundwave-bar"></span>
        </div>
        <Sparkles size={14} />
        <span>Ask Day Summary</span>
      </button>

      {isOpen && (
        <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <Sparkles size={22} color="#fff" />
                </div>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 800, margin: 0 }}>Anusha AI Day Summary</h3>
                  <p style={{ fontSize: '11.5px', color: '#bae6fd', margin: '2px 0 0' }}>
                    Live business intelligence & voice narration • {formatDate(todayStr)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ padding: '20px', overflowY: 'auto' }}>
              {/* Answer Card */}
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '14px',
                padding: '16px 18px',
                marginBottom: '18px',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: 700, fontSize: '13px' }}>
                    <Sparkles size={15} /> Real-Time Intelligence:
                  </div>

                  <button
                    onClick={() => handleSpeak(currentDisplayAnswer)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isSpeaking ? '#fee2e2' : '#ffffff',
                      color: isSpeaking ? '#b91c1c' : '#0284c7',
                      border: `1px solid ${isSpeaking ? '#fecaca' : '#bae6fd'}`,
                      borderRadius: '9999px',
                      padding: '4px 12px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title={isSpeaking ? 'Click to stop voice playback' : 'Click to listen aloud with voice'}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX size={14} /> Stop Voice
                      </>
                    ) : (
                      <>
                        <Volume2 size={14} /> Read Aloud
                      </>
                    )}
                  </button>
                </div>

                <p style={{ fontSize: '13.5px', color: '#0f172a', lineHeight: '1.65', margin: 0 }}>
                  {currentDisplayAnswer}
                </p>
              </div>

              {/* Ask Question Input */}
              <form onSubmit={handleAskCustom} style={{ marginBottom: '18px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder='Ask AI anything (e.g., "sales today", "who owes money", "stock levels")'
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 40px 9px 36px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '12.5px',
                      outline: 'none',
                      background: '#f8fafc',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      position: 'absolute',
                      right: '6px',
                      background: '#0284c7',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '6px',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Ask AI"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </form>

              {/* Quick Questions List */}
              <h4 style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                Instant Business Inquiries
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {questions.map((item, idx) => {
                  const isSelected = selectedIdx === idx && customAnswer === null;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedIdx(idx);
                        setCustomAnswer(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 14px',
                        background: isSelected ? '#f0fdf4' : '#fff',
                        border: isSelected ? '1px solid #86efac' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#15803d' : '#1e293b',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(34, 197, 94, 0.1)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isSelected ? <CheckCircle2 size={15} color="#16a34a" /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />}
                        <span>{item.q}</span>
                      </div>
                      <ArrowRight size={14} color={isSelected ? '#16a34a' : '#94a3b8'} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                ⚡ Powered by Live PostgreSQL Data Engine
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
