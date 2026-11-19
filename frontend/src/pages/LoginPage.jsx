import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './AuthPage.css';

const destinoSeguro = destino => destino?.startsWith('/') && !destino.startsWith('//') ? destino : '/';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Completa todos los campos');
      return;
    }

    try {
      await login(email, password);
      navigate(destinoSeguro(searchParams.get('next')));
    } catch (err) {
      setLocalError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-layout">
        <aside className="auth-brand-panel">
          <Link className="auth-brand" to="/reservar"><span className="auth-brand-mark" aria-hidden="true">VH</span><span>VH MASAJES</span></Link>
          <div className="auth-brand-copy"><span>BIENESTAR Y CUIDADO PERSONAL</span><h1>Un momento para volver a vos.</h1><p>Reservá tu espacio de bienestar con atención cercana y tratamientos pensados para vos.</p></div>
          <div className="auth-brand-foot">Atención personalizada · VH Masajes</div>
        </aside>
        <main className="auth-content">
        <div className="auth-card">
        <div className="auth-mobile-brand">VH MASAJES</div>
        <span className="auth-eyebrow">TU ESPACIO PERSONAL</span>
        <h2>Iniciar sesión</h2>
        <p className="auth-description">Accedé para consultar y gestionar tus turnos.</p>

        {(error || localError) && (
          <div className="error-message" role="alert">
            <span>{error || localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '🔄 Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="auth-link">¿Querés reservar una sesión? <Link to="/reservar">Elegí tu turno sin crear una cuenta</Link></p>
      </div>
        </main>
      </div>
    </div>
  );
}
