// client/src/App.jsx - lazy-loaded pages for a fast first load

import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import Login from './pages/Login';
import './App.css'

// POS and Dashboard are the two screens opened most often, so they are part of
// the first download. Everything else is fetched only when first visited.
import POS from './pages/POS';
import Dashboard from './pages/Dashboard';

const Products = lazy(() => import('./pages/Products'));
const Stock = lazy(() => import('./pages/Stock'));
const Customers = lazy(() => import('./pages/Customers'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Sales = lazy(() => import('./pages/Sales'));
const Debts = lazy(() => import('./pages/Debts'));
const Production = lazy(() => import('./pages/Production'));
const Vehicles = lazy(() => import('./pages/Vehicles'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Role-based default route
function DefaultRoute() {
  const { user } = useAuth();

  if (user?.role === 'cashier') {
    return <Navigate to="/pos" replace />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Suspense fallback={<PageLoader />}><DefaultRoute /></Suspense>} />
          <Route path="pos" element={<Suspense fallback={<PageLoader />}><POS /></Suspense>} />
          <Route path="products" element={<Suspense fallback={<PageLoader />}><Products /></Suspense>} />
          <Route path="stock" element={<Suspense fallback={<PageLoader />}><Stock /></Suspense>} />
          <Route path="customers" element={<Suspense fallback={<PageLoader />}><Customers /></Suspense>} />
          <Route path="debts" element={<Suspense fallback={<PageLoader />}><Debts /></Suspense>} />
          <Route path="production" element={<Suspense fallback={<PageLoader />}><Production /></Suspense>} />
          <Route path="invoices" element={<Suspense fallback={<PageLoader />}><Invoices /></Suspense>} />
          <Route path="reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
          <Route path="sales" element={<Suspense fallback={<PageLoader />}><Sales /></Suspense>} />
          <Route path="vehicles" element={<Suspense fallback={<PageLoader />}><Vehicles /></Suspense>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
