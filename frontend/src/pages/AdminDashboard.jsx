import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/useAuth";

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ ganancias: 0, totalTurnos: 0, ausencias: 0 });
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      // 1. Petición de estadísticas (Ruta actualizada)
      const resStats = await fetch("http://localhost:8083/api/admin/turnos/stats", {        
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      // Validamos si la respuesta es correcta antes de parsear
      if (!resStats.ok) throw new Error("Error al obtener estadísticas");
      const dataStats = await resStats.json();
      setStats({
        ganancias: dataStats.ganancias || 0,
        totalTurnos: dataStats.totalTurnos || 0,
        ausencias: dataStats.ausencias || 0
      });

      // 2. Petición de todos los turnos (Ruta actualizada)
      const resTurnos = await fetch("http://localhost:8083/api/admin/turnos", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!resTurnos.ok) throw new Error("Error al obtener lista de turnos");
      const dataTurnos = await resTurnos.json();
      setTurnos(Array.isArray(dataTurnos) ? dataTurnos : []);

    } catch (error) {
      console.error("Error cargando dashboard:", error);
      setErrorMsg(error instanceof Error ? error.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      // Importante: El nombre del parámetro '?nuevoEstado' debe coincidir con @RequestParam en tu Java
      // (Ruta actualizada)
      const res = await fetch(`http://localhost:8083/api/admin/turnos/${id}/estado?nuevoEstado=${nuevoEstado}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudo actualizar el estado");
      }

      // Si todo sale bien, recargamos los datos
      await cargarDatos(); 
      alert("✅ Estado actualizado correctamente");
      
    } catch (error) {
      alert("❌ " + (error instanceof Error ? error.message : "Error al actualizar"));
    }
  };

  const exportarExcel = () => {
    const headers = ["Fecha", "Cliente", "Servicio", "Precio ($)", "Estado"];
    const rows = turnos.map(t => [
      new Date(t.fecha).toLocaleString(),
      t.cliente,
      t.servicio?.nombre || "N/A",
      t.precioCobrado,
      t.estado
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Cargando panel de control...</div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {errorMsg && (
        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <b>Error:</b> {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#333', margin: 0 }}>Panel de Administración</h1>
        <button 
          onClick={exportarExcel}
          style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          📥 Descargar Excel (CSV)
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={cardStyle('#e3f2fd', '#0d47a1')}>
          <span style={labelStyle}>Ganancias Totales</span>
          <div style={valueStyle}>${Number(stats.ganancias).toLocaleString()}</div>
        </div>
        <div style={cardStyle('#e8f5e9', '#1b5e20')}>
          <span style={labelStyle}>Pacientes Atendidos</span>
          <div style={valueStyle}>{stats.totalTurnos}</div>
        </div>
        <div style={cardStyle('#fff3e0', '#e65100')}>
          <span style={labelStyle}>Citas con Ausencia</span>
          <div style={valueStyle}>{stats.ausencias}</div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <h2 style={{ marginBottom: '20px', color: '#555' }}>Gestión de Pacientes</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Paciente</th>
              <th style={thStyle}>Servicio</th>
              <th style={thStyle}>Precio</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnos.length > 0 ? turnos.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdStyle}>{new Date(t.fecha).toLocaleDateString()} {new Date(t.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td style={tdStyle}><b>{t.cliente}</b></td>
                <td style={tdStyle}>{t.servicio?.nombre || "Sin servicio"}</td>
                <td style={tdStyle}>${t.precioCobrado || 0}</td>
                <td style={tdStyle}>
                  <span style={badgeStyle(t.estado)}>{t.estado}</span>
                </td>
                <td style={tdStyle}>
                  {t.estado === 'PENDIENTE' && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => actualizarEstado(t.id, 'ATENDIDO')} style={btnAction('#28a745')}>Vino</button>
                      <button onClick={() => actualizarEstado(t.id, 'AUSENTE')} style={btnAction('#dc3545')}>Faltó</button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No hay turnos para mostrar.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Estilos ---
const cardStyle = (bg, color) => ({
  backgroundColor: bg,
  color: color,
  padding: '25px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
});
const labelStyle = { fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.8 };
const valueStyle = { fontSize: '2.2rem', fontWeight: 'bold', marginTop: '10px' };
const thStyle = { padding: '15px 10px', color: '#666' };
const tdStyle = { padding: '15px 10px' };
const badgeStyle = (estado) => ({
    backgroundColor: estado === 'ATENDIDO' ? '#28a745' : estado === 'AUSENTE' ? '#dc3545' : '#007bff',
    color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
});
const btnAction = (bg) => ({
    backgroundColor: bg, color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem'
});