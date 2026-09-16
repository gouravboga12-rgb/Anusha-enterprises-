import React from 'react';
import {
  LayoutDashboard,
  Users,
  Truck,
  Boxes,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  BookOpen,
  BookMarked,
  CalendarCheck,
  TrendingUp,
  RotateCcw,
  Sliders,
  X
} from 'lucide-react';
import { dataService } from '../../api/dataService';

export const Sidebar = ({ activeTab, onSelectTab, isOpen, onClose }) => {
  const products = dataService.getProducts();
  const lowStockCount = products.filter((p) => p.current_stock <= (p.min_stock_alert || 20)).length;

  const navItems = [
    { id: 'dashboard', label: 'Home / Day Summary', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers & Khata', icon: Users },
    { id: 'suppliers', label: 'Suppliers & Khata', icon: Truck },
    { id: 'products', label: 'Products & Stock', icon: Boxes, badge: lowStockCount ? `${lowStockCount} Low` : null, alert: lowStockCount > 0 },
    { id: 'daybook', label: 'Day Book & Reports', icon: CalendarCheck }
  ];

  const handleResetData = () => {
    if (window.confirm('Reset all CRM and Ledger records back to default demo state?')) {
      dataService.resetToDemo();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="brand-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
          <img
            src="/logo.png"
            alt="Anusha Enterprises"
            style={{
              height: '42px',
              width: '42px',
              objectFit: 'contain',
              borderRadius: '8px',
              background: '#ffffff',
              padding: '2px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          />
          <div className="brand-details">
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>Anusha Enterprises</h2>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Digital Business Ledger</p>
          </div>
          {isOpen && (
            <button
              onClick={onClose}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px'
              }}
              title="Close Menu"
            >
              <X size={22} />
            </button>
          )}
        </div>

        <div className="nav-section">
          <div className="nav-label">Main Business Modules</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab(item.id);
                  if (window.innerWidth <= 1024) onClose();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge ${item.alert ? 'alert' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', fontSize: '12px', justifyContent: 'flex-start', color: '#64748b' }}
            onClick={handleResetData}
            title="Restore original sample records"
          >
            <RotateCcw size={14} />
            <span>Reset Sample Records</span>
          </button>
          <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px', textAlign: 'center' }}>
            Nandipet, Nizamabad • Est. 2014
          </p>
        </div>
      </aside>
    </>
  );
};
