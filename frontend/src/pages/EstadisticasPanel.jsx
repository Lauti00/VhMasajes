import React, { useEffect, useState } from 'react';
import { useAuth } from "../context/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const API_URL = "http://localhost:8083";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#84d887'];

export default function EstadisticasPanel() {

  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const cargarEstadisticas = async () => {

      try {

        console.log("🔑 Token actual:", token ? "Existe (OK)" : "No existe");

        const response = await fetch(
          `${API_URL}/api/admin/stats/dashboard`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            }
          }
        );

        console.log("📡 Status Response:", response.status);

        // Si el backend devuelve error
        if (!response.ok) {

          const textoError = await response.text();

          console.error("❌ Error backend:", textoError);

          throw new Error(`Error ${response.status}`);
        }

        const json = await response.json();

        console.log("📦 Datos recibidos:", json);

        setData(json);
        setError(false);

      } catch (err) {

        console.error("❌ Error cargando stats:", err);

        setError(true);

      } finally {

        setLoading(false);
      }
    };

    if (token) {
      cargarEstadisticas();
    }

  }, [token]);

  // Loading
  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        fontSize: '1.1rem'
      }}>
        ⏳ Cargando estadísticas profesionales...
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div style={{
        padding: '20px',
        color: '#721c24',
        backgroundColor: '#f8d7da',
        borderRadius: '8px',
        border: '1px solid #f5c6cb'
      }}>
        ⚠️ Error al cargar las estadísticas.

        <br /><br />

        Posibles causas:
        <ul>
          <li>El backend no está corriendo</li>
          <li>El endpoint no existe</li>
          <li>No hay datos cargados en la BD</li>
          <li>El token JWT expiró</li>
          <li>El backend lanzó una excepción interna</li>
        </ul>

        Revisá la consola del backend para ver el error real.
      </div>
    );
  }

  // Sin datos
  if (!data) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px'
      }}>
        ⚠️ No llegaron datos del backend.
      </div>
    );
  }

  return (

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '25px',
        marginTop: '20px'
      }}
    >

      {/* GANANCIAS */}
      <div style={cardStyle}>

        <h3 style={titleStyle}>
          💰 Ganancias Mensuales
        </h3>

        <div style={{ width: '100%', height: 300 }}>

          <ResponsiveContainer width="100%" height="100%">

            <BarChart data={data?.gananciasMensuales || []}>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip cursor={{ fill: '#f0f0f0' }} />

              <Bar
                dataKey="total"
                fill="#0d6efd"
                radius={[5, 5, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* SERVICIOS */}
      <div style={cardStyle}>

        <h3 style={titleStyle}>
          🎯 Popularidad de Servicios
        </h3>

        <div style={{ width: '100%', height: 300 }}>

          <ResponsiveContainer width="100%" height="100%">

            <PieChart>

              <Pie
                data={data?.popularidadServicios || []}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={5}
              >

                {(data?.popularidadServicios || []).map((_, index) => (

                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />

                ))}

              </Pie>

              <Tooltip />

              <Legend
                verticalAlign="bottom"
                height={36}
              />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}

// ============================
// ESTILOS
// ============================

const cardStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '15px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  border: '1px solid #eaeaea'
};

const titleStyle = {
  marginTop: 0,
  marginBottom: '20px',
  fontSize: '1.1rem',
  color: '#333',
  borderBottom: '1px solid #eee',
  paddingBottom: '10px'
};