import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import API_URL from '../config/api';
import { useAuth } from '../context/useAuth';
import './ReservaPublica.css';
import { businessDateISO, formatLocalDate, formatLocalTime, localDateTimeInput } from '../utils/localDateTime';
import { downloadTurnoCalendarEvent } from '../utils/calendarEvent';

export default function ReservaPublica() {
  const { isAuthenticated, user } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [confirmacion, setConfirmacion] = useState(null);
  const [mensajeCopia, setMensajeCopia] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const servicio = useMemo(() => servicios.find(s => String(s.id) === servicioId), [servicios, servicioId]);
  const tokenGestion = confirmacion?.tokenGestion || '';
  const enlaceGestion = tokenGestion ? `${window.location.origin}/gestionar-turno#${tokenGestion}` : '';
  const turnoConfirmado = confirmacion?.turno;
  const fechaConfirmada = localDateTimeInput(turnoConfirmado?.fecha) || `${fecha}T${hora}:00`;
  const fechaDiaConfirmada = fechaConfirmada.slice(0, 10);
  const horaConfirmada = formatLocalTime(fechaConfirmada) || hora.slice(0, 5);
  const servicioConfirmado = turnoConfirmado?.servicio || servicio?.nombre;
  const precioConfirmado = turnoConfirmado?.precio ?? servicio?.precio ?? 0;

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
    if (!isAuthenticated && (!nombre.trim() || !apellido.trim())) { setError('Completá tu nombre y apellido para reservar.'); return; }

    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      const esReservaSinCuenta = !isAuthenticated;
      const res = await fetch(esReservaSinCuenta ? `${API_URL}/api/reservas` : `${API_URL}/api/turnos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          fecha: `${fecha}T${hora.length === 5 ? `${hora}:00` : hora}`,
          servicioId: Number(servicioId),
          notas,
          ...(isAuthenticated ? { cliente: user?.nombre || 'Paciente' } : {}),
          ...(esReservaSinCuenta ? { nombre: nombre.trim(), apellido: apellido.trim() } : {})
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || 'Ese horario ya no está disponible. Elegí otro.');
      setConfirmacion({ turno: esReservaSinCuenta ? body.turno : body, tokenGestion: esReservaSinCuenta ? body.tokenGestion : '' });
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

  if (confirmacion) {
    const compartirTexto = `Reservé ${servicioConfirmado || 'un turno'} para el ${formatLocalDate(`${fechaDiaConfirmada}T12:00:00`)} a las ${horaConfirmada} en VH Masajes. Mi enlace privado para gestionar el turno: ${enlaceGestion}`;
    const copiarEnlaceGestion = async () => {
      try {
        await navigator.clipboard.writeText(enlaceGestion);
        setMensajeCopia('Enlace privado copiado.');
      } catch {
        window.prompt('Copiá y guardá tu enlace privado:', enlaceGestion);
      }
    };
    return <main className="booking-shell">
      <header className="booking-header"><Link className="booking-brand" to="/reservar">VH <span>masajes</span></Link></header>
      <section className="booking-card booking-confirmation" aria-labelledby="booking-confirmed-title">
        <span className="booking-confirmation-mark" aria-hidden="true">✓</span>
        <p className="booking-eyebrow">VH MASAJES</p>
        <h1 id="booking-confirmed-title">Tu turno quedó reservado</h1>
        <p>Te esperamos para disfrutar de tu momento de bienestar.</p>
        <div className="booking-summary booking-confirmation-summary"><span>{servicioConfirmado} · {formatLocalDate(`${fechaDiaConfirmada}T12:00:00`)} · {horaConfirmada}</span><strong>${Number(precioConfirmado).toLocaleString('es-AR')}</strong></div>
        <div className="booking-calendar-card">
          <div><span className="booking-calendar-kicker">PARA QUE NO TE LO OLVIDES</span><strong>Agregá el turno a tu calendario</strong><p>Descargá el evento y abrilo en el calendario de tu celular. Incluye recordatorios 24 horas y 2 horas antes.</p></div>
          <button className="booking-calendar-button" type="button" onClick={() => downloadTurnoCalendarEvent({ fecha: fechaConfirmada, servicio: servicioConfirmado, duracionMinutos: servicio?.duracionMinutos || 60 })}>Agregar a mi calendario</button>
        </div>
        {tokenGestion ? <div className="booking-private-link"><strong>También guardá tu enlace privado</strong><p>Con este enlace podés consultar, cambiar o cancelar el turno. Cualquiera que lo tenga podrá gestionarlo; conserválo en un lugar privado.</p>
          <button className="booking-submit" type="button" onClick={copiarEnlaceGestion}>Copiar enlace de gestión</button>
          {mensajeCopia && <p className="booking-copy-feedback" role="status">{mensajeCopia}</p>}
          <a className="booking-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(compartirTexto)}`} target="_blank" rel="noreferrer">Compartir enlace por WhatsApp</a>
        </div> : <p className="booking-footnote">Podés consultar tu turno desde tu cuenta cuando vuelvas a ingresar.</p>}
        <Link className="booking-new-link" to="/reservar">Volver a los servicios</Link>
      </section>
      <footer className="booking-footer">VH Masajes · Atención personalizada</footer>
    </main>;
  }

  return (
    <main className="booking-shell">
      <header className="booking-header">
        <Link className="booking-brand" to="/reservar">VH <span>masajes</span></Link>
        <Link className="booking-login" to={isAuthenticated ? '/' : '/login'}>
          {isAuthenticated ? 'Volver a mis turnos' : 'Acceso profesional'}
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
            <input id="fecha" className="booking-input" type="date" min={businessDateISO()} value={fecha} onChange={e => { setFecha(e.target.value); setHora(''); }} />

            {fecha && <>
              <span className="booking-label">Horarios disponibles</span>
              {horarios.length ? <div className="booking-slots">
                {horarios.map(slot => <button type="button" key={slot} className={`booking-slot ${hora === slot ? 'selected' : ''}`} onClick={() => setHora(slot)}>{slot.slice(0, 5)}</button>)}
              </div> : <p className="booking-muted">No encontramos horarios para ese día. Probá con otra fecha.</p>}
            </>}

            {!isAuthenticated && <div className="booking-name-fields">
              <p>¿A nombre de quién reservamos?</p>
              <label className="booking-label" htmlFor="nombre">Nombre</label>
              <input id="nombre" className="booking-input" type="text" autoComplete="given-name" maxLength={60} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" required />
              <label className="booking-label" htmlFor="apellido">Apellido</label>
              <input id="apellido" className="booking-input" type="text" autoComplete="family-name" maxLength={60} value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Tu apellido" required />
            </div>}

            <label className="booking-label" htmlFor="notas">¿Querés contarnos algo? <span>(opcional)</span></label>
            <textarea id="notas" className="booking-input booking-notes" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Por ejemplo, si es tu primera sesión…" maxLength={500} />

            {servicio && fecha && hora && <div className="booking-summary">
              <span>{servicio.nombre} · {formatLocalDate(`${fecha}T12:00:00`)} a las {hora.slice(0, 5)}</span>
              <strong>${Number(servicio.precio).toLocaleString('es-AR')}</strong>
            </div>}
            <button className="booking-submit" type="button" onClick={confirmar} disabled={!fecha || !hora || guardando}>
              {guardando ? 'Confirmando…' : 'Confirmar reserva'}
            </button>
            {!isAuthenticated && <p className="booking-footnote">No necesitás crear una cuenta. Al confirmar se genera un enlace privado para administrar tu turno.</p>}
          </>
        )}
      </section>
      <footer className="booking-footer">VH Masajes · Atención personalizada</footer>
    </main>
  );
}
