// client/src/components/layout/Sidebar.jsx - Fix mobile sidebar

import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  BarChart3,
  Settings,
  Warehouse
} from 'lucide-react';
import { cn } from '../../lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'POS', path: '/pos' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: Warehouse, label: 'Stock', path: '/stock' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: FileText, label: 'Sales', path: '/sales' },
  { icon: FileText, label: 'Invoices', path: '/invoices' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-gray-900 text-white">
        <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
          <h1 className="text-xl font-bold">Bekhal POS</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "md:hidden fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        
        {/* Sidebar Content */}
        <div className="relative w-64 h-full bg-gray-900 text-white flex flex-col">
          <div className="flex items-center justify-center h-16 px-4 bg-gray-800">
            <h1 className="text-xl font-bold">Bekhal POS</h1>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                    isActive 
                      ? "bg-blue-600 text-white" 
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};