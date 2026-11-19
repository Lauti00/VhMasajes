import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { useAuth } from '../context/useAuth';
import './ReservaPublica.css';

const hoyLocal = () => {
  const hoy = new Date();
  hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
  return hoy.toISOString().slice(0, 10);
};

export default function ReservaPublica() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const servicio = useMemo(() => servicios.find(s => String(s.id) === servicioId), [servicios, servicioId]);

  useEffect(() => {
    const pendiente = sessionStorage.getItem('reservaPendiente');
    if (pendiente) {
      try {
        const reserva = JSON.parse(pendiente);
        setServicioId(String(reserva.servicioId || ''));
        setFecha(reserva.fecha || '');
        setHora(reserva.hora || '');
        setNotas(reserva.notas || '');
      } catch {
        sessionStorage.removeItem('reservaPendiente');
      }
    }

    fetch(`${API_URL}/api/servicios`)
      .then(res => { if (!res.ok) throw new Error('No pudimos cargar los servicios.'); return res.json(); })
      .then(data => {
        const lista = Array.isArray(data) ? data : [];
        setServicios(lista);
        setServicioId(actual => actual || (lista.length ? String(lista[0].id) : ''));
      })
      .catch(err => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!fecha || !servicioId) { setHorarios([]); return; }
    const controller = new AbortController();
    fetch(`${API_URL}/api/turnos/disponibilidad/${fecha}?servicioId=${servicioId}`, { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error('No pudimos consultar la disponibilidad.'); return res.json(); })
      .then(data => setHorarios(Array.isArray(data) ? data : []))
      .catch(err => { if (err.name !== 'AbortError') { setHorarios([]); setError(err.message); } });
    return () => controller.abort();
  }, [fecha, servicioId]);

  const confirmar = async () => {
    setError('');
    if (!servicioId || !fecha || !hora) { setError('Elegí un servicio, un día y un horario.'); return; }
    const reserva = { servicioId: Number(servicioId), fecha, hora, notas };
    if (!isAuthenticated) {
      sessionStorage.setItem('reservaPendiente', JSON.stringify(reserva));
      navigate('/register?next=/reservar');
      return;
    }

    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/turnos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fecha: `${fecha}T${hora.length === 5 ? `${hora}:00` : hora}`, servicioId: reserva.servicioId, notas })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Ese horario ya no está disponible. Elegí otro.');
      sessionStorage.removeItem('reservaPendiente');
      navigate('/', { state: { reservaConfirmada: true } });
    } catch (err) {
      setError(err.message || 'No se pudo confirmar el turno.');
      if (fecha && servicioId) {
        fetch(`${API_URL}/api/turnos/disponibilidad/${fecha}?servicioId=${servicioId}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => setHorarios(Array.isArray(data) ? data : []));
      }
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <main className="booking-shell"><p className="booking-muted">Cargando opciones…</p></main>;

  return (
    <main className="booking-shell">
      <header className="booking-header">
        <Link className="booking-brand" to="/">VH <span>masajes</span></Link>
        <Link className="booking-login" to={isAuthenticated ? '/' : '/login?next=/reservar'}>
          {isAuthenticated ? 'Mis turnos' : 'Iniciar sesión'}
        </Link>
      </header>
      <section className="booking-intro">
        <span className="booking-eyebrow">UN MOMENTO PARA VOS</span>
        <h1>Reservá tu turno</h1>
        <p>Elegí el tratamiento y el horario que mejor te quede.</p>
      </section>

      <section className="booking-card">
        {error && <div className="booking-error" role="alert">{error}</div>}
        {servicios.length === 0 ? (
          <div className="booking-empty"><strong>Por ahora no hay servicios disponibles.</strong><span>Volvé a consultar más tarde.</span></div>
        ) : (
          <>
            <label className="booking-label" htmlFor="servicio">Servicio</label>
            <select id="servicio" className="booking-input" value={servicioId} onChange={e => { setServicioId(e.target.value); setHora(''); }}>
              {servicios.map(item => <option key={item.id} value={item.id}>{item.nombre} · ${Number(item.precio).toLocaleString('es-AR')} · {item.duracionMinutos} min</option>)}
            </select>
            {servicio?.descripcion && <p className="booking-description">{servicio.descripcion}</p>}

            <label className="booking-label" htmlFor="fecha">Día</label>
            <input id="fecha" className="booking-input" type="date" min={hoyLocal()} value={fecha} onChange={e => { setFecha(e.target.value); setHora(''); }} />

            {fecha && <>
              <span className="booking-label">Horarios disponibles</span>
              {horarios.length ? <div className="booking-slots">
                {horarios.map(slot => <button type="button" key={slot} className={`booking-slot ${hora === slot ? 'selected' : ''}`} onClick={() => setHora(slot)}>{slot.slice(0, 5)}</button>)}
              </div> : <p className="booking-muted">No encontramos horarios para ese día. Probá con otra fecha.</p>}
            </>}

            <label className="booking-label" htmlFor="notas">¿Querés contarnos algo? <span>(opcional)</span></label>
            <textarea id="notas" className="booking-input booking-notes" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Por ejemplo, si es tu primera sesión…" maxLength={500} />

            {servicio && fecha && hora && <div className="booking-summary">
              <span>{servicio.nombre} · {new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} a las {hora.slice(0, 5)}</span>
              <strong>${Number(servicio.precio).toLocaleString('es-AR')}</strong>
            </div>}
            <button className="booking-submit" type="button" onClick={confirmar} disabled={!fecha || !hora || guardando}>
              {guardando ? 'Confirmando…' : isAuthenticated ? 'Confirmar turno' : 'Continuar para registrarme'}
            </button>
            {!isAuthenticated && <p className="booking-footnote">Para finalizar, vas a crear una cuenta gratuita. El horario se confirma al completar la reserva.</p>}
          </>
        )}
      </section>
      <footer className="booking-footer">VH Masajes · Atención personalizada</footer>
    </main>
  );
}
