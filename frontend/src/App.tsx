import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { FormularioPage } from '@/pages/FormularioPage';
import { FormulariosDiligenciadosPage } from '@/pages/FormulariosDiligenciadosPage';
import { InicioPage } from '@/pages/InicioPage';
import { LoginPage } from '@/pages/LoginPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/inicio"
        element={
          <ProtectedRoute>
            <InicioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/formulario"
        element={
          <ProtectedRoute>
            <FormularioPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/formularios-diligenciados"
        element={
          <ProtectedRoute>
            <FormulariosDiligenciadosPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}

export default App;
