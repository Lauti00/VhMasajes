// En desarrollo se usa el proxy de Vite; en producción se define VITE_API_URL.
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export default API_URL;
