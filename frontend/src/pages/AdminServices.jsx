import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import API_URL from '../config/api';
import './AdminServicios.css';

const formularioVacio = { nombre: '', descripcion: '', duracionMinutos: 60, precio: '' };

export default function AdminServicios() {
  const { token } = useAuth();
  const [servicios, setServicios] = useState([]);
  const [formulario, setFormulario] = useState(formularioVacio);
  const [servicioEditando, setServicioEditando] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const cargarServicios = useCallback(async () => {
    if (!token) return;
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/api/servicios`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json().catch(() => []);
      if (!response.ok) throw new Error(body.message || 'No pudimos cargar los servicios.');
      setServicios(Array.isArray(body) ? body : []);
    } catch (error) {
      setMensaje({ texto: error.message || 'Error de conexión con el servidor.', tipo: 'error' });
    } finally { setCargando(false); }
  }, [token]);

  useEffect(() => { cargarServicios(); }, [cargarServicios]);

  const cambiarCampo = event => setFormulario(actual => ({ ...actual, [event.target.name]: event.target.name === 'precio' || event.target.name === 'duracionMinutos' ? event.target.value : event.target.value }));

  const iniciarEdicion = servicio => {
    setServicioEditando(servicio.id);
    setFormulario({ nombre: servicio.nombre || '', descripcion: servicio.descripcion || '', duracionMinutos: servicio.duracionMinutos || 60, precio: servicio.precio ?? '' });
    setMensaje({ texto: '', tipo: '' });
    document.getElementById('services-form-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cancelarEdicion = () => { setServicioEditando(null); setFormulario(formularioVacio); };

  const guardarServicio = async event => {
    event.preventDefault();
    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });
    try {
      const editing = servicioEditando !== null;
      const response = await fetch(`${API_URL}/api/servicios${editing ? `/${servicioEditando}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formulario, duracionMinutos: Number(formulario.duracionMinutos), precio: Number(formulario.precio) })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || (editing ? 'No se pudieron guardar los cambios.' : 'No se pudo crear el servicio.'));
      setMensaje({ texto: editing ? 'Los cambios del servicio se guardaron.' : 'El servicio se agregó al catálogo.', tipo: 'success' });
      cancelarEdicion();
      await cargarServicios();
    } catch (error) {
      setMensaje({ texto: error.message || 'Error de conexión con el servidor.', tipo: 'error' });
    } finally { setGuardando(false); }
  };

  const eliminarServicio = async servicio => {
    if (!window.confirm(`¿Querés quitar “${servicio.nombre}” del catálogo? Los turnos anteriores conservarán su registro.`)) return;
    setEliminando(servicio.id);
    try {
      const response = await fetch(`${API_URL}/api/servicios/${servicio.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('No se pudo quitar el servicio del catálogo.');
      if (servicioEditando === servicio.id) cancelarEdicion();
      setMensaje({ texto: 'Servicio quitado del catálogo.', tipo: 'success' });
      await cargarServicios();
    } catch (error) { setMensaje({ texto: error.message, tipo: 'error' }); }
    finally { setEliminando(null); }
  };

  return <section className="services-page" aria-labelledby="services-title">
    <header className="services-heading"><div><p className="services-kicker">CATÁLOGO DEL CONSULTORIO</p><h1 id="services-title">Servicios</h1><p>Administrá los tratamientos, sus precios y la duración de cada sesión.</p></div><span className="services-count">{servicios.length} {servicios.length === 1 ? 'servicio' : 'servicios'}</span></header>
    {mensaje.texto && <div className={`services-message ${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>{mensaje.texto}</div>}

    <section className="services-form-card" aria-labelledby="services-form-title">
      <div className="services-form-heading"><div><p className="services-kicker">{servicioEditando ? 'ACTUALIZAR CATÁLOGO' : 'NUEVO TRATAMIENTO'}</p><h2 id="services-form-title">{servicioEditando ? 'Editar servicio' : 'Agregar un servicio'}</h2></div>{servicioEditando && <button className="services-cancel-edit" type="button" onClick={cancelarEdicion}>Cancelar edición</button>}</div>
      <form className="services-form" onSubmit={guardarServicio}>
        <label className="services-field services-field-name">Nombre del servicio<input name="nombre" value={formulario.nombre} onChange={cambiarCampo} placeholder="Ej. Masaje relajante" maxLength={100} required /></label>
        <label className="services-field services-field-description">Descripción <span>(opcional)</span><textarea name="descripcion" value={formulario.descripcion} onChange={cambiarCampo} placeholder="Contá brevemente qué incluye" rows={3} maxLength={500} /></label>
        <label className="services-field">Precio<input name="precio" type="number" min="1" step="0.01" value={formulario.precio} onChange={cambiarCampo} placeholder="$ 0" required /></label>
        <label className="services-field">Duración<input name="duracionMinutos" type="number" min="1" max="480" step="5" value={formulario.duracionMinutos} onChange={cambiarCampo} required /><small>En minutos</small></label>
        <div className="services-form-actions"><button className="services-save" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : servicioEditando ? 'Guardar cambios' : 'Agregar servicio'}</button></div>
      </form>
    </section>

    <section className="services-catalog" aria-labelledby="services-catalog-title"><div className="services-catalog-heading"><div><h2 id="services-catalog-title">Tu catálogo</h2><p>Estos servicios y precios se muestran al reservar.</p></div></div>
      {cargando && servicios.length === 0 ? <p className="services-empty" role="status">Cargando servicios…</p> : servicios.length === 0 ? <p className="services-empty">Todavía no agregaste servicios.</p> : <div className="services-grid">{servicios.map(servicio => <article className="service-card" key={servicio.id}>
        <div className="service-card-top"><span className="service-card-symbol" aria-hidden="true">✦</span><span className="service-card-duration">{servicio.duracionMinutos} min</span></div>
        <h3>{servicio.nombre}</h3><p className="service-card-description">{servicio.descripcion || 'Sesión de bienestar personalizada.'}</p><strong className="service-card-price">${Number(servicio.precio).toLocaleString('es-AR')}</strong>
        <div className="service-card-actions"><button type="button" onClick={() => iniciarEdicion(servicio)}>Editar</button><button className="service-remove" type="button" onClick={() => eliminarServicio(servicio)} disabled={eliminando === servicio.id}>{eliminando === servicio.id ? 'Quitando…' : 'Quitar del catálogo'}</button></div>
      </article>)}</div>}
    </section>
  </section>;
}
