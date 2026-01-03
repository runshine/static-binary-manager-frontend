
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
              <i className="fas fa-box-open text-xl"></i>
            </div>
            <span className="font-bold text-xl tracking-tight">Static Binary Package Manager</span>
          </Link>
          {/* Removed navigation links from here */}
        </div>
      </header>
      
      <main className="flex-grow max-w-[1800px] mx-auto w-full px-6 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-[1800px] mx-auto px-6 text-center text-slate-500 text-sm flex justify-between items-center">
          <span>&copy; {new Date().getFullYear()} Static Binary Package Manager. Managed Linux Storage.</span>
          <div className="flex gap-4">
            <span className="text-slate-400">Status: <span className="text-emerald-500 font-medium">Online</span></span>
            <span className="text-slate-400">API: <span className="text-blue-500 font-medium">v1.2.0</span></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
