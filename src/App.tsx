import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { ProvedorEscola } from './context/ContextoEscola';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import TeachersPage from './pages/Teachers';
import RoomsPage from './pages/Rooms';
import LanguageLab from './pages/LanguageLab';
import AfterSchool from './pages/AfterSchool';
import Monitores from './pages/Monitores';
import FormsPage from './pages/Forms';
import Admin from './pages/Admin';
import ScheduleEditor from './pages/ScheduleEditor';
import MonitorScheduleEditor from './pages/MonitorScheduleEditor';
import MonitorPortal from './pages/MonitorPortal';
import LoginPage from './pages/Login';
import ChamadaProfessor from './pages/ChamadaProfessor';
import ControleFaltas from './pages/ControleFaltas';
import GestaoRealocacao from './pages/GestaoRealocacao';
import RelatorioDiario from './pages/RelatorioDiario';
import { Occurrences } from './pages/Occurrences';

// Componente de Proteção de Rota
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (profile?.status !== 'approved' && profile?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-black">Acesso em Análise</h1>
          <p className="text-on-surface-variant">Seu cadastro foi recebido e está aguardando aprovação do administrador principal.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold">Verificar Novamente</button>
        </div>
      </div>
    );
  }

  if (requiredRole === 'admin' && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ProvedorEscola>
        <BrowserRouter>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/meu-horario" element={<MonitorPortal />} />
            
            {/* Rotas com Layout (Públicas e Privadas) */}
            <Route element={<Layout />}>
              {/* Públicas (Consulta) */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/teachers" element={<TeachersPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/language-lab" element={<LanguageLab />} />
              <Route path="/after" element={<AfterSchool />} />
              <Route path="/monitores" element={<Monitores />} />
              <Route path="/relatorio-diario" element={<RelatorioDiario />} />
              <Route path="/ocorrencias" element={<Occurrences />} />
              
              {/* Áreas que exigem Login/Role ADMIN */}
              <Route path="/forms" element={<ProtectedRoute requiredRole="admin"><FormsPage /></ProtectedRoute>} />
              <Route path="/controle-faltas" element={<ProtectedRoute requiredRole="admin"><ControleFaltas /></ProtectedRoute>} />
              <Route path="/realocacao" element={<ProtectedRoute requiredRole="admin"><GestaoRealocacao /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
              <Route path="/schedule-editor" element={<ProtectedRoute requiredRole="admin"><ScheduleEditor /></ProtectedRoute>} />
              <Route path="/monitor-schedule" element={<ProtectedRoute requiredRole="admin"><MonitorScheduleEditor /></ProtectedRoute>} />
              <Route path="/professor-chamada" element={<ProtectedRoute requiredRole="admin"><ChamadaProfessor /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProvedorEscola>
    </AuthProvider>
  );
}
