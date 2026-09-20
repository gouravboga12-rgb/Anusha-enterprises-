import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerProfile } from './components/customers/CustomerProfile';
import { CustomerFormModal } from './components/customers/CustomerFormModal';
import { SupplierList } from './components/suppliers/SupplierList';
import { SupplierProfile } from './components/suppliers/SupplierProfile';
import { SupplierFormModal } from './components/suppliers/SupplierFormModal';
import { ProductList } from './components/products/ProductList';
import { ProductFormModal } from './components/products/ProductFormModal';
import { StockMovementModal } from './components/products/StockMovementModal';
import { SalesList } from './components/sales/SalesList';
import { NewSaleModal } from './components/sales/NewSaleModal';
import { BillDetailsModal } from './components/sales/BillDetailsModal';
import { EditSaleModal } from './components/sales/EditSaleModal';
import { PurchasesList } from './components/purchases/PurchasesList';
import { NewPurchaseModal } from './components/purchases/NewPurchaseModal';
import { PurchaseDetailsModal } from './components/purchases/PurchaseDetailsModal';
import { EditPurchaseModal } from './components/purchases/EditPurchaseModal';
import { PaymentList } from './components/payments/PaymentList';
import { RecordPaymentModal } from './components/payments/RecordPaymentModal';
import { CustomerLedgerView } from './components/ledger/CustomerLedgerView';
import { SupplierLedgerView } from './components/ledger/SupplierLedgerView';
import { DailyTransactions } from './components/daybook/DailyTransactions';
import { ManualAdjustmentModal } from './components/inventory/ManualAdjustmentModal';
import { RevenueProfitReport } from './components/reports/RevenueProfitReport';
import { GodownList } from './components/godowns/GodownList';
import { WalletPage } from './components/wallet/WalletPage';
import { ActivityLogPage } from './components/activitylog/ActivityLogPage';
import { UserManagement } from './components/users/UserManagement';
import { BottomNav } from './components/common/BottomNav';
import { Footer } from './components/common/Footer';
import { LoginPage } from './components/auth/LoginPage';
import { Boxes, Warehouse } from 'lucide-react';

import { dataService } from './api/dataService';

