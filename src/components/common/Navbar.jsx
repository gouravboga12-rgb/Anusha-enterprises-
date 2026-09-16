import React from 'react';
import { Menu, Search, PlusCircle, Receipt, MapPin, Calendar, Database, Cloud, LogOut } from 'lucide-react';
import { AiVoiceWidget } from './AiVoiceWidget';
import { formatDate, getTodayDateString } from '../../utils/formatters';

export const Navbar = ({ onToggleSidebar, onOpenNewSale, onOpenPayment, isLiveConnected, isLoading, currentUser, onLogout }) => {
  const todayStr = formatDate(getTodayDateString());

  return (
    <header className="top-navbar">
      <div className="top-nav-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            color: '#0f172a',
            flexShrink: 0
          }}
          title="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        {/* Brand Logo & Name in Header */}
        <div className="nav-brand-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <img
            src="/logo.png"
            alt="Anusha Enterprises"
            style={{
              height: '30px',
              width: 'auto',
              objectFit: 'contain',
              borderRadius: '4px',
              flexShrink: 0
            }}
          />
          <span className="nav-brand-name" style={{
            fontWeight: 800,
            fontSize: '14px',
            color: '#0f172a',
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}>
            ANUSHA <span className="nav-brand-suffix" style={{ color: '#0284c7', fontWeight: 600 }}>ENTERPRISES</span>
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
        <div className="header-cloud-badge" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 600,
          background: isLiveConnected ? '#ecfdf5' : '#fef3c7',
          color: isLiveConnected ? '#059669' : '#d97706',
          border: `1px solid ${isLiveConnected ? '#a7f3d0' : '#fde68a'}`,
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}
        title={isLiveConnected ? 'Connected to live Supabase PostgreSQL database' : 'Connecting to Supabase (run supabase_schema.sql in dashboard)'}
        >
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isLiveConnected ? '#10b981' : '#f59e0b',
            boxShadow: isLiveConnected ? '0 0 6px #10b981' : 'none',
            flexShrink: 0
          }} />
          <Cloud size={12} style={{ flexShrink: 0 }} />
          <span className="cloud-badge-text">{isLiveConnected ? 'Supabase Live' : 'Cloud Sync'}</span>
        </div>
      </div>

      <div className="top-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
          {currentUser && (
            <button
              className="btn btn-secondary btn-sm header-logout-btn"
              onClick={onLogout}
              style={{
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '4px 8px'
              }}
              title={`Logged in as ${currentUser.name || currentUser.email}. Click to Logout`}
            >
              <LogOut size={14} />
              <span className="btn-text">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
