// client/src/components/layout/Layout.jsx

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import InstallPrompt from './InstallPrompt';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      <InstallPrompt />
    </div>
  );
};