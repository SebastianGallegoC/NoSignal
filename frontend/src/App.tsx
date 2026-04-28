import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { FormularioPage } from '@/pages/FormularioPage';
import { LoginPage } from '@/pages/LoginPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/formulario"
        element={
          <ProtectedRoute>
            <FormularioPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/formulario" replace />} />
    </Routes>
  );
}

export default App;
