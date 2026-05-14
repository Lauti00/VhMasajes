import axios from 'axios';
import API_URL from "../config/api";

// Endpoint correcto del backend
const HORARIOS_URL = `${API_URL}/api/horarios`;

// Headers con JWT
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');

    return token
        ? {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
        : {
            'Content-Type': 'application/json'
        };
};

export const horarioService = {

    // Obtener horarios desde backend
    obtenerHorarios: async () => {
        try {

            console.log("📡 Consultando horarios en:", HORARIOS_URL);

            const response = await axios.get(
                HORARIOS_URL,
                {
                    headers: getAuthHeaders()
                }
            );

            console.log("📦 Respuesta horarios:", response.data);

            return response.data;

        } catch (error) {

            console.error("❌ Error al obtener horarios:", error);

            return [];
        }
    },

    // Guardar horarios
    guardarHorarios: async (horarios) => {
        try {

            console.log("📤 Enviando horarios:", horarios);

            const response = await axios.post(
                HORARIOS_URL,
                horarios,
                {
                    headers: getAuthHeaders()
                }
            );

            console.log("✅ Horarios guardados:", response.data);

            return response.data;

        } catch (error) {

            console.error("❌ Error al guardar horarios:", error);

            throw error;
        }
    }
};