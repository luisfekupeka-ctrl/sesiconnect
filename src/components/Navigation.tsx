import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, Users, DoorOpen, Languages, Sparkles, 
  BookOpen, FileText, Shield, ClipboardCheck, RefreshCw, LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ isOpen, setIsOpen }: { isOpen?: boolean; setIsOpen?: (open: boolean) => void }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const allNavItems = [
    { to: '/', icon: LayoutGrid, label: 'Agora' },
    { to: '/rooms', icon: DoorOpen, label: 'Salas' },
    { to: '/teachers', icon: Users, label: 'Professores' },
    { to: '/monitores', icon: BookOpen, label: 'Monitores' },
    { to: '/language-lab', icon: Languages, label: 'Idioma' },
    { to: '/after', icon: Sparkles, label: 'After School' },
    { to: '/forms', icon: FileText, label: 'Ocorrências', protected: true },
    { to: '/controle-faltas', icon: ClipboardCheck, label: 'Chamadas', protected: true },
    { to: '/realocacao', icon: RefreshCw, label: 'Realocação', protected: true },
  ];

  const visibleItems = allNavItems.filter(item => !item.protected || isAdmin);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen w-72 bg-surface border-r border-[#30363d] flex flex-col z-50 transition-transform duration-300",
      isOpen !== undefined ? (isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0") : "hidden md:flex"
    )}>
      <div className="p-6 pb-8">
        <h1 className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-black font-black text-2xl shadow-glow-yellow border border-primary">S</div>
          <div>
            <p className="text-xl font-black tracking-tight text-white leading-none">SESI Connect</p>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest mt-1">Gestão Escolar</p>
          </div>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsOpen?.(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all",
                isActive 
                  ? "bg-primary text-black shadow-glow-yellow" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              )
            }
          >
            <item.icon size={22} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 space-y-3">
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={() => setIsOpen?.(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-5 py-5 rounded-2xl text-base font-bold transition-all border",
                isActive
                  ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  : "bg-surface-container-low text-on-surface-variant border-[#30363d] hover:border-emerald-500 hover:text-emerald-500"
              )
            }
          >
            <Shield size={22} />
            Painel Admin
          </NavLink>
        )}

        <div className="bg-surface-container-low p-4 rounded-2xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-black text-primary">
              {profile?.full_name?.charAt(0) || 'V'}
            </div>
            <div className="max-w-[120px]">
              <p className="text-[11px] font-black text-white truncate">{profile?.full_name || 'Visitante'}</p>
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-tighter">{profile?.role || 'Consulta'}</p>
            </div>
          </div>
          {profile ? (
            <button onClick={handleSignOut} className="p-2 text-on-surface-variant hover:text-red-500 transition-colors">
              <LogOut size={18} />
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
              <Shield size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const navItems = [
    { to: '/', icon: LayoutGrid, label: 'Agora' },
    { to: '/rooms', icon: DoorOpen, label: 'Salas' },
    { to: '/teachers', icon: Users, label: 'Profs' },
    { to: '/forms', icon: FileText, label: 'Ocor.', protected: true },
    { to: '/admin', icon: Shield, label: 'Admin', protected: true },
  ];

  const visibleItems = navItems.filter(item => !item.protected || isAdmin).slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-t border-[#30363d] px-2 pt-2 pb-6 md:hidden">
      <div className="flex justify-around items-center">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center transition-all duration-200 gap-1 px-4 py-2 rounded-2xl",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-on-surface-variant"
              )
            }
          >
            <item.icon size={22} strokeWidth={2} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}