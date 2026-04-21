import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout';
import { ProvedorEscola } from './context/ContextoEscola';
import Dashboard from './pages/Dashboard';
import TeachersPage from './pages/Teachers';
import RoomsPage from './pages/Rooms';
import LanguageLab from './pages/LanguageLab';
import AfterSchool from './pages/AfterSchool';
import Monitores from './pages/Monitores';
import FormsPage from './pages/Forms';
import Admin from './pages/Admin';
import ScheduleEditor from './pages/ScheduleEditor';
import MonitorPortal from './pages/MonitorPortal';
import LoginPage from './pages/Login';

// Rotas abertas a pedido do usuário

export default function App() {
  return (
    <ProvedorEscola>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/meu-horario" element={<MonitorPortal />} />

          {/* Rotas com Layout (Dashboard e Admin) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/language-lab" element={<LanguageLab />} />
            <Route path="/after" element={<AfterSchool />} />
            <Route path="/monitores" element={<Monitores />} />
            <Route path="/forms" element={<FormsPage />} />
            
            {/* Áreas Administrativas (Abertas) */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/schedule-editor" element={<ScheduleEditor />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProvedorEscola>
  );
}
