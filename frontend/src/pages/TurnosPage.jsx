import React, { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "../context/useAuth";

// COMPONENTES
const TurnosCliente = lazy(() => import('./TurnosCliente'));
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const GestorHorarios = lazy(() => import('./GestorHorarios'));
const EstadisticasPanel = lazy(() => import('./EstadisticasPanel'));
const AdminServicios = lazy(() => import('./AdminServices'));

export default function TurnosPage() {

    const { user, logout } = useAuth();

    const [tabActiva, setTabActiva] = useState('agenda');

    // =====================================
    // DETECTAR ADMIN
    // =====================================

    const esAdmin = user?.rol === 'ADMIN';

    // =====================================
    // SI NO ES ADMIN
    // =====================================

    if (!esAdmin) {

        return <Suspense fallback={<p style={{ padding: 32, textAlign: 'center' }}>Cargando turnos…</p>}><TurnosCliente /></Suspense>;
    }

    // =====================================
    // PANEL ADMIN
    // =====================================

    return (

        <div
            style={{
                minHeight: '100vh',
                backgroundColor: '#f0f2f5',
                padding: '20px'
            }}
        >

            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}
            >

                {/* HEADER */}

                <header
                    style={{
                        marginBottom: '30px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >

                    <div>

                        <h1
                            style={{
                                color: '#1a1a1a',
                                margin: 0,
                                fontSize: '1.8rem'
                            }}
                        >
                            Panel de Control Profesional
                        </h1>

                        <p style={{ color: '#666' }}>
                            Bienvenido Administrador:
                            <strong>
                                {" "}
                                {user?.email}
                            </strong>
                        </p>

                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Link to="/cuenta/clave" style={{ color: '#405b48', fontWeight: 600, fontSize: 14 }}>Cambiar contraseña</Link>
                    <button
                        onClick={logout}
                        style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '10px 15px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Cerrar Sesión
                    </button>
                    </div>

                </header>

                {/* TABS */}

                <div
                    style={{
                        display: 'flex',
                        gap: '10px',
                        marginBottom: '20px',
                        borderBottom: '2px solid #ddd'
                    }}
                >

                    <button
                        onClick={() => setTabActiva('agenda')}
                        style={tabStyle(tabActiva === 'agenda')}
                    >
                        📅 Agenda
                    </button>

                    <button
                        onClick={() => setTabActiva('horarios')}
                        style={tabStyle(tabActiva === 'horarios')}
                    >
                        ⏱️ Horarios
                    </button>

                    <button
                        onClick={() => setTabActiva('servicios')}
                        style={tabStyle(tabActiva === 'servicios')}
                    >
                        💆 Servicios
                    </button>

                    <button
                        onClick={() => setTabActiva('stats')}
                        style={tabStyle(tabActiva === 'stats')}
                    >
                        📊 Reportes
                    </button>

                </div>

                {/* CONTENIDO */}

                <div style={{ padding: '10px 0' }}>

                    <Suspense fallback={<p style={{ padding: 32, textAlign: 'center' }}>Cargando panel…</p>}>
                    {tabActiva === 'agenda' && <AdminDashboard />}

                    {tabActiva === 'horarios' && (
                        <GestorHorarios />
                    )}

                    {tabActiva === 'servicios' && <AdminServicios />}

                    {tabActiva === 'stats' && <EstadisticasPanel />}
                    </Suspense>

                </div>

            </div>

        </div>
    );
}

const tabStyle = (activa) => ({

    padding: '12px 20px',

    fontSize: '0.95rem',

    fontWeight: 'bold',

    cursor: 'pointer',

    backgroundColor: activa
        ? '#fff'
        : 'transparent',

    color: activa
        ? '#0d6efd'
        : '#666',

    border: 'none',

    borderBottom: activa
        ? '4px solid #0d6efd'
        : '4px solid transparent',

    transition: 'all 0.3s ease',

    borderRadius: '8px 8px 0 0',

    outline: 'none'
});
