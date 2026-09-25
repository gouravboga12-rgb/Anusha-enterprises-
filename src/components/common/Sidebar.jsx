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
  X,
  LogOut,
  Wallet,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { dataService } from '../../api/dataService';

export const Sidebar = ({ activeTab, onSelectTab, isOpen, onClose, currentUser, onLogout }) => {
  const products = dataService.getProducts();
  const lowStockCount = products.filter((p) => p.current_stock <= (p.min_stock_alert || 20)).length;

  const isOwner = !currentUser || 
    currentUser.role === 'owner' || 
    currentUser.role === 'Owner / Administrator' || 
    currentUser.role === 'full_access' || 
    currentUser.email === 'shivat9640@gmail.com';

  const navItems = [
    { id: 'dashboard', label: 'Home / Day Summary', icon: LayoutDashboard },
    { id: 'customers', label: 'Customers & Ledger', icon: Users },
    { id: 'sales', label: 'Sales & Invoices', icon: ShoppingCart },
    { id: 'suppliers', label: 'Suppliers & Ledger', icon: Truck },
    { id: 'purchases', label: 'Purchases & Inward', icon: ShoppingBag },
    { id: 'products', label: 'Products & Stock', icon: Boxes, badge: lowStockCount ? `${lowStockCount} Low` : null, alert: lowStockCount > 0 },
    { id: 'daybook', label: 'Day Book & Reports', icon: CalendarCheck }
  ];

  const operationsItems = [
    { id: 'wallet', label: 'Wallet & Expenses', icon: Wallet },
    { id: 'activity-log', label: 'Activity Log', icon: Activity }
  ];

  const adminItems = isOwner ? [
    { id: 'users', label: 'Staff & Roles', icon: ShieldCheck }
  ] : [];

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

        {/* Scrollable Navigation Area */}
        <div className="sidebar-nav-container" style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {/* Section 1: Main Business Modules */}
          <div className="nav-group" style={{ marginBottom: '16px' }}>
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

          {/* Section 2: Operations */}
          <div className="nav-group" style={{ marginBottom: '16px' }}>
            <div className="nav-label">Operations</div>
            {operationsItems.map((item) => {
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
                </div>
              );
            })}
          </div>

          {/* Section 3: Administration (Owner Only) */}
          {adminItems.length > 0 && (
            <div className="nav-group" style={{ marginBottom: '16px' }}>
              <div className="nav-label">Administration</div>
              {adminItems.map((item) => {
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: currentUser ? '14px 16px' : '0', borderTop: currentUser ? '1px solid #e2e8f0' : 'none', background: '#f8fafc' }}>
          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0',
              padding: '8px 10px',
              background: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                  flexShrink: 0
                }}>
                  {currentUser.name ? currentUser.name[0] : 'S'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {currentUser.name || 'Shiva'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {currentUser.email || currentUser.phone}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  borderRadius: '6px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                title="Logout"
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
