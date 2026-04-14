import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// 🚀 ACÁ ESTABA EL ERROR: Ahora sí importamos el archivo correcto
import TurnosPage from './pages/TurnosPage'; 

import AgendarTurno from './pages/AgendarTurno';
import AdminDashboard from './pages/AdminDashboard'; 
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Ruta principal: Ahora TurnosPage recibe al usuario y decide si le muestra la vista de Admin o de Cliente */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TurnosPage />
              </ProtectedRoute>
            }
          />

          {/* Ruta para agendar un turno nuevo */}
          <Route
            path="/agendar"
            element={
              <ProtectedRoute>
                <AgendarTurno />
              </ProtectedRoute>
            }
          />

          {/* Panel exclusivo del Administrador (por si querés entrar escribiendo /admin en la URL) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Si el usuario escribe cualquier cosa rara en la URL, lo mandamos al inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;