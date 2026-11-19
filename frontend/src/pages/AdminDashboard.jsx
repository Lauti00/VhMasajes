import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/useAuth";
import API_URL from "../config/api";

export default function AdminDashboard() {
  const { token } = useAuth();

  const [stats, setStats] = useState({
    ganancias: 0,
    totalTurnos: 0,
    ausencias: 0
  });

  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [linkCopiado, setLinkCopiado] = useState(false);

  // ESTADOS PARA EL MODAL DE EDICIÓN
  const [showModal, setShowModal] = useState(false);
  const [turnoEdit, setTurnoEdit] = useState({
    id: null,
    fecha: "",
    servicio: "",
    precio: 0
  });

  // =========================================
  // CARGAR DATOS
  // =========================================
  const cargarDatos = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setErrorMsg("");

      // STATS
      const resStats = await fetch(`${API_URL}/api/admin/turnos/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resStats.ok) throw new Error("Error al obtener estadísticas");
      const dataStats = await resStats.json();
      setStats({
        ganancias: dataStats.ganancias || 0,
        totalTurnos: dataStats.totalTurnos || 0,
        ausencias: dataStats.ausencias || 0
      });

      // TURNOS
      const resTurnos = await fetch(`${API_URL}/api/admin/turnos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resTurnos.ok) throw new Error("Error al obtener turnos");
      const dataTurnos = await resTurnos.json();
      setTurnos(Array.isArray(dataTurnos) ? dataTurnos : []);

    } catch (err) {
      console.error("❌ Error cargando dashboard:", err);
      setErrorMsg(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // =========================================
  // ACTUALIZAR ESTADO
  // =========================================
  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      const res = await fetch(
        `${API_URL}/api/admin/turnos/${id}/estado?nuevoEstado=${nuevoEstado}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (!res.ok) throw new Error("No se pudo actualizar");
      await cargarDatos();
      alert("✅ Estado actualizado");
    } catch (err) {
      console.error(err);
      alert("❌ Error al actualizar");
    }
  };

  // =========================================
  // ELIMINAR TURNO
  // =========================================
  const eliminarTurno = async (id) => {
    const confirmar = window.confirm("¿Seguro que deseas eliminar este turno definitivamente?");
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/turnos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("No se pudo eliminar");
      await cargarDatos();
      alert("✅ Turno eliminado");
    } catch (err) {
      console.error(err);
      alert("❌ Error al eliminar");
    }
  };

  // =========================================
  // EDITAR TURNO (ABRIR MODAL Y GUARDAR)
  // =========================================
  const abrirModalEditar = (turno) => {
    // Formateamos la fecha para el input datetime-local (YYYY-MM-DDTHH:mm)
    const fechaFormateada = new Date(turno.fecha).toISOString().slice(0, 16);
    setTurnoEdit({
      id: turno.id,
      fecha: fechaFormateada,
      servicio: turno.servicio,
      precio: turno.precio
    });
    setShowModal(true);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/turnos/${turnoEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(turnoEdit)
      });

      if (!res.ok) throw new Error("No se pudo editar el turno");
      await cargarDatos();
      setShowModal(false);
      alert("✅ Turno editado exitosamente");
    } catch (err) {
      console.error(err);
      alert("❌ Error al editar el turno");
    }
  };

  // =========================================
  // EXPORTAR CSV
  // =========================================
  const exportarExcel = () => {
    const headers = ["Fecha", "Cliente", "Servicio", "Precio", "Estado"];
    const rows = turnos.map(t => [
      new Date(t.fecha).toLocaleString(),
      t.cliente,
      t.servicio,
      t.precio,
      t.estado
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const copiarLinkReserva = async () => {
    const link = `${window.location.origin}/reservar`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopiado(true);
      window.setTimeout(() => setLinkCopiado(false), 2500);
    } catch {
      window.prompt("Copiá este link para compartirlo con tus pacientes:", link);
    }
  };

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>⏳ Cargando panel...</div>;
  }

  return (
    <div style={{ padding: "30px", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {errorMsg && (
        <div style={{ backgroundColor: "#f8d7da", color: "#721c24", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
          {errorMsg}
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <h1>Panel de Administración</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={copiarLinkReserva} style={{ backgroundColor: "#405b48", color: "white", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            {linkCopiado ? "✓ Link copiado" : "🔗 Copiar link para reservar"}
          </button>
          <button onClick={exportarExcel} style={{ backgroundColor: "#198754", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
            📥 Descargar CSV
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))", gap: "20px", marginBottom: "30px" }}>
        <Card titulo="Ganancias" valor={`$${Number(stats.ganancias).toLocaleString()}`} color="#0d6efd" />
        <Card titulo="Atendidos" valor={stats.totalTurnos} color="#198754" />
        <Card titulo="Ausencias" valor={stats.ausencias} color="#dc3545" />
      </div>

      {/* TABLA */}
      <div style={{ backgroundColor: "white", borderRadius: "10px", padding: "20px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Servicio</th>
              <th style={thStyle}>Precio</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdStyle}>{new Date(t.fecha).toLocaleString()}</td>
                <td style={tdStyle}>{t.cliente}</td>
                <td style={tdStyle}>{t.servicio}</td>
                <td style={tdStyle}>${t.precio}</td>
                <td style={tdStyle}><span style={badgeStyle(t.estado)}>{t.estado}</span></td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                    {t.estado === "PENDIENTE" && (
                      <>
                        <button onClick={() => actualizarEstado(t.id, "ATENDIDO")} style={btn("#198754")}>Atendido</button>
                        <button onClick={() => actualizarEstado(t.id, "AUSENTE")} style={btn("#dc3545")}>Ausente</button>
                        <button onClick={() => actualizarEstado(t.id, "CANCELADO")} style={btn("#6c757d")}>Cancelar</button>
                      </>
                    )}
                    {/* NUEVO BOTON EDITAR */}
                    <button onClick={() => abrirModalEditar(t)} style={btn("#0d6efd")}>Editar</button>
                    <button onClick={() => eliminarTurno(t.id)} style={btn("#000")}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDICIÓN */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2>Editar Turno</h2>
            <form onSubmit={guardarEdicion} style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  value={turnoEdit.fecha} 
                  onChange={(e) => setTurnoEdit({...turnoEdit, fecha: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Servicio</label>
                <input 
                  type="text" 
                  value={turnoEdit.servicio} 
                  onChange={(e) => setTurnoEdit({...turnoEdit, servicio: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Precio ($)</label>
                <input 
                  type="number" 
                  value={turnoEdit.precio} 
                  onChange={(e) => setTurnoEdit({...turnoEdit, precio: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{...btn("#6c757d"), padding: "10px 15px"}}>Cancelar</button>
                <button type="submit" style={{...btn("#198754"), padding: "10px 15px"}}>Guardar Cambios</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// =========================================
// COMPONENTE CARD
// =========================================
function Card({ titulo, valor, color }) {
  return (
    <div style={{ backgroundColor: "white", borderLeft: `6px solid ${color}`, padding: "20px", borderRadius: "10px" }}>
      <div style={{ color: "#666", marginBottom: "10px" }}>{titulo}</div>
      <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{valor}</div>
    </div>
  );
}

// =========================================
// ESTILOS
// =========================================
const thStyle = { padding: "15px", textAlign: "left" };
const tdStyle = { padding: "15px" };

const badgeStyle = estado => ({
  backgroundColor: estado === "ATENDIDO" ? "#198754" : estado === "AUSENTE" ? "#dc3545" : estado === "CANCELADO" ? "#6c757d" : "#0d6efd",
  color: "white", padding: "5px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold"
});

const btn = bg => ({
  backgroundColor: bg, color: "white", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem"
});

// Estilos para el Modal
const modalOverlayStyle = {
  position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "400px", maxWidth: "90%"
};

const inputStyle = {
  width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box"
};
