import React, { useState } from 'react';
import { Sparkles, X, Volume2, ArrowRight } from 'lucide-react';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { dataService } from '../../api/dataService';

export const AiVoiceWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const dayBook = dataService.getDayBook(getTodayDateString());
  const profitReport = dataService.getProfitReport();
  const products = dataService.getProducts();
  const lowStock = products.filter((p) => p.current_stock <= (p.min_stock_alert || 20));

  const questions = [
    {
      q: "What happened today in my business?",
      a: `Today we had ${dayBook.events.length} transactions. Total Sales: ${formatCurrency(dayBook.totalSalesAmount)}, Cash Inflow: ${formatCurrency(dayBook.cashInflow)}, and Net Cash Flow: ${formatCurrency(dayBook.netCashMovement)}.`
    },
    {
      q: "Who owes us money right now?",
      a: `Total pending customer receivables are ${formatCurrency(profitReport.pendingCustomerReceivables)}. Sri Sai Electricals has an active pending balance of ₹14,750.`
    },
    {
      q: "Are any products low in stock?",
      a: lowStock.length > 0
        ? `Attention: ${lowStock.length} items are running low: ${lowStock.map((p) => `${p.name} (${p.current_stock} left)`).join(', ')}.`
        : "All products currently have adequate stock levels above safety thresholds."
    },
    {
      q: "What is our estimated gross profit?",
      a: `Estimated gross profit is ${formatCurrency(profitReport.grossProfit)} across ${profitReport.totalUnitsSold} total units sold (${profitReport.profitMargin}% margin).`
    }
  ];

  const [selectedAnswer, setSelectedAnswer] = useState(questions[0].a);

  return (
    <>
      <button
        className="ai-widget"
        onClick={() => setIsOpen(true)}
        title="Click to ask Anusha AI Business Assistant"
      >
        <div className="soundwave">
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
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Volume2 size={20} color="#fff" />
                </div>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '16px' }}>Anusha Digital Assistant</h3>
                  <p style={{ fontSize: '11px', color: '#bae6fd' }}>Instant audio & visual business insights</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '18px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                  <Sparkles size={16} /> Assistant Answer:
                </div>
                <p style={{ fontSize: '14px', color: '#0f172a', lineHeight: '1.6' }}>
                  {selectedAnswer}
                </p>
              </div>

              <h4 style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quick Questions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {questions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAnswer(item.a)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#0f172a',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0284c7'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <span>{item.q}</span>
                    <ArrowRight size={14} color="#0284c7" />
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-footer">
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
