// client/src/components/layout/Sidebar.jsx - UPDATED ROLE-BASED NAVIGATION

import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  BarChart3,
  Settings,
  Warehouse,
  CreditCard,
  Factory,
  Truck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

const allMenuItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    path: '/',
    roles: ['admin', 'manager']
  },
  { 
    icon: ShoppingCart, 
    label: 'POS', 
    path: '/pos',
    roles: ['admin', 'manager', 'cashier']
  },
  { 
    icon: FileText, 
    label: 'Sales', 
    path: '/sales',
    roles: ['admin', 'manager', 'cashier']
  },
  { 
    icon: Package, 
    label: 'Products', 
    path: '/products',
    roles: ['admin', 'manager', 'cashier']
  },
  { 
    icon: Warehouse, 
    label: 'Stock', 
    path: '/stock',
    roles: ['admin', 'manager', 'cashier']
  },
  { 
    icon: Factory, 
    label: 'Production', 
    path: '/production',
    roles: ['admin', 'manager', 'cashier']
  },
  { 
    icon: CreditCard, 
    label: 'Debts', 
    path: '/debts',
    roles: ['admin', 'manager', 'cashier']
  },
  { 
    icon: Truck, 
    label: 'Vehicles', 
    path: '/vehicles',
    roles: ['admin', 'manager', 'cashier']
  },
  { 
    // Cashiers can add customers and download statements
    icon: Users, 
    label: 'Customers', 
    path: '/customers',
    roles: ['admin', 'manager', 'cashier']
  },
  { 
    icon: FileText, 
    label: 'Invoices', 
    path: '/invoices',
    roles: ['admin', 'manager', 'cashier']
  },
  { 
    icon: BarChart3, 
    label: 'Reports', 
    path: '/reports',
    roles: ['admin', 'manager']
  },
  { 
    icon: Settings, 
    label: 'Settings', 
    path: '/settings',
    roles: ['admin', 'manager']
  },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
        <h1 className="text-xl font-bold">Bekhal POS</h1>
        {user && (
          <div className="text-xs text-gray-400">
            <div className="capitalize">{user.role}</div>
          </div>
        )}
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

      {/* User info at bottom */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-sm">
          <div className="text-white font-medium">{user?.name}</div>
          <div className="text-gray-400 text-xs">{user?.email}</div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-gray-900 text-white">
        <SidebarContent />
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
          <SidebarContent />
        </div>
      </div>
    </>
  );
};