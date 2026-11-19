import React, { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './TurnosPage.css';

const TurnosCliente = lazy(() => import('./TurnosCliente'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const GestorHorarios = lazy(() => import('./GestorHorarios'));
const EstadisticasPanel = lazy(() => import('./EstadisticasPanel'));
const AdminServicios = lazy(() => import('./AdminServices'));

const SECCIONES = [
  { id: 'agenda', label: 'Agenda', description: 'Turnos del día' },
  { id: 'horarios', label: 'Disponibilidad', description: 'Días y horarios' },
  { id: 'servicios', label: 'Servicios', description: 'Tratamientos y precios' },
  { id: 'stats', label: 'Reportes', description: 'Actividad e ingresos' }
];

export default function TurnosPage() {
  const { user, logout } = useAuth();
  const [tabActiva, setTabActiva] = useState('agenda');
  const esAdmin = user?.rol === 'ADMIN';

  if (!esAdmin) return <Suspense fallback={<p className="page-loading" role="status">Cargando tus turnos…</p>}><TurnosCliente /></Suspense>;

  const nombre = user?.nombre?.trim().split(/\s+/)[0] || 'profesional';
  const seccionActual = SECCIONES.find(seccion => seccion.id === tabActiva);

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <Link className="admin-brand" to="/" aria-label="VH Masajes, inicio">
          <span className="admin-brand-mark" aria-hidden="true">VH</span>
          <span>VH <strong>MASAJES</strong><small>GESTIÓN DE TURNOS</small></span>
        </Link>
        <div className="admin-account">
          <div className="admin-account-copy"><span>Sesión profesional</span><strong>Hola, {nombre}</strong></div>
          <Link className="admin-account-link" to="/cuenta/clave">Cambiar contraseña</Link>
          <button className="admin-logout" type="button" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="admin-workspace">
        <aside className="admin-sidebar" aria-label="Navegación de administración">
          <p className="admin-sidebar-label">ESPACIO DE TRABAJO</p>
          <nav className="admin-tabs" aria-label="Secciones">
            {SECCIONES.map((seccion, index) => <button
              key={seccion.id}
              className={`admin-tab ${tabActiva === seccion.id ? 'active' : ''}`}
              type="button"
              aria-current={tabActiva === seccion.id ? 'page' : undefined}
              onClick={() => setTabActiva(seccion.id)}
            >
              <span className="admin-tab-number" aria-hidden="true">0{index + 1}</span>
              <span><strong>{seccion.label}</strong><small>{seccion.description}</small></span>
            </button>)}
          </nav>
          <div className="admin-sidebar-note"><strong>Atención organizada</strong><p>Compartí tu enlace de reserva para que tus pacientes elijan un horario disponible.</p></div>
        </aside>

        <main className="admin-main" id="contenido-principal">
          <div className="admin-section-heading"><p className="admin-section-overline">VH MASAJES / {seccionActual?.label.toLocaleUpperCase('es-AR')}</p></div>
          <Suspense fallback={<p className="page-loading" role="status">Cargando {seccionActual?.label.toLocaleLowerCase('es-AR')}…</p>}>
            {tabActiva === 'agenda' && <AdminDashboard />}
            {tabActiva === 'horarios' && <GestorHorarios />}
            {tabActiva === 'servicios' && <AdminServicios />}
            {tabActiva === 'stats' && <EstadisticasPanel />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
