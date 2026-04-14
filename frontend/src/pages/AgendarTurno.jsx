import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { turnoService } from '../services/TurnoService'; // Ajusta la ruta según tu proyecto

const AgendarTurno = () => {
    const [fechaSeleccionada, setFechaSeleccionada] = useState('');
    const [horasLibres, setHorasLibres] = useState([]);
    const [horaElegida, setHoraElegida] = useState(null);
    const [notas, setNotas] = useState(''); // Estado para las notas del paciente
    const [cargando, setCargando] = useState(false);
    
    const navigate = useNavigate(); // Para redirigir al usuario después de agendar

    // Este efecto se dispara cada vez que el paciente cambia la fecha
    useEffect(() => {
        if (fechaSeleccionada) {
            cargarDisponibilidad(fechaSeleccionada);
            setHoraElegida(null); // Reseteamos la hora si cambia de día
        }
    }, [fechaSeleccionada]);

    const cargarDisponibilidad = async (fecha) => {
        setCargando(true);
        try {
            const horas = await turnoService.obtenerDisponibilidad(fecha);
            setHorasLibres(horas);
        } catch (error) {
            console.error("Error cargando disponibilidad:", error);
            setHorasLibres([]);
        } finally {
            setCargando(false);
        }
    };

    const handleReservar = async () => {
        if (!fechaSeleccionada || !horaElegida) return;

        // Aquí armas el objeto igualito a tu TurnoCreateRequest de Java
        const nuevoTurno = {
            fecha: `${fechaSeleccionada}T${horaElegida}:00`, // Formato LocalDateTime
            cliente: "Paciente", // Si tu backend lo saca del token JWT, este dato es de relleno
            servicioId: 1, // ID del servicio (Si tienes varios, luego puedes hacer un select)
            notas: notas || "Sin notas"
        };

        try {
            await turnoService.crearTurno(nuevoTurno);
            alert("¡Turno reservado con éxito! 🎉");
            
            // Lo mandamos a la pantalla principal para que vea sus turnos actualizados
            navigate("/"); 
            
        } catch (error) {
            console.error("Error al guardar el turno:", error); 
            alert("Uy, parece que alguien te ganó ese lugar o hubo un error. Intenta con otro.");
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '25px' }}>🗓️ Reserva tu Turno</h2>
            
            {/* 1. Selector de Fecha */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>1. Selecciona un día:</label>
                <input 
                    type="date" 
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    min={new Date().toISOString().split("T")[0]} // 🚀 Bloquea las fechas pasadas
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                />
            </div>

            {/* 2. Grilla de Horas */}
            {cargando ? (
                <p style={{ textAlign: 'center', color: '#666' }}>Buscando horarios mágicos... 🪄</p>
            ) : (
                fechaSeleccionada && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>2. Selecciona un horario:</label>
                        {horasLibres.length === 0 ? (
                            <p style={{ color: '#dc3545', fontWeight: 'bold' }}>El médico no atiende este día o ya está todo ocupado.</p>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {horasLibres.map((hora) => (
                                    <button 
                                        key={hora}
                                        onClick={() => setHoraElegida(hora)}
                                        style={{
                                            padding: '10px 20px',
                                            cursor: 'pointer',
                                            backgroundColor: horaElegida === hora ? '#28a745' : '#f0f0f0',
                                            color: horaElegida === hora ? 'white' : 'black',
                                            border: '1px solid #ccc',
                                            borderRadius: '5px',
                                            fontWeight: 'bold',
                                            transition: '0.2s'
                                        }}
                                    >
                                        {hora}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )
            )}

            {/* 3. Notas (Aparece solo si eligió hora) */}
            {horaElegida && (
                <div style={{ marginBottom: '25px' }}>
                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>3. Notas o motivo (Opcional):</label>
                    <textarea 
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Ej: Primera consulta, dolor de espalda..."
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '80px' }}
                    />
                </div>
            )}

            {/* 4. Botón de Confirmación */}
            {horaElegida && (
                <button 
                    onClick={handleReservar}
                    style={{ 
                        padding: '15px 24px', 
                        backgroundColor: '#007BFF', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: 'pointer', 
                        width: '100%',
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                    }}
                >
                    Confirmar Turno a las {horaElegida}
                </button>
            )}
        </div>
    );
};

export default AgendarTurno;