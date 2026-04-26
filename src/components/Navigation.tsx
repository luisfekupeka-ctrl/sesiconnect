import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, Users, DoorOpen, Languages, Sparkles, 
  BookOpen, FileText, Shield, LayoutGrid, ClipboardCheck, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: LayoutGrid, label: 'Agora' },
  { to: '/rooms', icon: DoorOpen, label: 'Salas' },
  { to: '/teachers', icon: Users, label: 'Professores' },
  { to: '/monitores', icon: BookOpen, label: 'Monitores' },
  { to: '/language-lab', icon: Languages, label: 'Idioma' },
  { to: '/after', icon: Sparkles, label: 'After' },
  { to: '/forms', icon: FileText, label: 'Ocorrências' },
  { to: '/controle-faltas', icon: ClipboardCheck, label: 'Chamadas' },
  { to: '/realocacao', icon: RefreshCw, label: 'Realoca' },
];

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen w-72 bg-surface border-r border-outline/10 flex flex-col z-50 transition-transform duration-300",
      isOpen !== undefined ? (isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0") : "hidden md:flex"
    )}>
      {/* Brand */}
      <div className="p-6 pb-8">
        <h1 className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary font-black text-2xl shadow-lg shadow-primary/25">S</div>
          <div>
            <p className="text-xl font-black tracking-tight text-on-surface-bright leading-none">SESI Connect</p>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest mt-1">Gestão scolaire</p>
          </div>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsOpen?.(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl text-base font-bold transition-all group",
                isActive 
                  ? "bg-primary text-on-primary shadow-xl shadow-primary/25" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )
            }
          >
            <item.icon size={22} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Admin Section */}
      <div className="p-4 mt-auto">
        <NavLink
          to="/admin"
          onClick={() => setIsOpen?.(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-4 px-5 py-5 rounded-2xl text-base font-bold transition-all border",
              isActive
                ? "bg-accent-rose text-white border-transparent shadow-xl shadow-accent-rose/25"
                : "bg-surface-container-low text-on-surface-variant border-outline/15 hover:border-accent-rose hover:text-accent-rose"
            )
          }
        >
          <Shield size={22} />
          Painel Admin
        </NavLink>
      </div>
    </aside>
  );
}

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-outline/10 px-2 pt-2 pb-6 md:hidden">
      <div className="flex justify-around items-center">
        {navItems.slice(0, 5).map((item) => (
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
            <item.icon size={24} strokeWidth={2} />
            <span className="text-[11px] font-bold">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}