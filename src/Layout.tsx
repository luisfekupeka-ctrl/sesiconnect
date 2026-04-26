import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, BottomNav } from './components/Navigation';
import { Search, User, Clock, Menu, X } from 'lucide-react';

export function Layout() {
  const [time, setTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoginPage) return <Outlet />;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-sm z-50 border-b border-cyan-900 px-4 flex items-center justify-between">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 -ml-2 text-accent-cyan"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-accent-cyan">SESI</span>
          <span className="text-xs font-bold text-accent-cyan">Connect</span>
        </div>
        
        <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
          <User size={20} className="text-on-surface-variant" />
        </div>
      </header>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="md:pl-72 flex flex-col min-h-screen pt-16 md:pt-0">
        <header className="hidden md:flex h-20 px-8 items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-sm z-40 border-b border-cyan-900">
          <div className="relative w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-accent-cyan transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full bg-surface-container-low rounded-2xl py-4 pl-14 pr-6 text-sm font-semibold transition-all outline-none border-2 border-transparent focus:border-accent-cyan text-on-surface"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3 bg-surface-container-low rounded-2xl border border-cyan-900">
              <Clock size={16} className="text-accent-cyan" />
              <span className="text-sm font-bold tracking-tight text-accent-cyan">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            
            <div className="flex items-center gap-3 pl-5 border-l border-cyan-900">
              <div className="text-right">
                <p className="text-xs font-black text-accent-cyan leading-none">Coordenador</p>
                <p className="text-[10px] font-bold text-accent-emerald uppercase tracking-widest mt-0.5">Online</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-surface-container-low border border-cyan-900 flex items-center justify-center text-on-surface-variant overflow-hidden">
                <User size={24} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8 max-w-full">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}