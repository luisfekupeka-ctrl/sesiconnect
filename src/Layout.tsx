import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, BottomNav } from './components/Navigation';
import { Search, Bell, User, Clock } from 'lucide-react';

export function Layout() {
  const [time, setTime] = useState(new Date());
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoginPage) return <Outlet />;

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <Sidebar />
      
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-24 px-8 hidden md:flex items-center justify-between sticky top-0 bg-surface-container-lowest/80 backdrop-blur-xl z-40 border-b border-outline-variant/10">
          <div className="relative w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar aluno, professor, turma, sala, nível..." 
              className="w-full bg-surface-container-low rounded-2xl py-4 pl-14 pr-6 text-sm font-bold transition-all outline-none border-2 border-transparent focus:border-primary/20"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-5 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/5">
              <Clock size={16} className="text-primary" />
              <span className="text-sm font-black tracking-tight text-on-surface-bright">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-outline-variant/10">
              <div className="text-right">
                <p className="text-[11px] font-black text-on-surface-bright leading-none">Coordenador SESI</p>
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Conectado</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-surface-container-low border border-outline-variant/10 flex items-center justify-center text-on-surface-variant overflow-hidden">
                <User size={24} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 pb-32 max-w-[1600px]">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
