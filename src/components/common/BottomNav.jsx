import React from 'react';
import { LayoutDashboard, Users, Truck, Boxes, CalendarCheck } from 'lucide-react';

export const BottomNav = ({ activeTab, onSelectTab, onToggleSidebar, dataService }) => {
  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onSelectTab('dashboard')}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'customers' ? 'active' : ''}`}
        onClick={() => onSelectTab('customers')}
      >
        <Users size={20} />
        <span>Customers</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'suppliers' ? 'active' : ''}`}
        onClick={() => onSelectTab('suppliers')}
      >
        <Truck size={20} />
        <span>Suppliers</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'products' ? 'active' : ''}`}
        onClick={() => onSelectTab('products')}
      >
        <Boxes size={20} />
        <span>Products</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'daybook' ? 'active' : ''}`}
        onClick={() => onSelectTab('daybook')}
      >
        <CalendarCheck size={20} />
        <span>Day Book</span>
      </button>
    </nav>
  );
};


