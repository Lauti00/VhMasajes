import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/useAuth';
const LoginPage = lazy(() => import('./pages/LoginPage'));

// 🚀 ACÁ ESTABA EL ERROR: Ahora sí importamos el archivo correcto
const TurnosPage = lazy(() => import('./pages/TurnosPage'));

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ReservaPublica = lazy(() => import('./pages/ReservaPublica'));
const GestionarTurno = lazy(() => import('./pages/GestionarTurno'));
const CambiarPassword = lazy(() => import('./pages/CambiarPassword'));
import './App.css';

function Inicio() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <TurnosPage /> : <ReservaPublica />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div style={{ padding: 32, textAlign: 'center' }}>Cargando…</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/reservar" replace />} />
          <Route path="/reservar" element={<ReservaPublica />} />
          <Route path="/gestionar-turno" element={<GestionarTurno />} />
          <Route path="/cuenta/clave" element={<ProtectedRoute><CambiarPassword /></ProtectedRoute>} />
          
          {/* El sitio abre la reserva pública; las sesiones activas ven su panel correspondiente. */}
          <Route path="/" element={<Inicio />} />

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
