import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import { businessDateISO, formatLocalDate, formatLocalTime, localDateTimeInput } from '../utils/localDateTime';
import './ReservaPublica.css';

const estadoLabel = { PENDIENTE: 'Pendiente de atención', ATENDIDO: 'Atendido', AUSENTE: 'Ausente', CANCELADO: 'Cancelado' };
const dinero = value => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function GestionarTurno() {
  const token = useMemo(() => window.location.hash.slice(1).trim(), []);
  const [turno, setTurno] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!token) { setError('Este enlace no tiene el código privado del turno. Revisá que hayas abierto el enlace completo.'); setCargando(false); return; }
    Promise.all([
      fetch(`${API_URL}/api/reservas/gestion`, { headers: { 'X-Turno-Token': token } }),
      fetch(`${API_URL}/api/servicios`)
    ]).then(async ([turnoResponse, serviciosResponse]) => {
      if (!turnoResponse.ok) {
        const body = await turnoResponse.json().catch(() => ({}));
        throw new Error(body.message || 'No encontramos el turno. Revisá que el enlace sea correcto.');
      }
      if (!serviciosResponse.ok) throw new Error('No pudimos cargar los servicios. Intentá nuevamente.');
      const data = await turnoResponse.json();
      const listaServicios = await serviciosResponse.json();
      setTurno(data);
      setServicios(Array.isArray(listaServicios) ? listaServicios : []);
      setServicioId(String(data.servicioId || ''));
      setFecha(localDateTimeInput(data.fecha).slice(0, 10));
      setHora(formatLocalTime(data.fecha).slice(0, 5));
      setNotas(data.notas || '');
    }).catch(err => setError(err.message || 'No pudimos cargar el turno.'))
      .finally(() => setCargando(false));
  }, [token]);

  useEffect(() => {
    if (!token || !fecha || !servicioId || !turno || turno.estado !== 'PENDIENTE') { setHorarios([]); return; }
    const controller = new AbortController();
    fetch(`${API_URL}/api/reservas/gestion/disponibilidad?fecha=${fecha}&servicioId=${servicioId}`, {
      headers: { 'X-Turno-Token': token }, signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw new Error('No pudimos consultar los horarios.');
      const data = await response.json();
      setHorarios(Array.isArray(data) ? data : []);
    }).catch(err => { if (err.name !== 'AbortError') setError(err.message); });
    return () => controller.abort();
  }, [token, fecha, servicioId, turno]);

  const guardar = async event => {
    event.preventDefault();
    if (!fecha || !hora || !servicioId) { setError('Elegí el servicio, el día y el horario.'); return; }
    setGuardando(true); setError(''); setMensaje('');
    try {
      const response = await fetch(`${API_URL}/api/reservas/gestion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Turno-Token': token },
        body: JSON.stringify({ fecha: `${fecha}T${hora.length === 5 ? `${hora}:00` : hora}`, servicioId: Number(servicioId), notas })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'No se pudieron guardar los cambios.');
      setTurno(body);
      setMensaje('Los cambios del turno quedaron guardados.');
    } catch (err) { setError(err.message || 'No pudimos guardar los cambios.'); }
    finally { setGuardando(false); }
  };

  const cancelar = async () => {
    if (!window.confirm('¿Querés cancelar este turno?')) return;
    setGuardando(true); setError(''); setMensaje('');
    try {
      const response = await fetch(`${API_URL}/api/reservas/gestion`, { method: 'DELETE', headers: { 'X-Turno-Token': token } });
      const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'No pudimos cancelar el turno.');
      setTurno(current => ({ ...current, estado: 'CANCELADO' }));
      setMensaje('El turno fue cancelado.');
    } catch (err) { setError(err.message || 'No pudimos cancelar el turno.'); }
    finally { setGuardando(false); }
  };

  const puedeEditar = turno?.estado === 'PENDIENTE';
  const servicio = servicios.find(item => String(item.id) === servicioId);

  return <main className="booking-shell">
    <header className="booking-header"><Link className="booking-brand" to="/reservar">VH <span>masajes</span></Link><Link className="booking-login" to="/reservar">Reservar otro turno</Link></header>
    <div className="manage-turn-shell">
      <section className="manage-turn-heading"><span className="booking-eyebrow">VH MASAJES · TU RESERVA</span><h1>Gestioná tu turno</h1><p>Desde acá podés consultar, cambiar o cancelar tu reserva.</p></section>
      <section className="booking-card" aria-labelledby="manage-turn-title">
        {cargando ? <p className="booking-muted" role="status">Buscando tu turno…</p> : error && !turno ? <div className="manage-turn-error" role="alert">{error}</div> : turno && <>
          <div className="manage-turn-details"><strong>{turno.cliente}</strong><span>{formatLocalDate(turno.fecha)} · {formatLocalTime(turno.fecha)}</span><span>{turno.servicio} · {dinero(turno.precio)}</span><span>Estado: {estadoLabel[turno.estado] || turno.estado}</span></div>
          {puedeEditar ? <form onSubmit={guardar}>
            <label className="booking-label" htmlFor="manage-service">Servicio</label>
            <select id="manage-service" className="booking-input" value={servicioId} onChange={event => { setServicioId(event.target.value); setHora(''); }} required>{servicios.filter(item => item.activo !== false).map(item => <option key={item.id} value={item.id}>{item.nombre} · {dinero(item.precio)} · {item.duracionMinutos} min</option>)}</select>
            {servicio?.descripcion && <p className="booking-description">{servicio.descripcion}</p>}
            <label className="booking-label" htmlFor="manage-date">Día</label>
            <input id="manage-date" className="booking-input" type="date" min={businessDateISO()} value={fecha} onChange={event => { setFecha(event.target.value); setHora(''); }} required />
            <span className="booking-label" id="manage-slots-label">Elegí un nuevo horario</span>
            {horarios.length ? <div className="booking-slots" role="group" aria-labelledby="manage-slots-label">{horarios.map(slot => <button type="button" key={slot} className={`booking-slot ${hora === slot.slice(0, 5) ? 'selected' : ''}`} aria-pressed={hora === slot.slice(0, 5)} onClick={() => setHora(slot.slice(0, 5))}>{slot.slice(0, 5)}</button>)}</div> : <p className="booking-muted">No hay horarios disponibles para esta selección. Probá otro día.</p>}
            <label className="booking-label" htmlFor="manage-notes">Nota para el consultorio <span>(opcional)</span></label>
            <textarea id="manage-notes" className="booking-input booking-notes" maxLength={500} value={notas} onChange={event => setNotas(event.target.value)} />
            {error && <div className="manage-turn-error" role="alert">{error}</div>}
            {mensaje && <div className="booking-confirmation-message" role="status">{mensaje}</div>}
            <div className="manage-turn-actions"><button className="booking-submit" type="submit" disabled={guardando || !hora}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button></div>
            <button className="manage-cancel" type="button" onClick={cancelar} disabled={guardando}>Cancelar turno</button>
          </form> : <>
            {error && <div className="manage-turn-error" role="alert">{error}</div>}
            {mensaje && <div className="booking-confirmation-message" role="status">{mensaje}</div>}
            <p className="booking-footnote">Este turno ya no admite cambios desde el enlace.</p>
          </>}
        </>}
      </section>
    </div>
    <footer className="booking-footer">VH Masajes · Atención personalizada</footer>
  </main>;
}
