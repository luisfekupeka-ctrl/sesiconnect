import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { ProvedorEscola } from './context/ContextoEscola';
import { AuthProvider, useAuth } from './context/AuthContext';
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const TeachersPage = React.lazy(() => import('./pages/Teachers'));
const RoomsPage = React.lazy(() => import('./pages/Rooms'));
const LanguageLab = React.lazy(() => import('./pages/LanguageLab'));
const AfterSchool = React.lazy(() => import('./pages/AfterSchool'));
const Monitores = React.lazy(() => import('./pages/Monitores'));
const FormsPage = React.lazy(() => import('./pages/Forms'));
const Admin = React.lazy(() => import('./pages/Admin'));
const ScheduleEditor = React.lazy(() => import('./pages/ScheduleEditor'));
const MonitorScheduleEditor = React.lazy(() => import('./pages/MonitorScheduleEditor'));
const MonitorPortal = React.lazy(() => import('./pages/MonitorPortal'));
const LoginPage = React.lazy(() => import('./pages/Login'));
const ChamadaProfessor = React.lazy(() => import('./pages/ChamadaProfessor'));
const ControleFaltas = React.lazy(() => import('./pages/ControleFaltas'));
const GestaoRealocacao = React.lazy(() => import('./pages/GestaoRealocacao'));
const RelatorioDiario = React.lazy(() => import('./pages/RelatorioDiario'));
const Occurrences = React.lazy(() => import('./pages/Occurrences').then(module => ({ default: module.Occurrences })));
const PendingAtas = React.lazy(() => import('./pages/PendingAtas'));
const ChamadosPage = React.lazy(() => import('./pages/Chamados'));
const DashboardSuper = React.lazy(() => import('./pages/DashboardSuper'));

// Componente de Proteção de Rota
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, profile, loading, signOut } = useAuth();

  // Se vier com hash de recuperação de senha no e-mail, redireciona para a tela de redefinir senha no login
  const hash = window.location.hash;
  if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
    return <Navigate to={`/login${hash}`} replace />;
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (profile?.status !== 'approved' && profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-900/50 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-amber-900/30 blur-[120px]" />
        </div>

        <div className="max-w-md w-full bg-surface p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative z-10 backdrop-blur-md space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-on-surface-bright mb-2">Acesso em Análise</h1>
            <p className="text-on-surface-variant text-sm">Seu cadastro foi recebido e está aguardando aprovação do administrador principal.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-primary text-black rounded-2xl font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all shadow-glow-yellow"
            >
              Verificar Novamente
            </button>
            <button 
              onClick={async () => {
                await signOut();
                window.location.href = '/login';
              }} 
              className="w-full py-4 bg-surface-container-high text-on-surface hover:text-red-500 rounded-2xl font-bold transition-all hover:bg-surface-container-highest active:scale-95 text-sm"
            >
              Sair / Entrar com outra conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requiredRole === 'admin' && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'super_admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <ProvedorEscola>
        <BrowserRouter>
          <React.Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/meu-horario" element={<MonitorPortal />} />
              
              {/* Rotas com Layout (Agora 100% Protegidas por Login e Aprovação) */}
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                {/* Páginas Internas de Consulta */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/teachers" element={<TeachersPage />} />
                <Route path="/rooms" element={<RoomsPage />} />
                <Route path="/language-lab" element={<LanguageLab />} />
                <Route path="/after" element={<AfterSchool />} />
                <Route path="/monitores" element={<Monitores />} />
                <Route path="/relatorio-diario" element={<RelatorioDiario />} />
                <Route path="/ocorrencias" element={<Occurrences />} />
                <Route path="/chamados" element={<ChamadosPage />} />
                
                {/* Áreas que exigem Login/Role ADMIN */}
                <Route path="/atas-pendentes" element={<ProtectedRoute requiredRole="admin"><PendingAtas /></ProtectedRoute>} />
                <Route path="/forms" element={<ProtectedRoute requiredRole="admin"><FormsPage /></ProtectedRoute>} />
                <Route path="/controle-faltas" element={<ProtectedRoute requiredRole="admin"><ControleFaltas /></ProtectedRoute>} />
                <Route path="/realocacao" element={<ProtectedRoute requiredRole="admin"><GestaoRealocacao /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
                <Route path="/dashboard-super" element={<ProtectedRoute requiredRole="super_admin"><DashboardSuper /></ProtectedRoute>} />
                <Route path="/schedule-editor" element={<ProtectedRoute requiredRole="admin"><ScheduleEditor /></ProtectedRoute>} />
                <Route path="/monitor-schedule" element={<ProtectedRoute requiredRole="admin"><MonitorScheduleEditor /></ProtectedRoute>} />
                <Route path="/professor-chamada" element={<ProtectedRoute requiredRole="admin"><ChamadaProfessor /></ProtectedRoute>} />
              </Route>
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </ProvedorEscola>
    </AuthProvider>
  );
}
