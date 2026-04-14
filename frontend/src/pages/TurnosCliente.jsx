import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from "../context/useAuth";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import esES from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'es': esES };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function TurnosCliente() {
    const { logout, token } = useAuth();

    const [servicioId, setServicioId] = useState(1);
    const [fecha, setFecha] = useState('');
    const [horasLibres, setHorasLibres] = useState([]);
    const [horaElegida, setHoraElegida] = useState('');
    const [cargandoHoras, setCargandoHoras] = useState(false);
    const [misTurnosCalendario, setMisTurnosCalendario] = useState([]);

    // Cargar turnos del backend
    const cargarMisTurnos = () => {
        if (!token) return;
        fetch("http://localhost:8083/api/turnos/mis-turnos", {
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            const eventos = data.map(t => ({
                id: t.id,
                title: t.servicioNombre || "Turno",
                start: new Date(t.fecha),
                end: new Date(new Date(t.fecha).getTime() + 60 * 60 * 1000),
            }));
            setMisTurnosCalendario(eventos);
        })
        .catch(err => console.error("Error cargando calendario:", err));
    };

    useEffect(() => {
        cargarMisTurnos();
    }, [token]);

    // Buscar disponibilidad
    useEffect(() => {
        if (fecha && token) {
            setHoraElegida('');
            setCargandoHoras(true);
            fetch(`http://localhost:8083/api/turnos/disponibilidad/${fecha}`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                // Seteamos un array vacío si no viene nada para evitar errores de map
                setHorasLibres(Array.isArray(data) ? data : []);
                setCargandoHoras(false);
            })
            .catch(() => {
                setHorasLibres([]);
                setCargandoHoras(false);
            });
        }
    }, [fecha, token]);

    const handleReservar = async (e) => {
        e.preventDefault();
        if (!fecha || !horaElegida) return;

        const payload = {
            fecha: `${fecha}T${horaElegida}:00`,
            cliente: "Cliente Web", 
            servicioId: Number(servicioId),
            notas: ""
        };

        try {
            const res = await fetch("http://localhost:8083/api/turnos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("✅ Reserva exitosa");
                setFecha('');
                setHoraElegida('');
                setHorasLibres([]); // Limpiamos la lista para resetear el DOM
                cargarMisTurnos();
            } else {
                alert("❌ El horario ya no está disponible");
            }
        } catch (error) {
            alert("❌ Error de red");
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 30px', backgroundColor: '#fff', borderBottom: '1px solid #dee2e6' }}>
                <h2 style={{ margin: 0 }}>💆‍♀️ Mis Reservas</h2>
                <button onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cerrar Sesión</button>
            </header>

            <div style={{ display: 'flex', padding: '20px', gap: '20px', flexWrap: 'wrap' }}>
                
                {/* FORMULARIO */}
                <div style={{ flex: '1 1 350px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <form onSubmit={handleReservar}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Servicio</label>
                            <select value={servicioId} onChange={e => setServicioId(e.target.value)} style={inputStyle}>
                                <option value="1">Masaje Descontracturante</option>
                                <option value="2">Limpieza Facial</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={labelStyle}>Fecha</label>
                            <input type="date" value={fecha} min={new Date().toISOString().split("T")[0]} onChange={e => setFecha(e.target.value)} style={inputStyle} required />
                        </div>

                        {fecha && (
                            <div key={`container-${fecha}`} style={{ marginTop: '20px' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Horarios para el {fecha}:</p>
                                {cargandoHoras ? <p>Cargando disponibilidad...</p> : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {horasLibres.map((h) => (
                                            <button 
                                                key={`${fecha}-${h}`} // Key única combinada para evitar errores de removeChild
                                                type="button"
                                                onClick={() => setHoraElegida(h)}
                                                style={{
                                                    padding: '10px 5px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #007bff',
                                                    cursor: 'pointer',
                                                    backgroundColor: horaElegida === h ? '#007bff' : '#fff',
                                                    color: horaElegida === h ? '#fff' : '#007bff',
                                                    transition: '0.2s'
                                                }}
                                            >
                                                {h}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {!cargandoHoras && horasLibres.length === 0 && <p style={{ color: 'red', fontSize: '0.9rem' }}>No hay turnos disponibles para este día.</p>}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={!horaElegida} 
                            style={{ 
                                width: '100%', padding: '12px', marginTop: '20px', borderRadius: '8px', border: 'none',
                                backgroundColor: horaElegida ? '#28a745' : '#ccc', color: '#fff', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            {horaElegida ? `Reservar a las ${horaElegida}` : 'Seleccione un horario'}
                        </button>
                    </form>
                </div>

                {/* CALENDARIO */}
                <div style={{ flex: '1 1 600px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ height: '550px' }}>
                        <Calendar
                            localizer={localizer}
                            events={misTurnosCalendario}
                            startAccessor="start"
                            endAccessor="end"
                            culture='es'
                            messages={{ today: "Hoy", previous: "Ant", next: "Sig", month: "Mes", week: "Semana", day: "Día" }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: '600', color: '#495057' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da' };