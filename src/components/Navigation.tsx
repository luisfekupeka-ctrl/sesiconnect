import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, DoorOpen, Languages, Sparkles, BookOpen, FileText, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/rooms', icon: DoorOpen, label: 'Salas' },
  { to: '/teachers', icon: Users, label: 'Professores' },
  { to: '/language-lab', icon: Languages, label: 'Idiomas' },
  { to: '/after', icon: Sparkles, label: 'After' },
  { to: '/monitores', icon: BookOpen, label: 'Monitores' },
  { to: '/forms', icon: FileText, label: 'Formulários' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 glass border-t border-outline-variant rounded-t-[2.5rem] px-4 pt-3 pb-8 md:hidden">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center transition-all duration-300 gap-1 px-3 py-1 rounded-2xl",
                isActive ? "text-primary bg-primary-container/10" : "text-on-surface-variant hover:text-on-surface"
              )
            }
          >
            <item.icon size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function DesktopNav() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 glass border-b border-outline-variant px-8 py-4 hidden md:flex justify-between items-center">
      <div className="flex items-center gap-12">
        <h1 className="text-xl font-extrabold tracking-tighter text-on-surface">SESI Connect</h1>
        <nav className="flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5",
                  isActive ? "text-primary bg-primary-container/10" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                )
              }
            >
              <item.icon size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border",
              isActive
                ? "bg-red-500/10 text-red-500 border-red-500/20"
                : "text-on-surface-variant hover:text-red-500 hover:bg-red-500/5 border-transparent hover:border-red-500/20"
            )
          }
        >
          <Shield size={16} />
          Admin
        </NavLink>
      </div>
    </header>
  );
}
