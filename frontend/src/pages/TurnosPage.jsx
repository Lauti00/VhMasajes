import React, { useState, useEffect } from 'react';
import { useAuth } from "../context/useAuth";

// COMPONENTES
import TurnosCliente from "./TurnosCliente";
import AdminDashboard from "./AdminDashboard";
import GestorHorarios from "./GestorHorarios";
import EstadisticasPanel from "./EstadisticasPanel";

export default function TurnosPage() {

    const { user, logout, token } = useAuth();

    const [tabActiva, setTabActiva] = useState('agenda');

    const [stats, setStats] = useState({
        ganancias: 0,
        turnosHoy: 0,
        totalClientes: 0
    });

    // =====================================
    // DETECTAR ADMIN
    // =====================================

    const esAdmin = user?.rol === 'ADMIN';

    // =====================================
    // DEBUG
    // =====================================

    console.log("USER COMPLETO:", user);
    console.log("ROL:", user?.rol);
    console.log("ES ADMIN:", esAdmin);
    console.log("TOKEN:", token);

    useEffect(() => {

        if (esAdmin) {

            console.log("✅ ADMIN DETECTADO");

            setStats({
                ganancias: 25000,
                turnosHoy: 5,
                totalClientes: 120
            });
        }

    }, [esAdmin]);

    // =====================================
    // SI NO ES ADMIN
    // =====================================

    if (!esAdmin) {

        console.log("❌ NO ES ADMIN");

        return <TurnosCliente />;
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

                </header>

                {/* TARJETAS */}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}
                >

                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '12px',
                            borderLeft: '6px solid #0d6efd'
                        }}
                    >

                        <span style={{ color: '#666' }}>
                            💰 Ganancias
                        </span>

                        <h2 style={{ margin: '5px 0' }}>
                            ${stats.ganancias.toLocaleString()}
                        </h2>

                    </div>

                    <div
                        style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '12px',
                            borderLeft: '6px solid #198754'
                        }}
                    >

                        <span style={{ color: '#666' }}>
                            📅 Turnos Hoy
                        </span>

                        <h2 style={{ margin: '5px 0' }}>
                            {stats.turnosHoy}
                        </h2>

                    </div>

                </div>

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
                        onClick={() => setTabActiva('stats')}
                        style={tabStyle(tabActiva === 'stats')}
                    >
                        📊 Reportes
                    </button>

                </div>

                {/* CONTENIDO */}

                <div style={{ padding: '10px 0' }}>

                    {tabActiva === 'agenda' && (
                        <AdminDashboard />
                    )}

                    {tabActiva === 'horarios' && (
                        <GestorHorarios />
                    )}

                    {tabActiva === 'stats' && (
                        <EstadisticasPanel />
                    )}

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