import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/useAuth";
import "./AdminServicios.css"; 

export default function AdminServicios() {
  const { token } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [nuevoServicio, setNuevoServicio] = useState({
    nombre: "",
    descripcion: "",
    duracionMinutos: 60,
    precio: 0
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

  const cargarServicios = useCallback(async () => {
    if (!token) return; // Seguridad: no pedir si no hay token
    try {
      const res = await fetch("http://localhost:8083/api/servicios", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "No se pudieron cargar los servicios");
      }
      
      const data = await res.json();
      setServicios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error en cargarServicios:", error);
      setMensaje({ 
        texto: error instanceof Error ? error.message : "Error de conexión con el servidor", 
        tipo: "error" 
      });
    }
  }, [token]);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ texto: "", tipo: "" });

    try {
      // 🚨 Validación básica antes de enviar
      if (nuevoServicio.precio <= 0) throw new Error("El precio debe ser mayor a 0");

      const res = await fetch("http://localhost:8083/api/servicios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(nuevoServicio)
      });

      if (!res.ok) {
        // Intentar capturar el mensaje de error del backend (Spring)
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.message || "Error al crear servicio. ¿Sos ADMIN?");
      }

      setMensaje({ texto: "✅ Servicio creado con éxito", tipo: "success" });
      setNuevoServicio({ nombre: "", descripcion: "", duracionMinutos: 60, precio: 0 });
      cargarServicios();
    } catch (error) {
      setMensaje({ 
        texto: "❌ " + (error instanceof Error ? error.message : "Error desconocido"), 
        tipo: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const eliminarServicio = async (id) => {
    if (!window.confirm("¿Seguro que querés eliminar este servicio?")) return;
    
    try {
      const res = await fetch(`http://localhost:8083/api/servicios/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("No se pudo eliminar el servicio");

      setMensaje({ texto: "Servicio eliminado", tipo: "success" });
      cargarServicios();
    } catch (error) {
      setMensaje({ texto: "Error al eliminar: " + error.message, tipo: "error" });
    }
  };

  return (
    <div className="admin-container" style={{ padding: '20px' }}>
      <h2>🛠️ Gestión de Servicios (Admin)</h2>
      
      {mensaje.texto && (
        <div className={`message ${mensaje.tipo}`} style={{
          padding: '10px', 
          marginBottom: '10px',
          backgroundColor: mensaje.tipo === 'success' ? '#d4edda' : '#f8d7da',
          color: mensaje.tipo === 'success' ? '#155724' : '#721c24',
          borderRadius: '5px',
          border: `1px solid ${mensaje.tipo === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {mensaje.texto}
        </div>
      )}
      
      <div className="form-card" style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px', backgroundColor: '#fff' }}>
        <h3>Agregar Nuevo Servicio</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="text" placeholder="Nombre (ej: Masaje Relajante)" 
            className="input-field"
            value={nuevoServicio.nombre} 
            onChange={e => setNuevoServicio({...nuevoServicio, nombre: e.target.value})}
            required 
          />
          <input 
            type="number" placeholder="Precio ($)" 
            className="input-field"
            value={nuevoServicio.precio} 
            onChange={e => setNuevoServicio({...nuevoServicio, precio: Number(e.target.value)})}
            required 
          />
          <input 
            type="number" placeholder="Duración (minutos)" 
            className="input-field"
            value={nuevoServicio.duracionMinutos} 
            onChange={e => setNuevoServicio({...nuevoServicio, duracionMinutos: Number(e.target.value)})}
            required 
          />
          <button type="submit" disabled={loading} style={{ 
            cursor: loading ? 'not-allowed' : 'pointer', 
            padding: '10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? "Guardando..." : "Añadir al Catálogo"}
          </button>
        </form>
      </div>

      {/* Tabla igual a la anterior pero con manejo de carga */}
      <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f4f4f4' }}>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Nombre</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Precio</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Duración</th>
                <th style={{ border: '1px solid #ddd', padding: '12px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map(s => (
                <tr key={s.id}>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{s.nombre}</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>${s.precio}</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px' }}>{s.duracionMinutos} min</td>
                  <td style={{ border: '1px solid #ddd', padding: '10px', textAlign: 'center' }}>
                    <button 
                      onClick={() => eliminarServicio(s.id)}
                      style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );
}