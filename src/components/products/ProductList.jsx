import React, { useState } from 'react';
import { PlusCircle, Search, Boxes, History, Edit, Sliders, AlertTriangle, CheckCircle2, Trash2, BookOpen } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { ProductLedger } from './ProductLedger';
import { RecentStockActivity } from '../common/RecentStockActivity';

export const ProductList = ({
  products,
  dataService,
  currentUser,
  onAddProduct,
  onEditProduct,
  onViewStockHistory,
  onAdjustStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedProductForLedger, setSelectedProductForLedger] = useState(null);

  const canDelete = dataService ? dataService.canDelete(currentUser) : true;

  const handleDeleteProduct = async (prod) => {
    if (window.confirm(`Are you sure you want to delete product "${prod.name}" (${prod.sku})?\n\nCurrent physical stock: ${prod.current_stock} ${prod.unit}.\nThis action cannot be undone.`)) {
      try {
        await dataService.deleteProduct(prod.id);
      } catch (err) {
        console.error('Delete product error:', err);
        alert('Could not delete product: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const handleQuickAdjust = (prod, delta) => {
    const newStock = Math.max(0, (prod.current_stock || 0) + delta);
    dataService.saveProduct({ ...prod, current_stock: newStock });
  };

  const filteredProducts = products.filter((p) => {
    if (p.is_active === false) return false;

    const matches =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matches) return false;
    if (filterLowStock) return (p.current_stock || 0) <= (p.min_stock_alert || 20);
    return true;
  });

  return (
    <div>
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px' }}>Dynamic Product Catalog & Inventory</h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
            Accurate real-time stock levels automatically updated by sales and purchases.
          </p>
        </div>
        <div className="header-actions-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onAdjustStock}>
            <Sliders size={15} color="#7c3aed" /> Manual Stock Adjustment
          </button>
          <button className="btn btn-primary" onClick={onAddProduct}>
            <PlusCircle size={15} /> Add New Product
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
            <Search size={18} color="#64748b" />
            <input
              type="text"
              className="form-input"
              style={{ border: 'none', background: 'transparent', padding: '6px' }}
              placeholder="Search products by name or SKU code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', userSelect: 'none', color: '#0f172a', fontWeight: 500 }}>
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
            />
            <span>Show Low Stock Only</span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      {/* Desktop Products Table (hidden on tablet/mobile) */}
      <div className="card desktop-table-view" style={{ padding: '16px' }}>
        <div className="table-responsive" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th style={{ textAlign: 'right' }}>Current Stock</th>
                <th style={{ textAlign: 'right' }}>Purchase Cost</th>
                <th style={{ textAlign: 'right' }}>Selling Price</th>
                <th style={{ textAlign: 'right' }}>Gross Margin</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLow = (prod.current_stock || 0) <= (prod.min_stock_alert || 20);
                  const margin = (prod.selling_price || 0) - (prod.purchase_price || 0);

                  return (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={prod.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=80'}
                            alt={prod.name}
                            style={{
                              width: '40px',
                              height: '40px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1'
                            }}
                          />
                          <div>
                            <div
                              style={{ fontWeight: 700, color: '#0f172a', cursor: 'pointer', textDecoration: 'underline decoration-dotted' }}
                              onClick={() => setSelectedProductForLedger(prod)}
                              title="Click to view Product Stock Ledger"
                            >
                              {prod.name}
                            </div>
                            {prod.description && (
                              <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '240px' }}>
                                {prod.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: '#0284c7', fontSize: '12px' }}>
                        {prod.sku}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isLow ? '#fef2f2' : '#f0fdf4',
                          color: isLow ? '#dc2626' : '#15803d',
                          fontWeight: 800,
                          fontSize: '13px'
                        }}>
                          {isLow && <AlertTriangle size={13} />}
                          <span>{prod.current_stock} {prod.unit}</span>
                        </div>
                        {isLow && (
                          <div style={{ fontSize: '10px', color: '#ef4444', marginTop: '2px' }}>
                            Alert: Below {prod.min_stock_alert}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(prod.purchase_price)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                        {formatCurrency(prod.selling_price)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: margin >= 0 ? '#10b981' : '#ef4444' }}>
                        +{formatCurrency(margin)} / {prod.unit}
                      </td>
                      <td>
                        <span
                          className={`badge ${prod.is_active ? 'badge-paid' : 'badge-pending'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => dataService.toggleProductActive(prod.id)}
                          title="Click to toggle active status"
                        >
                          {prod.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', color: '#3b82f6' }}
                            onClick={() => setSelectedProductForLedger(prod)}
                            title="View Complete Product Ledger"
                          >
                            <BookOpen size={13} /> Ledger
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => onViewStockHistory(prod)}
                            title="View Stock Movement Audit Trail"
                          >
                            <History size={13} /> Trail
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 7px' }}
                            onClick={() => onEditProduct(prod)}
                            title="Edit Product Details"
                          >
                            <Edit size={13} />
                          </button>
                          {canDelete && (
                            <button
                              className="btn btn-danger btn-sm"
                              style={{ padding: '4px 7px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                              onClick={() => handleDeleteProduct(prod)}
                              title="Delete Product from Catalog"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zero-Scroll Mobile & Tablet Cards View */}
      <div className="mobile-cards-view">
        {filteredProducts.length === 0 ? (
          <div className="card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
            No products found matching your search.
          </div>
        ) : (
          filteredProducts.map((prod) => {
            const isLow = (prod.current_stock || 0) <= (prod.min_stock_alert || 20);
            const margin = (prod.selling_price || 0) - (prod.purchase_price || 0);

            return (
              <div key={prod.id} className="mobile-record-card">
                <div className="card-top-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={prod.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=80'}
                      alt={prod.name}
                      style={{
                        width: '46px',
                        height: '46px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        flexShrink: 0
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-active" style={{ fontSize: '10px', padding: '1px 6px' }}>
                          {prod.sku}
                        </span>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{prod.name}</strong>
                      </div>
                      {prod.description && (
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{prod.description}</p>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: isLow ? '#fef2f2' : '#f0fdf4',
                      color: isLow ? '#dc2626' : '#15803d',
                      fontWeight: 800,
                      fontSize: '13px'
                    }}>
                      {isLow && <AlertTriangle size={13} />}
                      <span>{prod.current_stock} {prod.unit}</span>
                    </div>
                    {isLow && (
                      <div style={{ fontSize: '9.5px', color: '#ef4444', marginTop: '2px' }}>
                        Low Stock Alert
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-meta-grid">
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Purchase Cost:</span>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      {formatCurrency(prod.purchase_price)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Selling Price:</span>
                    <div style={{ fontWeight: 700, color: '#0284c7' }}>
                      {formatCurrency(prod.selling_price)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Profit Margin:</span>
                    <div style={{ fontWeight: 600, color: margin >= 0 ? '#10b981' : '#ef4444' }}>
                      +{formatCurrency(margin)} / {prod.unit}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>Status:</span>
                    <div>
                      <span
                        className={`badge ${prod.is_active ? 'badge-paid' : 'badge-pending'}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => dataService.toggleProductActive(prod.id)}
                      >
                        {prod.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-action-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#3b82f6', flex: '1 1 auto', minWidth: '70px' }}
                    onClick={() => setSelectedProductForLedger(prod)}
                  >
                    <BookOpen size={14} /> Ledger
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: '1 1 auto', minWidth: '80px' }}
                    onClick={() => onViewStockHistory(prod)}
                  >
                    <History size={14} /> Stock Trail
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onEditProduct(prod)}
                    style={{ minWidth: '38px', width: '38px', padding: '6px 0', flex: '0 0 38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Edit Product"
                  >
                    <Edit size={14} />
                  </button>
                  {canDelete && (
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ minWidth: '38px', width: '38px', padding: '6px 0', flex: '0 0 38px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => handleDeleteProduct(prod)}
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Embedded Recent Stock & Godown Activity Section */}
      <RecentStockActivity
        dataService={dataService}
        currentUser={currentUser}
        title="Recent Stock & Godown Activity"
        subtitle="Live audit trail of purchases (stock-in), sales (stock-out), transfers & adjustments"
      />

      {/* Unified Product Stock Ledger Modal */}
      {selectedProductForLedger && (
        <ProductLedger
          product={selectedProductForLedger}
          isOpen={!!selectedProductForLedger}
          onClose={() => setSelectedProductForLedger(null)}
          dataService={dataService}
        />
      )}
    </div>
  );
};
