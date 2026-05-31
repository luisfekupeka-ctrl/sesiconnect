import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, BottomNav } from './components/Navigation';
import { Search, User, Clock, Menu, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  professor: 'Professor',
  monitor: 'Monitor',
  user: 'Usuário',
};

export function Layout() {
  const [time, setTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [buscaGlobal, setBuscaGlobal] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const { profile } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoginPage) return <Outlet />;

  const userRoleLabel = profile?.role ? roleLabels[profile.role] || profile.role : 'Visitante';
  const userInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : '';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-sm z-50 border-b border-[#30363d] px-4 flex items-center justify-between">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 -ml-2 text-[#42a0f5]"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-[#42a0f5]">SESI</span>
          <span className="text-xs font-bold text-[#f1d86f]">Connect</span>
        </div>
        
        <button 
          onClick={() => navigate('/login')}
          className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center active:scale-95 transition-transform"
        >
          <User size={20} className="text-on-surface-variant hover:text-primary transition-colors" />
        </button>
      </header>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="md:pl-72 flex flex-col min-h-screen pt-16 md:pt-0">
        <header className="hidden md:flex h-20 px-8 items-center justify-between sticky top-0 bg-surface/80 backdrop-blur-sm z-40 border-b border-[#30363d]">
          <div className="relative w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-[#42a0f5] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={buscaGlobal}
              onChange={(e) => setBuscaGlobal(e.target.value)}
              className="w-full bg-surface-container-low rounded-2xl py-4 pl-14 pr-6 text-sm font-semibold transition-all outline-none border-2 border-transparent focus:border-[#42a0f5] text-on-surface"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-5 py-3 bg-surface-container-low rounded-2xl border border-[#30363d]">
              <Clock size={16} className="text-[#f1d86f]" />
              <span className="text-sm font-bold tracking-tight text-white">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            
            <div className="flex items-center gap-3 pl-5 border-l border-[#30363d]">
              <div className="text-right">
                <p className="text-xs font-black text-white leading-none">{profile?.full_name || 'Usuário'}</p>
                <p className="text-[10px] font-bold text-[#0aeb7a] uppercase tracking-widest mt-0.5">{userRoleLabel}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-surface-container-low border border-[#30363d] flex items-center justify-center text-primary font-black overflow-hidden select-none">
                {userInitial || <User size={24} />}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8 max-w-full">
          <Outlet context={{ buscaGlobal, setBuscaGlobal }} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}