import React from 'react';
import { Menu, Search, PlusCircle, Receipt, MapPin, Calendar, Database, Cloud } from 'lucide-react';
import { AiVoiceWidget } from './AiVoiceWidget';
import { formatDate, getTodayDateString } from '../../utils/formatters';

export const Navbar = ({ onToggleSidebar, onOpenNewSale, onOpenPayment, isLiveConnected, isLoading }) => {
  const todayStr = formatDate(getTodayDateString());

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            color: '#0f172a'
          }}
          title="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        {/* Brand Logo & Name in Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/logo.png"
            alt="Anusha Enterprises"
            style={{
              height: '32px',
              width: 'auto',
              objectFit: 'contain',
              borderRadius: '4px'
            }}
          />
          <span style={{
            fontWeight: 800,
            fontSize: '14px',
            color: '#0f172a',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ANUSHA <span style={{ color: '#0284c7', fontWeight: 600 }}>ENTERPRISES</span>
          </span>
        </div>

        <div className="header-trust-badges" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge-trust" style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: '#e0f2fe',
            color: '#0284c7'
          }}>
            12 Yrs
          </span>
          <div className="header-location" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
            <MapPin size={13} color="#0284c7" />
            <span>Nandipet</span>
          </div>
        </div>

        {/* Live Supabase Connection Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 600,
          background: isLiveConnected ? '#ecfdf5' : '#fef3c7',
          color: isLiveConnected ? '#059669' : '#d97706',
          border: `1px solid ${isLiveConnected ? '#a7f3d0' : '#fde68a'}`
        }}
        title={isLiveConnected ? 'Connected to live Supabase PostgreSQL database' : 'Connecting to Supabase (run supabase_schema.sql in dashboard)'}
        >
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isLiveConnected ? '#10b981' : '#f59e0b',
            boxShadow: isLiveConnected ? '0 0 6px #10b981' : 'none'
          }} />
          <Cloud size={12} />
          <span>{isLiveConnected ? 'Supabase Live' : 'Cloud Sync Ready'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="header-date-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Calendar size={14} color="#0284c7" />
          <span style={{ fontWeight: 600 }}>{todayStr}</span>
        </div>

        <AiVoiceWidget />

        <div className="header-quick-btns" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenNewSale}
            title="Create new customer sale bill"
          >
            <PlusCircle size={15} />
            <span className="btn-text">New Sale</span>
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenPayment}
            title="Record customer or supplier installment payment"
          >
            <Receipt size={15} color="#0284c7" />
            <span className="btn-text">Payment</span>
          </button>
        </div>
      </div>
    </header>
  );
};
