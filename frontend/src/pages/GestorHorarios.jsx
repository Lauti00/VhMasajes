import React, { useState, useEffect } from 'react';
import { horarioService } from '../services/HorarioService';

// Diccionario para mostrar el nombre lindo del día
const nombresDias = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
};

// Plantilla por defecto si la base de datos está vacía
const plantillaPorDefecto = Array.from({ length: 7 }, (_, i) => ({
    diaSemana: i + 1,
    laborable: i + 1 <= 5, // Lunes a Viernes true, Fines de semana false
    horaApertura: '09:00',
    horaCierre: '18:00'
}));

export default function GestorHorarios() {
    const [horarios, setHorarios] = useState([]);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        const data = await horarioService.obtenerHorarios();
        // Si hay datos en la BD los usamos, si no, usamos la plantilla
        if (data && data.length > 0) {
            // Formateamos las horas por si vienen con segundos desde Java ("09:00:00" -> "09:00")
            const formateados = data.map(h => ({
                ...h,
                horaApertura: h.horaApertura ? h.horaApertura.substring(0, 5) : '09:00',
                horaCierre: h.horaCierre ? h.horaCierre.substring(0, 5) : '18:00'
            }));
            setHorarios(formateados);
        } else {
            setHorarios(plantillaPorDefecto);
        }
    };

    const handleChange = (diaSemana, campo, valor) => {
        setHorarios(horarios.map(h => 
            h.diaSemana === diaSemana ? { ...h, [campo]: valor } : h
        ));
    };

    const guardarConfiguracion = async () => {
        setGuardando(true);
        setMensaje("");
        try {
            // Le agregamos los segundos ":00" para que Java/LocalTime no se queje
            const payload = horarios.map(h => ({
                ...h,
                horaApertura: h.horaApertura + ":00",
                horaCierre: h.horaCierre + ":00"
            }));
            
            await horarioService.guardarHorarios(payload);
            setMensaje("✅ Horarios guardados correctamente");
            
            // Borramos el mensaje de éxito después de 3 segundos
            setTimeout(() => setMensaje(""), 3000);
        } catch (error) {
            setMensaje("❌ Error al guardar la configuración");
        } finally {
            setGuardando(false);
        }
    };

    if (horarios.length === 0) return <p>Cargando configuración... ⏳</p>;

    return (
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#333', marginBottom: '5px' }}>⏱️ Horarios de Atención</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>Configura los días y horas en los que se pueden reservar turnos.</p>
            
            {mensaje && (
                <div style={{ backgroundColor: mensaje.includes('✅') ? '#d4edda' : '#f8d7da', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                    {mensaje}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {horarios.map((dia) => (
                    <div key={dia.diaSemana} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
                        
                        {/* Nombre del Día y Switch/Checkbox */}
                        <div style={{ display: 'flex', alignItems: 'center', width: '30%' }}>
                            <input 
                                type="checkbox" 
                                checked={dia.laborable}
                                onChange={(e) => handleChange(dia.diaSemana, 'laborable', e.target.checked)}
                                style={{ transform: 'scale(1.5)', marginRight: '15px', cursor: 'pointer' }}
                            />
                            <strong style={{ fontSize: '1.1rem', color: dia.laborable ? '#333' : '#aaa' }}>
                                {nombresDias[dia.diaSemana]}
                            </strong>
                        </div>

                        {/* Selectores de Hora */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', opacity: dia.laborable ? 1 : 0.4 }}>
                            <label style={{ color: '#555', fontWeight: 'bold' }}>De:</label>
                            <input 
                                type="time" 
                                value={dia.horaApertura}
                                disabled={!dia.laborable}
                                onChange={(e) => handleChange(dia.diaSemana, 'horaApertura', e.target.value)}
                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            
                            <label style={{ color: '#555', fontWeight: 'bold', marginLeft: '10px' }}>Hasta:</label>
                            <input 
                                type="time" 
                                value={dia.horaCierre}
                                disabled={!dia.laborable}
                                onChange={(e) => handleChange(dia.diaSemana, 'horaCierre', e.target.value)}
                                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={guardarConfiguracion}
                disabled={guardando}
                style={{ marginTop: '25px', width: '100%', backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '15px', borderRadius: '5px', fontSize: '1.1rem', fontWeight: 'bold', cursor: guardando ? 'not-allowed' : 'pointer' }}
            >
                {guardando ? 'Guardando...' : '💾 Guardar Configuración Semanal'}
            </button>
        </div>
    );
}