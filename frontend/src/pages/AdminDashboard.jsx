import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/useAuth';
import API_URL from '../config/api';
import { businessDateISO, localDateTimeInput, parseLocalDateTime, formatLocalDate, formatLocalTime } from '../utils/localDateTime';
import './AdminDashboard.css';

const ESTADOS = ['PENDIENTE', 'ATENDIDO', 'AUSENTE', 'CANCELADO'];
const estadoLabel = { PENDIENTE: 'Pendiente', ATENDIDO: 'Atendido', AUSENTE: 'Ausente', CANCELADO: 'Cancelado' };
const dinero = valor => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(valor || 0));

export default function AdminDashboard() {
  const { token } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [fechaActiva, setFechaActiva] = useState(() => businessDateISO());
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [linkCopiado, setLinkCopiado] = useState(false);
  const [turnoEdit, setTurnoEdit] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargarTurnos = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/admin/turnos`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('No pudimos cargar la agenda. Intentá actualizar.');
      const data = await response.json();
      setTurnos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Ocurrió un error al cargar la agenda.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { cargarTurnos(); }, [cargarTurnos]);

  const turnosDelDia = useMemo(() => turnos
    .filter(turno => localDateTimeInput(turno.fecha).slice(0, 10) === fechaActiva)
    .sort((a, b) => (parseLocalDateTime(a.fecha)?.getTime() || 0) - (parseLocalDateTime(b.fecha)?.getTime() || 0)), [turnos, fechaActiva]);

  const turnosVisibles = useMemo(() => turnosDelDia.filter(turno => {
    const coincideEstado = filtroEstado === 'TODOS' || turno.estado === filtroEstado;
    const consulta = busqueda.trim().toLocaleLowerCase('es');
    const coincideTexto = !consulta || `${turno.cliente || ''} ${turno.servicio || ''}`.toLocaleLowerCase('es').includes(consulta);
    return coincideEstado && coincideTexto;
  }), [turnosDelDia, filtroEstado, busqueda]);

  const resumen = useMemo(() => ({
    total: turnosDelDia.filter(t => t.estado !== 'CANCELADO').length,
    pendientes: turnosDelDia.filter(t => t.estado === 'PENDIENTE').length,
    atendidos: turnosDelDia.filter(t => t.estado === 'ATENDIDO').length,
    facturado: turnosDelDia.filter(t => t.estado === 'ATENDIDO').reduce((suma, t) => suma + Number(t.precio || 0), 0)
  }), [turnosDelDia]);

  const moverDia = cantidad => {
    const [year, month, day] = fechaActiva.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + cantidad, 12));
    setFechaActiva(businessDateISO(date));
  };

  const actualizarEstado = async (turno, nuevoEstado) => {
    if (nuevoEstado === turno.estado) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/turnos/${turno.id}/estado?nuevoEstado=${nuevoEstado}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('No se pudo cambiar el estado.');
      setMensaje(`Turno de ${turno.cliente || 'paciente'} actualizado: ${estadoLabel[nuevoEstado].toLowerCase()}.`);
      await cargarTurnos();
    } catch (err) { setMensaje(err.message); }
  };

  const eliminarTurno = async turno => {
    if (!window.confirm(`¿Eliminar definitivamente el turno de ${turno.cliente || 'este paciente'}?`)) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/turnos/${turno.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('No se pudo eliminar el turno.');
      setMensaje('Turno eliminado.');
      await cargarTurnos();
    } catch (err) { setMensaje(err.message); }
  };

  const guardarEdicion = async event => {
    event.preventDefault();
    setGuardando(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/turnos/${turnoEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fecha: turnoEdit.fecha, servicio: turnoEdit.servicio, precio: Number(turnoEdit.precio) })
      });
      if (!response.ok) throw new Error('No se pudo guardar. Verificá que el nuevo horario esté libre.');
      setTurnoEdit(null);
      setMensaje('Cambios guardados.');
      await cargarTurnos();
    } catch (err) { setMensaje(err.message); }
    finally { setGuardando(false); }
  };

  const copiarLink = async () => {
    const url = `${window.location.origin}/reservar`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopiado(true);
      window.setTimeout(() => setLinkCopiado(false), 2500);
    } catch { window.prompt('Copiá el enlace de reservas:', url); }
  };

  const compartirPorWhatsApp = () => {
    const url = `${window.location.origin}/reservar`;
    const texto = `Hola, gracias por escribir a VH Masajes. Podés elegir el servicio y el horario que prefieras desde acá: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  const exportarCSV = () => {
    const filas = [['Fecha', 'Horario', 'Paciente', 'Servicio', 'Precio', 'Estado'], ...turnosDelDia.map(t => [fechaActiva, formatLocalTime(t.fecha), t.cliente, t.servicio, t.precio, estadoLabel[t.estado] || t.estado])];
    const csv = filas.map(fila => fila.map(campo => `"${String(campo ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `Agenda_${fechaActiva}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) return <div className="agenda-state" role="status">Cargando agenda…</div>;

  return (
    <section className="admin-agenda" aria-labelledby="agenda-title">
      <div className="agenda-toolbar">
        <div>
          <p className="agenda-kicker">ORGANIZACIÓN DIARIA</p>
          <h1 id="agenda-title">Agenda</h1>
          <p className="agenda-subtitle">Consultá tus turnos y gestioná cada atención.</p>
        </div>
        <div className="agenda-toolbar-actions">
          <button className="agenda-button agenda-button-secondary" type="button" onClick={copiarLink}>{linkCopiado ? 'Enlace copiado' : 'Compartir reservas'}</button>
          <button className="agenda-button agenda-button-secondary" type="button" onClick={compartirPorWhatsApp}>Preparar mensaje WhatsApp</button>
          <button className="agenda-button agenda-button-secondary" type="button" onClick={exportarCSV} disabled={!turnosDelDia.length}>Descargar día</button>
          <button className="agenda-button agenda-button-primary" type="button" onClick={cargarTurnos}>Actualizar agenda</button>
        </div>
      </div>

      {(error || mensaje) && <div className={`agenda-message ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>
        <span>{error || mensaje}</span>
        {error && <button className="agenda-text-button" type="button" onClick={cargarTurnos}>Reintentar</button>}
        {!error && <button className="agenda-message-close" type="button" aria-label="Cerrar aviso" onClick={() => setMensaje('')}>×</button>}
      </div>}

      <div className="agenda-datebar">
        <div className="agenda-day-navigation">
          <button className="agenda-arrow" type="button" onClick={() => moverDia(-1)} aria-label="Ver día anterior">‹</button>
          <div><h2>{formatLocalDate(`${fechaActiva}T12:00:00`)}</h2><span>{fechaActiva === businessDateISO() ? 'Hoy' : 'Vista diaria'}</span></div>
          <button className="agenda-arrow" type="button" onClick={() => moverDia(1)} aria-label="Ver día siguiente">›</button>
          <button className="agenda-button agenda-today" type="button" onClick={() => setFechaActiva(businessDateISO())}>Ir a hoy</button>
        </div>
        <label className="agenda-date-input">Elegir fecha<input type="date" value={fechaActiva} onChange={event => setFechaActiva(event.target.value)} /></label>
      </div>

      <div className="agenda-summary" aria-label="Resumen del día">
        <SummaryCard label="Turnos del día" value={resumen.total} detail="Sin contar cancelados" tone="sage" />
        <SummaryCard label="Pendientes" value={resumen.pendientes} detail="Requieren seguimiento" tone="amber" />
        <SummaryCard label="Atendidos" value={resumen.atendidos} detail="Sesiones completadas" tone="blue" />
        <SummaryCard label="Facturado" value={dinero(resumen.facturado)} detail="Turnos atendidos" tone="green" />
      </div>

      <section className="agenda-list-panel" aria-labelledby="appointments-title">
        <div className="agenda-list-heading">
          <div><h2 id="appointments-title">Turnos</h2><p>{turnosVisibles.length} {turnosVisibles.length === 1 ? 'resultado' : 'resultados'} para este día</p></div>
          <div className="agenda-filters">
            <label className="agenda-search">Buscar paciente o servicio<input type="search" value={busqueda} onChange={event => setBusqueda(event.target.value)} placeholder="Nombre o tratamiento" /></label>
            <label className="agenda-status-filter">Estado<select value={filtroEstado} onChange={event => setFiltroEstado(event.target.value)}><option value="TODOS">Todos</option>{ESTADOS.map(estado => <option key={estado} value={estado}>{estadoLabel[estado]}</option>)}</select></label>
          </div>
        </div>

        {turnosVisibles.length ? <ol className="appointment-list">
          {turnosVisibles.map(turno => <li className="appointment-item" key={turno.id}>
            <time className="appointment-time" dateTime={localDateTimeInput(turno.fecha)}>{formatLocalTime(turno.fecha)}<span>{turno.fin ? formatLocalTime(turno.fin) : ''}</span></time>
            <div className="appointment-main">
              <div className="appointment-title-row"><h3>{turno.cliente || 'Paciente'}</h3><span className={`appointment-status status-${String(turno.estado).toLowerCase()}`}>{estadoLabel[turno.estado] || turno.estado}</span></div>
              <p>{turno.servicio || 'Servicio'} <span aria-hidden="true">·</span> {dinero(turno.precio)}</p>
              {turno.notas && <p className="appointment-notes">Nota: {turno.notas}</p>}
            </div>
            <div className="appointment-actions">
              <label className="agenda-status-control">Estado<select aria-label={`Cambiar estado del turno de ${turno.cliente || 'paciente'}`} value={turno.estado} onChange={event => actualizarEstado(turno, event.target.value)}>{ESTADOS.map(estado => <option key={estado} value={estado}>{estadoLabel[estado]}</option>)}</select></label>
              <details className="appointment-more"><summary>Más opciones</summary><div className="appointment-more-menu">
                <button type="button" onClick={() => setTurnoEdit({ id: turno.id, fecha: localDateTimeInput(turno.fecha), servicio: turno.servicio || '', precio: turno.precio || 0 })}>Editar turno</button>
                <button type="button" className="is-danger" onClick={() => eliminarTurno(turno)}>Eliminar turno</button>
              </div></details>
            </div>
          </li>)}
        </ol> : <div className="agenda-empty"><span className="agenda-empty-mark" aria-hidden="true">✓</span><h3>{turnosDelDia.length ? 'No hay turnos con esos filtros' : 'Día libre'}</h3><p>{turnosDelDia.length ? 'Probá cambiar el texto o el estado seleccionado.' : 'No hay reservas registradas para esta fecha.'}</p></div>}
      </section>

      {turnoEdit && <div className="agenda-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setTurnoEdit(null); }}>
        <section className="agenda-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
          <div className="agenda-modal-heading"><div><p className="agenda-kicker">ACTUALIZAR RESERVA</p><h2 id="edit-title">Editar turno</h2></div><button type="button" className="agenda-modal-close" onClick={() => setTurnoEdit(null)} aria-label="Cerrar">×</button></div>
          <form onSubmit={guardarEdicion}>
            <label>Fecha y hora<input type="datetime-local" value={turnoEdit.fecha} onChange={event => setTurnoEdit({ ...turnoEdit, fecha: event.target.value })} required /></label>
            <label>Servicio<input type="text" value={turnoEdit.servicio} onChange={event => setTurnoEdit({ ...turnoEdit, servicio: event.target.value })} required /></label>
            <label>Precio<input type="number" min="0" step="1" value={turnoEdit.precio} onChange={event => setTurnoEdit({ ...turnoEdit, precio: event.target.value })} required /></label>
            <div className="agenda-modal-actions"><button className="agenda-button agenda-button-secondary" type="button" onClick={() => setTurnoEdit(null)}>Volver</button><button className="agenda-button agenda-button-primary" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button></div>
          </form>
        </section>
      </div>}
    </section>
  );
}

function SummaryCard({ label, value, detail, tone }) {
  return <article className={`agenda-summary-card tone-${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
