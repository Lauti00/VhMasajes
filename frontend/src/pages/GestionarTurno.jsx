import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import { businessDateISO, formatLocalDate, formatLocalTime, localDateTimeInput } from '../utils/localDateTime';
import './ReservaPublica.css';

const estadoLabel = { PENDIENTE: 'Pendiente', ATENDIDO: 'Atendido', AUSENTE: 'Ausente', CANCELADO: 'Cancelado' };
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
  const [modo, setModo] = useState('detalle');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Este enlace no contiene el acceso privado del turno. Abrí el enlace completo que guardaste al reservar.');
      setCargando(false);
      return;
    }

    Promise.all([
      fetch(`${API_URL}/api/reservas/gestion`, { headers: { 'X-Turno-Token': token } }),
      fetch(`${API_URL}/api/servicios`)
    ]).then(async ([turnoResponse, serviciosResponse]) => {
      if (!turnoResponse.ok) {
        const body = await turnoResponse.json().catch(() => ({}));
        throw new Error(body.message || 'No encontramos el turno. Revisá el enlace.');
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
    if (modo !== 'reprogramar' || !token || !fecha || !servicioId || turno?.estado !== 'PENDIENTE') {
      setHorarios([]);
      setCargandoHorarios(false);
      return undefined;
    }

    const controller = new AbortController();
    setCargandoHorarios(true);
    fetch(`${API_URL}/api/reservas/gestion/disponibilidad?fecha=${fecha}&servicioId=${servicioId}`, {
      headers: { 'X-Turno-Token': token }, signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw new Error('No pudimos consultar los horarios disponibles.');
      const data = await response.json();
      setHorarios(Array.isArray(data) ? data : []);
      setError('');
    }).catch(err => {
      if (err.name !== 'AbortError') setError(err.message);
    }).finally(() => {
      if (!controller.signal.aborted) setCargandoHorarios(false);
    });
    return () => controller.abort();
  }, [token, fecha, servicioId, turno?.estado, modo]);

  const servicioSeleccionado = servicios.find(item => String(item.id) === servicioId);
  const puedeEditar = turno?.estado === 'PENDIENTE';

  const comenzarReprogramacion = () => {
    setError('');
    setMensaje('');
    setServicioId(String(turno.servicioId || ''));
    setFecha(localDateTimeInput(turno.fecha).slice(0, 10));
    setHora(formatLocalTime(turno.fecha).slice(0, 5));
    setNotas(turno.notas || '');
    setModo('reprogramar');
  };

  const volverAlDetalle = () => {
    setError('');
    setMensaje('');
    setModo('detalle');
  };

  const guardarReprogramacion = async event => {
    event.preventDefault();
    if (!fecha || !hora || !servicioId) {
      setError('Elegí un servicio, un día y un horario disponibles.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/reservas/gestion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Turno-Token': token },
        body: JSON.stringify({ fecha: `${fecha}T${hora.length === 5 ? `${hora}:00` : hora}`, servicioId: Number(servicioId), notas })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'No se pudo reprogramar. Elegí otro horario disponible.');
      setTurno(body);
      setMensaje('El cambio quedó guardado. Este es el detalle actualizado del turno.');
      setModo('detalle');
    } catch (err) {
      setError(err.message || 'No pudimos guardar el cambio.');
    } finally {
      setGuardando(false);
    }
  };

  const cancelarTurno = async () => {
    setGuardando(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/reservas/gestion`, { method: 'DELETE', headers: { 'X-Turno-Token': token } });
      const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'No pudimos cancelar el turno.');
      setTurno(current => ({ ...current, estado: 'CANCELADO' }));
      setMensaje('El turno quedó cancelado.');
      setModo('detalle');
    } catch (err) {
      setError(err.message || 'No pudimos cancelar el turno.');
    } finally {
      setGuardando(false);
    }
  };

  return <main className="booking-shell">
    <header className="booking-header">
      <Link className="booking-brand" to="/reservar">VH <span>masajes</span></Link>
      <Link className="booking-login" to="/reservar">Reservar otro turno</Link>
    </header>
    <div className="manage-turn-shell">
      <section className="manage-turn-heading">
        <span className="booking-eyebrow">VH MASAJES · TU RESERVA</span>
        <h1>{modo === 'reprogramar' ? 'Reprogramar turno' : modo === 'cancelar' ? 'Cancelar turno' : 'Detalle de tu turno'}</h1>
        <p>{modo === 'reprogramar' ? 'Elegí el servicio, el día y el horario que te queden mejor.' : modo === 'cancelar' ? 'Revisá la información antes de confirmar la cancelación.' : 'Consultá la información y elegí qué querés hacer con tu reserva.'}</p>
      </section>

      <section className="booking-card manage-turn-card" aria-labelledby="manage-turn-title">
        {cargando ? <p className="booking-muted" role="status">Buscando tu turno…</p> : error && !turno ? <div className="manage-turn-error" role="alert">{error}</div> : turno && <>
          {mensaje && modo === 'detalle' && <div className="manage-turn-success" role="status">{mensaje}</div>}
          {modo === 'detalle' && <>
            <div className="manage-detail-topline"><div><span className="booking-eyebrow">RESERVA VH MASAJES</span><h2 id="manage-turn-title">Tu sesión</h2></div><span className={`manage-status manage-status-${turno.estado?.toLowerCase()}`}>{estadoLabel[turno.estado] || turno.estado}</span></div>
            <div className="manage-appointment-summary">
              <div className="manage-summary-item"><span>Servicio</span><strong>{turno.servicio}</strong></div>
              <div className="manage-summary-item"><span>Fecha</span><strong>{formatLocalDate(turno.fecha)}</strong></div>
              <div className="manage-summary-item"><span>Horario</span><strong>{formatLocalTime(turno.fecha)}</strong></div>
              <div className="manage-summary-item"><span>Importe</span><strong>{dinero(turno.precio)}</strong></div>
            </div>
            {turno.notas && <p className="manage-existing-notes"><strong>Tu nota:</strong> {turno.notas}</p>}
            {puedeEditar ? <div className="manage-action-list" aria-label="Acciones para esta reserva">
              <button className="manage-action-card" type="button" onClick={comenzarReprogramacion}>
                <span className="manage-action-mark" aria-hidden="true">↻</span><span><strong>Reprogramar turno</strong><small>Cambiar servicio, fecha u horario</small></span><span className="manage-action-chevron" aria-hidden="true">›</span>
              </button>
              <button className="manage-action-card manage-action-danger" type="button" onClick={() => { setError(''); setMensaje(''); setModo('cancelar'); }}>
                <span className="manage-action-mark" aria-hidden="true">×</span><span><strong>Cancelar turno</strong><small>Dejar libre el horario reservado</small></span><span className="manage-action-chevron" aria-hidden="true">›</span>
              </button>
            </div> : <div className="manage-readonly-note">Este turno ya no admite cambios desde el enlace.</div>}
            {error && <div className="manage-turn-error" role="alert">{error}</div>}
          </>}

          {modo === 'reprogramar' && <>
            <button className="manage-back-button" type="button" onClick={volverAlDetalle}>‹ Volver al detalle</button>
            <div className="manage-current-appointment"><span>Turno actual</span><strong>{formatLocalDate(turno.fecha)} · {formatLocalTime(turno.fecha)} · {turno.servicio}</strong></div>
            <form onSubmit={guardarReprogramacion}>
              <label className="booking-label" htmlFor="manage-service">Nuevo servicio</label>
              <select id="manage-service" className="booking-input" value={servicioId} onChange={event => { setServicioId(event.target.value); setHora(''); }} required>
                {servicios.filter(item => item.activo !== false).map(item => <option key={item.id} value={item.id}>{item.nombre} · {dinero(item.precio)} · {item.duracionMinutos} min</option>)}
              </select>
              {servicioSeleccionado?.descripcion && <p className="booking-description">{servicioSeleccionado.descripcion}</p>}
              <label className="booking-label" htmlFor="manage-date">Nueva fecha</label>
              <input id="manage-date" className="booking-input" type="date" min={businessDateISO()} value={fecha} onChange={event => { setFecha(event.target.value); setHora(''); }} required />
              <span className="booking-label" id="manage-slots-label">Nuevo horario</span>
              {cargandoHorarios ? <p className="booking-muted" role="status">Buscando horarios disponibles…</p> : horarios.length ? <div className="booking-slots" role="group" aria-labelledby="manage-slots-label">{horarios.map(slot => <button type="button" key={slot} className={`booking-slot ${hora === slot.slice(0, 5) ? 'selected' : ''}`} aria-pressed={hora === slot.slice(0, 5)} onClick={() => setHora(slot.slice(0, 5))}>{slot.slice(0, 5)}</button>)}</div> : <p className="booking-muted">No hay horarios para esa selección. Probá con otro día o servicio.</p>}
              <label className="booking-label" htmlFor="manage-notes">Nota para el consultorio <span>(opcional)</span></label>
              <textarea id="manage-notes" className="booking-input booking-notes" maxLength={500} value={notas} onChange={event => setNotas(event.target.value)} />
              <p className="manage-form-hint">Tu horario actual sigue reservado hasta que confirmes el cambio.</p>
              {error && <div className="manage-turn-error" role="alert">{error}</div>}
              <div className="manage-form-actions"><button className="manage-secondary-button" type="button" onClick={volverAlDetalle} disabled={guardando}>Volver</button><button className="booking-submit" type="submit" disabled={guardando || cargandoHorarios || !hora}>{guardando ? 'Guardando…' : 'Confirmar reprogramación'}</button></div>
            </form>
          </>}

          {modo === 'cancelar' && <div className="manage-cancel-view">
            <button className="manage-back-button" type="button" onClick={volverAlDetalle}>‹ Volver al detalle</button>
            <span className="manage-cancel-symbol" aria-hidden="true">!</span>
            <h2 id="manage-turn-title">¿Confirmás la cancelación?</h2>
            <p>El horario quedará disponible para otros pacientes. Esta acción no se puede deshacer desde el enlace.</p>
            <div className="manage-current-appointment"><span>Turno que vas a cancelar</span><strong>{formatLocalDate(turno.fecha)} · {formatLocalTime(turno.fecha)} · {turno.servicio}</strong></div>
            {error && <div className="manage-turn-error" role="alert">{error}</div>}
            <div className="manage-form-actions"><button className="manage-secondary-button" type="button" onClick={volverAlDetalle} disabled={guardando}>Mantener mi turno</button><button className="manage-confirm-cancel" type="button" onClick={cancelarTurno} disabled={guardando}>{guardando ? 'Cancelando…' : 'Sí, cancelar turno'}</button></div>
          </div>}
        </>}
      </section>
    </div>
    <footer className="booking-footer">VH Masajes · Atención personalizada</footer>
  </main>;
}
