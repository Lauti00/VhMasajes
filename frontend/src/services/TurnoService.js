import axios from 'axios';

// 🚀 Ajustado al puerto 8083 que usas en tu backend
const API_URL = `${import.meta.env.VITE_API_URL || ''}/api/turnos`;

// Función auxiliar para adjuntar el token de seguridad automáticamente
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const turnoService = {
    
    // 1. Busca las horas libres para un día específico
    obtenerDisponibilidad: async (fecha, servicioId) => {
        try {
            const response = await axios.get(`${API_URL}/disponibilidad/${fecha}`, {
                params: { servicioId }, headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error("Error al obtener disponibilidad", error);
            return [];
        }
    },

    // 2. Envía la petición para guardar el turno
    crearTurno: async (datosTurno) => {
        const response = await axios.post(API_URL, datosTurno, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    // 3. Trae la lista de todos los turnos (Exclusivo para Admin)
    obtenerTodos: async () => {
        try {
            // Fíjate cómo la función ahora sí está DENTRO del objeto
            const response = await axios.get(`${API_URL.replace('/api/turnos', '/api/admin/turnos')}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error("Error al obtener todos los turnos", error);
            return [];
        }
    }
};
