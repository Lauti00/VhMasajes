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

  const cargarDatos = useCallback(async () => {

    if (!token) return;

    try {
      setLoading(true);
      setErrorMsg("");

      // =====================
      // STATS
      // =====================
      const resStats = await fetch(`${API_URL}/admin/turnos/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resStats.ok) throw new Error("Error stats");

      const dataStats = await resStats.json();

      setStats({
        ganancias: dataStats.ganancias || 0,
        totalTurnos: dataStats.totalTurnos || 0,
        ausencias: dataStats.ausencias || 0
      });

      // =====================
      // TURNOS
      // =====================
      const resTurnos = await fetch(`${API_URL}/admin/turnos`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!resTurnos.ok) throw new Error("Error turnos");

      const dataTurnos = await resTurnos.json();

      setTurnos(Array.isArray(dataTurnos) ? dataTurnos : []);

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }

  }, [token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const actualizarEstado = async (id, nuevoEstado) => {

    await fetch(`${API_URL}/admin/turnos/${id}/estado?nuevoEstado=${nuevoEstado}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    cargarDatos();
  };

  if (loading) return <p>Cargando...</p>;

  return <div>{/* tu UI intacta */}</div>;
}