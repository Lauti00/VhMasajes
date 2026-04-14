import React, { useEffect, useState } from 'react';
import { useAuth } from "../context/useAuth";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#84d887'];

export default function EstadisticasPanel() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8083/api/admin/stats/dashboard", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error("Error en el servidor");
      return res.json();
    })
    .then(json => {
      setData(json);
      setError(false);
    })
    .catch(err => {
      console.error("Error cargando stats:", err);
      setError(true);
    });
  }, [token]);

  if (error) return (
    <div style={{ padding: '20px', color: '#721c24', backgroundColor: '#f8d7da', borderRadius: '8px' }}>
      ⚠️ Error al cargar las estadísticas. Asegurate de que el Backend esté corriendo y tengas turnos cargados.
    </div>
  );

  if (!data) return <p style={{ textAlign: 'center', padding: '20px' }}>Cargando estadísticas profesionales...</p>;

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
      gap: '25px',
      marginTop: '20px' 
    }}>
      
      {/* Gráfico de Barras - Ganancias */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>💰 Ganancias Mensuales</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.gananciasMensuales || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{fill: '#f0f0f0'}} />
              <Bar dataKey="total" fill="#0d6efd" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Torta - Servicios */}
      <div style={cardStyle}>
        <h3 style={titleStyle}>🎯 Popularidad de Servicios</h3>
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Estilos rápidos para que se vea bien
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