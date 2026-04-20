/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <ProvedorEscola>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/language-lab" element={<LanguageLab />} />
            <Route path="/after" element={<AfterSchool />} />
            <Route path="/monitores" element={<Monitores />} />
            <Route path="/forms" element={<FormsPage />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProvedorEscola>
  );
}
