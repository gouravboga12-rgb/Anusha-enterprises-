import React from 'react';
import { LayoutDashboard, Users, ShoppingCart, Truck, Menu } from 'lucide-react';

export const BottomNav = ({ activeTab, onSelectTab, onToggleSidebar }) => {
  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onSelectTab('dashboard')}
      >
        <LayoutDashboard size={19} />
        <span>Home</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
        onClick={() => onSelectTab('customers')}
      >
        <Users size={19} />
        <span>Customers</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'sales' ? 'active' : ''}`}
        onClick={() => onSelectTab('sales')}
      >
        <ShoppingCart size={19} />
        <span>Sales & Bills</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'suppliers' ? 'active' : ''}`}
        onClick={() => onSelectTab('suppliers')}
      >
        <Truck size={19} />
        <span>Suppliers</span>
      </button>

      <button
        className="bottom-nav-item"
        onClick={onToggleSidebar}
        title="Open all modules menu"
      >
        <Menu size={19} />
        <span>More Menu</span>
      </button>
    </nav>
  );
};
