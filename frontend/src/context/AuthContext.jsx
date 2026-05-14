import { createContext, useState, useCallback } from "react";

import API_URL from "../config/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // =========================
  // REGISTER
  // =========================
  const register = useCallback(async (nombre, email, password, passwordConfirm, telefono) => {
    setLoading(true);
    setError(null);

    try {
      //  Ruta completa escrita a mano asegurando que incluye "/api"
      const res = await fetch("https://vhmasajes.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, passwordConfirm, telefono })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error en registro");

      setToken(data.token);
      setUser(data.usuario);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.usuario));

      return data;

    } catch (err) {
      setError(err.message);
      throw err;

    } finally {
      setLoading(false);
    }
  }, []);

  // =========================
  // LOGIN
  // =========================
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      //  Ruta completa escrita a mano asegurando que incluye "/api"
      const res = await fetch("https://vhmasajes.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error en login");

      setToken(data.token);
      setUser(data.usuario);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.usuario));

      return data;

    } catch (err) {
      setError(err.message);
      throw err;

    } finally {
      setLoading(false);
    }
  }, []);

  // =========================
  // LOGOUT
  // =========================
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      isAuthenticated: !!token,
      hasRole: (role) => user?.rol === role
    }}>
      {children}
    </AuthContext.Provider>
  );
}