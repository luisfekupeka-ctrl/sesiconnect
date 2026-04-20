import { Outlet } from 'react-router-dom';
import { BottomNav, DesktopNav } from './components/Navigation';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <main className="pt-6 pb-32 px-6 md:pt-28 max-w-7xl mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
