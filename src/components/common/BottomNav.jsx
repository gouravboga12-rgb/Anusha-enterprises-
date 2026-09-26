import React from 'react';
import { LayoutDashboard, Users, Truck, Boxes, CalendarCheck } from 'lucide-react';
import { getTodayDateString } from '../../utils/formatters';

export const BottomNav = ({ activeTab, onSelectTab, onToggleSidebar, dataService }) => {
  const dayBook = dataService?.getDayBook ? dataService.getDayBook(getTodayDateString()) : { events: [] };
  const todayEventCount = dayBook?.events?.length || 0;

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
        <div style={{ position: 'relative' }}>
          <CalendarCheck size={20} />
          {todayEventCount > 0 && (
            <span className="bottom-nav-badge">{todayEventCount}</span>
          )}
        </div>
        <span>Day Book</span>
      </button>
    </nav>
  );
};

