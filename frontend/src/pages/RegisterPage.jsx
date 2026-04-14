import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './AuthPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    passwordConfirm: '',
    telefono: ''
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validar campos
    if (!formData.nombre || !formData.email || !formData.password || !formData.passwordConfirm) {
      setLocalError('Completa todos los campos requeridos');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      await register(
        formData.nombre,
        formData.email,
        formData.password,
        formData.passwordConfirm,
        formData.telefono
      );
      navigate('/');
    } catch (err) {
      setLocalError(err.message || 'Error al registrarse');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>📅 Gestión de Turnos</h1>
        <h2>Crear Cuenta</h2>

        {(error || localError) && (
          <div className="error-message">
            <span>⚠️ {error || localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Contraseña:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña:</label>
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Teléfono (opcional):</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+54 9 11 0000-0000"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '🔄 Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-link">
          ¿Ya tienes cuenta? <a href="/login">Iniciar Sesión</a>
        </p>
      </div>
    </div>
  );
}
