import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import API_URL from '../config/api';
import './AuthPage.css';

export default function CambiarPassword() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async event => {
    event.preventDefault();
    setError('');
    if (passwordNuevo.length < 12) { setError('La nueva contraseña debe tener al menos 12 caracteres.'); return; }
    if (passwordNuevo !== passwordConfirmacion) { setError('Las contraseñas nuevas no coinciden.'); return; }
    setGuardando(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ passwordActual, passwordNuevo, passwordConfirmacion })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'No se pudo cambiar la contraseña.');
      navigate('/', { state: { passwordActualizada: true } });
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  return <div className="auth-container"><main className="auth-card">
    <h1>VH Masajes</h1><h2>Cambiar contraseña</h2>
    {error && <div className="error-message" role="alert">{error}</div>}
    <form onSubmit={guardar}>
      <div className="form-group"><label htmlFor="actual">Contraseña actual</label><input id="actual" type="password" autoComplete="current-password" value={passwordActual} onChange={e => setPasswordActual(e.target.value)} required /></div>
      <div className="form-group"><label htmlFor="nueva">Nueva contraseña</label><input id="nueva" type="password" autoComplete="new-password" minLength={12} maxLength={72} value={passwordNuevo} onChange={e => setPasswordNuevo(e.target.value)} required /><small>Usá al menos 12 caracteres.</small></div>
      <div className="form-group"><label htmlFor="confirmar">Repetí la nueva contraseña</label><input id="confirmar" type="password" autoComplete="new-password" minLength={12} maxLength={72} value={passwordConfirmacion} onChange={e => setPasswordConfirmacion(e.target.value)} required /></div>
      <button className="btn-primary" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Actualizar contraseña'}</button>
    </form>
    <p className="auth-link"><Link to="/">Volver a la agenda</Link></p>
  </main></div>;
}
