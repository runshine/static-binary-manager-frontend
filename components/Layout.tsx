
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition-colors">
              <i className="fas fa-box-open text-xl"></i>
            </div>
            <span className="font-bold text-xl tracking-tight uppercase">PkgVault</span>
          </Link>
          <nav className="flex space-x-6 text-sm font-medium">
            <Link 
              to="/" 
              className={`hover:text-blue-400 transition-colors ${location.pathname === '/' ? 'text-blue-400' : 'text-slate-300'}`}
            >
              Dashboard
            </Link>
            <a href="#" className="text-slate-300 hover:text-blue-400">Documentation</a>
            <a href="#" className="text-slate-300 hover:text-blue-400">Settings</a>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} PkgVault Multi-Arch System. Managed Linux Storage.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
