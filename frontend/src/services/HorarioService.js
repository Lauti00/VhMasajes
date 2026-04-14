import axios from 'axios';
import API_URL from "../config/api";

fetch(`${API_URL}/api/horarios`)
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const horarioService = {
    // Trae la configuración actual de la base de datos
    obtenerHorarios: async () => {
        try {
            const response = await axios.get(API_URL, { headers: getAuthHeaders() });
            return response.data;
        } catch (error) {
            console.error("Error al obtener horarios", error);
            return [];
        }
    },

    // Envía la nueva configuración para guardarla
    guardarHorarios: async (horarios) => {
        try {
            const response = await axios.post(API_URL, horarios, { headers: getAuthHeaders() });
            return response.data;
        } catch (error) {
            console.error("Error al guardar horarios", error);
            throw error;
        }
    }
};