import React, { useState } from 'react';
import {
  Warehouse, Plus, MapPin, Package, AlertTriangle, ChevronRight,
  Edit2, Archive, ArrowLeftRight, History, BarChart2
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { GodownFormModal } from './GodownFormModal';
import { GodownDetail } from './GodownDetail';
import { StockTransferModal } from './StockTransferModal';
import { TransferHistory } from './TransferHistory';

export const GodownList = ({ dataService, currentUser }) => {
  const [activeGodownId, setActiveGodownId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGodown, setEditingGodown] = useState(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isTransferHistoryOpen, setIsTransferHistoryOpen] = useState(false);
  const [activeView, setActiveView] = useState('all'); // 'all' | godown id

  const godowns = dataService.getGodowns(false);
  const allGodowns = dataService.getGodowns(true);
  const products = dataService.getProducts();

  // Overall stats
  const totalStock = products.reduce((acc, p) => acc + (p.current_stock || 0), 0);
  const lowStockCount = products.filter((p) => p.current_stock <= (p.min_stock_alert || 20) && p.current_stock > 0).length;
  const outOfStockCount = products.filter((p) => p.current_stock === 0).length;

  const getGodownStats = (godownId) => {
    const stock = dataService.getGodownStock(godownId);
    const total = stock.reduce((acc, gs) => acc + gs.quantity, 0);
    const productsWithStock = stock.filter((gs) => gs.quantity > 0).length;
    return { total, productsWithStock };
  };

  const handleArchive = (godown) => {
    try {
      dataService.archiveGodown(godown.id, currentUser);
    } catch (e) {
      alert(e.message);
    }
  };

  const canManage = dataService.canDelete(currentUser) || currentUser?.role === 'full_access';

  if (activeGodownId) {
    return (
      <GodownDetail
        godownId={activeGodownId}
        dataService={dataService}
        currentUser={currentUser}
        onBack={() => setActiveGodownId(null)}
        onOpenTransfer={() => setIsTransferOpen(true)}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Warehouse size={22} color="#0284c7" /> Godown Management
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Manage multiple godowns and track stock per location
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsTransferHistoryOpen(true)}
          >
            <History size={15} /> Transfer History
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setIsTransferOpen(true)}
          >
            <ArrowLeftRight size={15} /> Transfer Stock
          </button>
          {canManage && (
            <button
              className="btn btn-primary"
              onClick={() => { setEditingGodown(null); setIsFormOpen(true); }}
            >
              <Plus size={15} /> Create Godown
            </button>
          )}
        </div>
      </div>

      {/* Overall Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Godowns', value: godowns.length, color: '#0284c7', bg: '#eff6ff' },
          { label: 'Total Products', value: products.length, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Total Stock Units', value: totalStock.toLocaleString('en-IN'), color: '#059669', bg: '#f0fdf4' },
          { label: 'Low Stock', value: lowStockCount, color: '#d97706', bg: '#fffbeb' },
          { label: 'Out of Stock', value: outOfStockCount, color: '#dc2626', bg: '#fef2f2' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: '16px', textAlign: 'center', background: stat.bg, border: `1px solid ${stat.color}22` }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveView('all')}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
            background: activeView === 'all' ? '#0284c7' : '#f1f5f9',
            color: activeView === 'all' ? '#fff' : '#475569'
          }}
        >
          <BarChart2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          All Stock
        </button>
        {godowns.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveView(g.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
              background: activeView === g.id ? '#0284c7' : '#f1f5f9',
              color: activeView === g.id ? '#fff' : '#475569'
            }}
          >
            <Warehouse size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {g.name}
          </button>
        ))}
      </div>

      {/* Godown Cards */}
      {activeView === 'all' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {godowns.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1/-1' }}>
              <Warehouse size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
              <h3 style={{ color: '#64748b', fontWeight: 600 }}>No godowns yet</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Create your first godown to start tracking stock per location.</p>
              {canManage && (
                <button className="btn btn-primary" style={{ marginTop: '16px' }}
                  onClick={() => { setEditingGodown(null); setIsFormOpen(true); }}>
                  <Plus size={15} /> Create Godown
                </button>
              )}
            </div>
          ) : (
            godowns.map((g) => {
              const stats = getGodownStats(g.id);
              return (
                <div key={g.id} className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                  onClick={() => setActiveGodownId(g.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Warehouse size={20} color="#fff" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{g.name}</h3>
                        {g.code && <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{g.code}</span>}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
                      background: g.is_active ? '#dcfce7' : '#f1f5f9',
                      color: g.is_active ? '#16a34a' : '#94a3b8'
                    }}>
                      {g.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {g.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', marginBottom: '8px' }}>
                      <MapPin size={12} /> {g.location}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '12px 0' }}>
                    <div style={{ background: '#f0fdf4', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>{stats.total.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Total Units</div>
                    </div>
                    <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>{stats.productsWithStock}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Products</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn btn-primary" style={{ fontSize: '12px', padding: '6px 12px' }}
                      onClick={(e) => { e.stopPropagation(); setActiveGodownId(g.id); }}>
                      View Stock <ChevronRight size={13} />
                    </button>
                    {canManage && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 8px' }}
                          onClick={(e) => { e.stopPropagation(); setEditingGodown(g); setIsFormOpen(true); }}>
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // Clicked a specific godown tab
        <GodownDetail
          godownId={activeView}
          dataService={dataService}
          currentUser={currentUser}
          onBack={() => setActiveView('all')}
          onOpenTransfer={() => setIsTransferOpen(true)}
          embedded
        />
      )}

      {/* Modals */}
      {isFormOpen && (
        <GodownFormModal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingGodown(null); }}
          godown={editingGodown}
          dataService={dataService}
          currentUser={currentUser}
          onArchive={handleArchive}
        />
      )}

      {isTransferOpen && (
        <StockTransferModal
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          dataService={dataService}
          currentUser={currentUser}
        />
      )}

      {isTransferHistoryOpen && (
        <TransferHistory
          isOpen={isTransferHistoryOpen}
          onClose={() => setIsTransferHistoryOpen(false)}
          dataService={dataService}
        />
      )}
    </div>
  );
};
