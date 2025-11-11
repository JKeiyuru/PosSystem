// client/src/App.jsx - UPDATED

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Customers from './pages/Customers';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Sales from './pages/Sales';
import Debts from './pages/Debts';
import Production from './pages/Production';
import './App.css'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
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
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="products" element={<Products />} />
          <Route path="stock" element={<Stock />} />
          <Route path="customers" element={<Customers />} />
          <Route path="debts" element={<Debts />} />
          <Route path="production" element={<Production />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="sales" element={<Sales />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;