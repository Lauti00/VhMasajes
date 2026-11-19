import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

// 🚀 ACÁ ESTABA EL ERROR: Ahora sí importamos el archivo correcto
const TurnosPage = lazy(() => import('./pages/TurnosPage'));

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ReservaPublica = lazy(() => import('./pages/ReservaPublica'));
const CambiarPassword = lazy(() => import('./pages/CambiarPassword'));
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div style={{ padding: 32, textAlign: 'center' }}>Cargando…</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reservar" element={<ReservaPublica />} />
          <Route path="/cuenta/clave" element={<ProtectedRoute><CambiarPassword /></ProtectedRoute>} />
          
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
            element={<Navigate to="/reservar" replace />}
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