export const App = () => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('anusha_crm_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [productsSubTab, setProductsSubTab] = useState('catalog'); // 'catalog' | 'godowns'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [, setTick] = useState(0); // For re-rendering when dataService changes

  // Synchronize route URL with login state
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      if (window.location.pathname !== '/control-login') {
        window.history.replaceState(null, '', '/control-login');
        setCurrentPath('/control-login');
      }
    } else {
      if (window.location.pathname === '/control-login') {
        window.history.replaceState(null, '', '/');
        setCurrentPath('/');
      }
    }
  }, [currentUser]);

  const handleLoginSuccess = (userObj) => {
    try {
      localStorage.setItem('anusha_crm_auth_user', JSON.stringify(userObj));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
    setCurrentUser(userObj);
    window.history.pushState(null, '', '/');
    setCurrentPath('/');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('anusha_crm_auth_user');
    } catch (e) {
      console.warn('LocalStorage remove error:', e);
    }
    setCurrentUser(null);
    window.history.pushState(null, '', '/control-login');
    setCurrentPath('/control-login');
  };

  // Selection states
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  // Modal open states
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [saleInitialCustId, setSaleInitialCustId] = useState('');

  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [purInitialSuppId, setPurInitialSuppId] = useState('');

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentInitialPartyId, setPaymentInitialPartyId] = useState('');
  const [paymentInitialPartyType, setPaymentInitialPartyType] = useState('customer');
  const [paymentInitialDocId, setPaymentInitialDocId] = useState('');

  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);

  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [stockHistoryProduct, setStockHistoryProduct] = useState(null);

  // New Separate Bill & Purchase Management Modals
  const [selectedBillSale, setSelectedBillSale] = useState(null);
  const [isBillDetailsOpen, setIsBillDetailsOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [isEditSaleOpen, setIsEditSaleOpen] = useState(false);

  const [selectedPurchaseDoc, setSelectedPurchaseDoc] = useState(null);
  const [isPurchaseDetailsOpen, setIsPurchaseDetailsOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [isEditPurchaseOpen, setIsEditPurchaseOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // Quick action openers
  const openNewSale = (customerId = '') => {
    setSaleInitialCustId(customerId || '');
    setIsNewSaleOpen(true);
  };

  const openNewPurchase = (supplierId = '') => {
    setPurInitialSuppId(supplierId || '');
    setIsNewPurchaseOpen(true);
  };

  const openPayment = (partyId = '', partyType = 'customer', docId = '') => {
    setPaymentInitialPartyId(partyId || '');
    setPaymentInitialPartyType(partyType || 'customer');
    setPaymentInitialDocId(docId || '');
    setIsPaymentOpen(true);
  };

  const openBillDetails = (sale) => {
    setSelectedBillSale(sale);
    setIsBillDetailsOpen(true);
  };

  const openEditSale = (sale) => {
    setEditingSale(sale);
    setIsEditSaleOpen(true);
  };

  const openPurchaseDetails = (pur) => {
    setSelectedPurchaseDoc(pur);
    setIsPurchaseDetailsOpen(true);
  };

  const openEditPurchase = (pur) => {
    setEditingPurchase(pur);
    setIsEditPurchaseOpen(true);
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} dataService={dataService} />;
  }

  return (
    <div className="app-container">
      {/* Responsive Sidebar Drawer */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedCustomerId(null);
          setSelectedSupplierId(null);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar
          isLiveConnected={dataService.isLiveConnected}
          isLoading={dataService.isLoading}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenNewSale={() => openNewSale()}
          onOpenPayment={() => openPayment()}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {!dataService.isLiveConnected && (
          <div style={{
            background: 'linear-gradient(90deg, #eff6ff 0%, #f0fdf4 100%)',
            borderBottom: '1px solid #bfdbfe',
            padding: '8px 16px',
            fontSize: '12px',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, background: '#3b82f6', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>SUPABASE</span>
              <span>Live cloud engine active. Ensure you ran <strong>supabase_schema.sql</strong> in your Supabase SQL Editor to enable full cloud table sync across all devices!</span>
            </div>
            <button
              onClick={() => dataService.init()}
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Check Tables
            </button>
          </div>
        )}

        <main className="page-content">
          {activeTab === 'dashboard' && (
            <Dashboard
              dataService={dataService}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewSale={() => openNewSale()}
              onOpenNewPurchase={() => openNewPurchase()}
              onOpenPayment={() => openPayment()}
              onOpenAdjustment={() => setIsAdjustmentOpen(true)}
            />
          )}

          {activeTab === 'customers' && (
            selectedCustomerId ? (
              <CustomerProfile
                customerId={selectedCustomerId}
                dataService={dataService}
                currentUser={currentUser}
                onBack={() => setSelectedCustomerId(null)}
                onOpenNewSale={(cId) => openNewSale(cId)}
                onOpenPayment={(cId, type, docId) => openPayment(cId, type, docId)}
                onEditCustomer={(c) => {
                  setEditingCustomer(c);
                  setIsCustomerFormOpen(true);
                }}
                onViewBillDetails={(sale) => openBillDetails(sale)}
                onEditSale={(sale) => openEditSale(sale)}
              />
            ) : (
              <CustomerList
                customers={dataService.getCustomers()}
                dataService={dataService}
                currentUser={currentUser}
                onSelectCustomer={(id) => setSelectedCustomerId(id)}
                onEditCustomer={(c) => {
                  setEditingCustomer(c);
                  setIsCustomerFormOpen(true);
                }}
                onAddCustomer={() => {
                  setEditingCustomer(null);
                  setIsCustomerFormOpen(true);
                }}
                onOpenNewSale={(cId) => openNewSale(cId)}
                onOpenPayment={(cId, type) => openPayment(cId, type)}
              />
            )
          )}

          {activeTab === 'suppliers' && (
            selectedSupplierId ? (
              <SupplierProfile
                supplierId={selectedSupplierId}
                dataService={dataService}
                currentUser={currentUser}
                onBack={() => setSelectedSupplierId(null)}
                onOpenNewPurchase={(sId) => openNewPurchase(sId)}
                onOpenPayment={(sId, type, docId) => openPayment(sId, type, docId)}
                onEditSupplier={(s) => {
                  setEditingSupplier(s);
                  setIsSupplierFormOpen(true);
                }}
                onViewPurchaseDetails={(pur) => openPurchaseDetails(pur)}
                onEditPurchase={(pur) => openEditPurchase(pur)}
              />
            ) : (
              <SupplierList
                suppliers={dataService.getSuppliers()}
                dataService={dataService}
                currentUser={currentUser}
                onSelectSupplier={(id) => setSelectedSupplierId(id)}
                onEditSupplier={(s) => {
                  setEditingSupplier(s);
                  setIsSupplierFormOpen(true);
                }}
                onAddSupplier={() => {
                  setEditingSupplier(null);
                  setIsSupplierFormOpen(true);
                }}
                onOpenNewPurchase={(sId) => openNewPurchase(sId)}
                onOpenPayment={(sId, type) => openPayment(sId, type)}
              />
            )
          )}

          {activeTab === 'products' && (
            <div>
              <div className="subnav-tabs-bar" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${productsSubTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setProductsSubTab('catalog')}
                >
                  <Boxes size={16} /> Products & Overall Stock
                </button>
                <button
                  className={`btn ${productsSubTab === 'godowns' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setProductsSubTab('godowns')}
                >
                  <Warehouse size={16} /> Godown Management & Transfers
                </button>
              </div>

              {productsSubTab === 'catalog' ? (
                <ProductList
                  products={dataService.getProducts()}
                  dataService={dataService}
                  currentUser={currentUser}
                  onAddProduct={() => {
                    setEditingProduct(null);
                    setIsProductFormOpen(true);
                  }}
                  onEditProduct={(p) => {
                    setEditingProduct(p);
                    setIsProductFormOpen(true);
                  }}
                  onViewStockHistory={(p) => setStockHistoryProduct(p)}
                  onAdjustStock={() => setIsAdjustmentOpen(true)}
                />
              ) : (
                <GodownList dataService={dataService} currentUser={currentUser} />
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <SalesList
              sales={dataService.getSales()}
              dataService={dataService}
              onOpenNewSale={() => openNewSale()}
              onOpenPayment={(cId, type, saleId) => openPayment(cId, type, saleId)}
              onSelectCustomer={(cId) => {
                setSelectedCustomerId(cId);
                setActiveTab('customers');
              }}
              onViewBillDetails={(sale) => openBillDetails(sale)}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesList
              purchases={dataService.getPurchases()}
              dataService={dataService}
              onOpenNewPurchase={() => openNewPurchase()}
              onOpenPayment={(sId, type, purId) => openPayment(sId, type, purId)}
              onSelectSupplier={(sId) => {
                setSelectedSupplierId(sId);
                setActiveTab('suppliers');
              }}
              onViewPurchaseDetails={(pur) => openPurchaseDetails(pur)}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentList
              payments={dataService.getPayments()}
              dataService={dataService}
              onOpenRecordPayment={() => openPayment()}
              onSelectCustomer={(cId) => {
                setSelectedCustomerId(cId);
                setActiveTab('customers');
              }}
              onSelectSupplier={(sId) => {
                setSelectedSupplierId(sId);
                setActiveTab('suppliers');
              }}
            />
          )}

          {activeTab === 'customer-ledger' && (
            <CustomerLedgerView
              dataService={dataService}
              onSelectCustomer={(cId) => {
                setSelectedCustomerId(cId);
                setActiveTab('customers');
              }}
              onOpenPayment={(cId, type) => openPayment(cId, type)}
            />
          )}

          {activeTab === 'supplier-ledger' && (
            <SupplierLedgerView
              dataService={dataService}
              onSelectSupplier={(sId) => {
                setSelectedSupplierId(sId);
                setActiveTab('suppliers');
              }}
              onOpenPayment={(sId, type) => openPayment(sId, type)}
            />
          )}

          {(activeTab === 'daybook' || activeTab === 'day-book' || activeTab === 'reports') && (
            <DailyTransactions dataService={dataService} />
          )}

          {activeTab === 'wallet' && (
            <WalletPage dataService={dataService} currentUser={currentUser} />
          )}

          {activeTab === 'activity-log' && (
            <ActivityLogPage dataService={dataService} currentUser={currentUser} />
          )}

          {activeTab === 'users' && (
            <UserManagement dataService={dataService} currentUser={currentUser} />
          )}
        </main>

        <Footer />
      </div>

      {/* Global Modals */}
      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        dataService={dataService}
        currentUser={currentUser}
        initialCustomerId={saleInitialCustId}
        onOpenPayment={(cId, type) => openPayment(cId, type)}
      />

      <NewPurchaseModal
        isOpen={isNewPurchaseOpen}
        onClose={() => setIsNewPurchaseOpen(false)}
        dataService={dataService}
        currentUser={currentUser}
        initialSupplierId={purInitialSuppId}
        onOpenPayment={(sId, type) => openPayment(sId, type)}
      />

      <RecordPaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        dataService={dataService}
        initialPartyId={paymentInitialPartyId}
        initialPartyType={paymentInitialPartyType}
        initialDocId={paymentInitialDocId}
      />

      <ManualAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        dataService={dataService}
      />

      <CustomerFormModal
        isOpen={isCustomerFormOpen}
        onClose={() => {
          setIsCustomerFormOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
        onSave={(cData) => dataService.saveCustomer(cData, currentUser)}
      />

      <SupplierFormModal
        isOpen={isSupplierFormOpen}
        onClose={() => {
          setIsSupplierFormOpen(false);
          setEditingSupplier(null);
        }}
        supplier={editingSupplier}
        dataService={dataService}
        currentUser={currentUser}
        onSave={(sData, productIds) => {
          const s = dataService.saveSupplier(sData, currentUser);
          if (productIds && s?.id) {
            dataService.saveSupplierProducts(s.id, productIds, currentUser);
          }
        }}
      />

      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onSave={(pData) => dataService.saveProduct(pData)}
      />

      <StockMovementModal
        isOpen={!!stockHistoryProduct}
        onClose={() => setStockHistoryProduct(null)}
        product={stockHistoryProduct}
        dataService={dataService}
      />

      {/* Bill & Purchase Inspection and Editing Modals */}
      <BillDetailsModal
        isOpen={isBillDetailsOpen}
        onClose={() => {
          setIsBillDetailsOpen(false);
          setSelectedBillSale(null);
        }}
        sale={selectedBillSale}
        dataService={dataService}
        onAddPayment={(sale) => {
          setIsBillDetailsOpen(false);
          openPayment(sale.customer_id, 'customer', sale.id);
        }}
        onEditBill={(sale) => {
          setIsBillDetailsOpen(false);
          openEditSale(sale);
        }}
      />

      <EditSaleModal
        isOpen={isEditSaleOpen}
        onClose={() => {
          setIsEditSaleOpen(false);
          setEditingSale(null);
        }}
        sale={editingSale}
        dataService={dataService}
        currentUser={currentUser}
        onSave={() => {
          setIsEditSaleOpen(false);
          setEditingSale(null);
        }}
      />

      <PurchaseDetailsModal
        isOpen={isPurchaseDetailsOpen}
        onClose={() => {
          setIsPurchaseDetailsOpen(false);
          setSelectedPurchaseDoc(null);
        }}
        purchase={selectedPurchaseDoc}
        dataService={dataService}
        onAddPayment={(pur) => {
          setIsPurchaseDetailsOpen(false);
          openPayment(pur.supplier_id, 'supplier', pur.id);
        }}
        onEditPurchase={(pur) => {
          setIsPurchaseDetailsOpen(false);
          openEditPurchase(pur);
        }}
      />

      <EditPurchaseModal
        isOpen={isEditPurchaseOpen}
        onClose={() => {
          setIsEditPurchaseOpen(false);
          setEditingPurchase(null);
        }}
        purchase={editingPurchase}
        dataService={dataService}
        currentUser={currentUser}
        onSave={() => {
          setIsEditPurchaseOpen(false);
          setEditingPurchase(null);
        }}
      />

      {/* Touch-Friendly Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedCustomerId(null);
          setSelectedSupplierId(null);
        }}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        dataService={dataService}
      />
    </div>
  );
};
