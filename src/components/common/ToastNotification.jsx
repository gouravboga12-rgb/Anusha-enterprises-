import React, { useEffect, useState } from 'react';
import { CheckCircle2, X, FileText, ArrowRight, ShoppingCart, Truck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const ToastNotification = ({ notification, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!notification) return;

    const duration = notification.duration || 7000;
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - step;
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [notification, isPaused, onClose]);

  if (!notification) return null;

  const isSale = notification.type === 'sale';
  const isPurchase = notification.type === 'purchase';
  const title = notification.title || (isSale ? 'Sale Recorded Successfully' : isPurchase ? 'Purchase Recorded Successfully' : 'Action Completed');
  const partyName = notification.partyName || (isSale ? 'Customer' : 'Supplier');
  const amountStr = typeof notification.amount === 'number' ? formatCurrency(notification.amount) : (notification.amount || '₹0');
  const quantityText = notification.quantityText || `${notification.totalQuantity || 0} units`;
  const refNumber = notification.refNumber;

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        width: '92%',
        maxWidth: '560px',
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0 20px 35px -5px rgba(15, 23, 42, 0.2), 0 10px 15px -5px rgba(15, 23, 42, 0.1)',
        border: '1.5px solid #10b981',
        overflow: 'hidden',
        animation: 'slideDownNotification 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <style>{`
        @keyframes slideDownNotification {
          from {
            opacity: 0;
            transform: translate(-50%, -24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>

      {/* Main Toast Content */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          {/* Icon + Title block */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#059669'
              }}
            >
              {isSale ? <ShoppingCart size={22} /> : isPurchase ? <Truck size={22} /> : <CheckCircle2 size={22} />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    backgroundColor: isSale ? '#dcfce7' : '#e0f2fe',
                    color: isSale ? '#15803d' : '#0369a1'
                  }}
                >
                  {isSale ? 'Sale Confirmed' : isPurchase ? 'Purchase Confirmed' : 'Success'}
                </span>
                {refNumber && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                    {refNumber}
                  </span>
                )}
              </div>

              <h4
                style={{
                  margin: '4px 0 0',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.3
                }}
              >
                {title}
              </h4>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close notification"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s, background-color 0.15s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#0f172a';
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Clear Summary Badges / Metrics Box */}
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Party details */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
              {isSale ? 'Customer' : isPurchase ? 'Supplier' : 'Party'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
              {partyName}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
              {isSale ? 'Quantity Sold' : isPurchase ? 'Quantity Purchased' : 'Quantity'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0369a1' }}>
              {quantityText}
            </div>
          </div>

          {/* Amount */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
              Total Amount
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>
              {amountStr}
            </div>
          </div>
        </div>

        {/* Optional Action Buttons (e.g. View Invoice) */}
        {notification.onAction && (
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px'
            }}
          >
            <button
              onClick={() => {
                notification.onAction();
                onClose();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#0369a1';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#0284c7';
              }}
            >
              <FileText size={15} />
              {notification.actionLabel || 'View Invoice'}
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Animated Remaining Time Progress Bar */}
      <div
        style={{
          height: '4px',
          width: '100%',
          backgroundColor: '#e2e8f0',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: isSale ? '#10b981' : isPurchase ? '#0284c7' : '#10b981',
            transition: 'width 0.05s linear'
          }}
        />
      </div>
    </div>
  );
};
