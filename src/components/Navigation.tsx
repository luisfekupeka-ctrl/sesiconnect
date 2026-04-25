import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, Users, DoorOpen, Languages, Sparkles, 
  BookOpen, FileText, Shield, LayoutGrid, ListTodo, 
  Calendar, Zap, GraduationCap, Map, ClipboardCheck, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: LayoutGrid, label: 'Agora' },
  { to: '/rooms', icon: DoorOpen, label: 'Salas' },
  { to: '/teachers', icon: GraduationCap, label: 'Professores' },
  { to: '/monitores', icon: BookOpen, label: 'Monitores' },
  { to: '/language-lab', icon: Languages, label: 'Language Lab' },
  { to: '/after', icon: Sparkles, label: 'After School' },
  { to: '/forms', icon: FileText, label: 'Ocorrências' },
  { to: '/controle-faltas', icon: ClipboardCheck, label: 'Chamadas' },
  { to: '/realocacao', icon: RefreshCw, label: 'Realocação' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-[#0b0f1a] border-r border-outline-variant/10 hidden md:flex flex-col z-50">
      {/* Brand */}
      <div className="p-8 pb-12">
        <h1 className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-on-primary font-black text-xl shadow-lg shadow-primary/20">S</div>
          <div>
            <p className="text-lg font-black tracking-tighter text-on-surface-bright leading-none">SESI Connect</p>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Gestão em tempo real</p>
          </div>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all group",
                isActive 
                  ? "bg-primary text-on-primary shadow-xl shadow-primary/20" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )
            }
          >
            <item.icon size={20} className={cn("transition-colors", location.pathname === item.to ? "text-on-primary" : "group-hover:text-primary")} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Admin Section */}
      <div className="p-6 mt-auto">
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-4 px-6 py-5 rounded-3xl text-sm font-black transition-all border",
              isActive
                ? "bg-accent-rose text-on-primary border-transparent shadow-xl shadow-accent-rose/20"
                : "bg-surface-container-low text-on-surface-variant border-outline-variant/10 hover:border-accent-rose hover:text-accent-rose"
            )
          }
        >
          <Shield size={20} />
          Painel Adm
        </NavLink>
      </div>
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 glass rounded-t-[2.5rem] px-4 pt-3 pb-8 md:hidden">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center transition-all duration-300 gap-1 px-3 py-1 rounded-2xl",
                isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              )
            }
          >
            <item.icon size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
