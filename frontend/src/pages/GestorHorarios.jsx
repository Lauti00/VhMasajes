import { useEffect, useState } from 'react';
import { horarioService } from '../services/HorarioService';
import './GestorHorarios.css';

const nombresDias = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
const plantillaPorDefecto = Array.from({ length: 7 }, (_, i) => ({ diaSemana: i + 1, laborable: i + 1 <= 5, horaApertura: '09:00', horaCierre: '18:00' }));

export default function GestorHorarios() {
  const [horarios, setHorarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  useEffect(() => {
    let activo = true;
    horarioService.obtenerHorarios().then(data => {
      if (!activo) return;
      const lista = Array.isArray(data) && data.length ? data : plantillaPorDefecto;
      setHorarios(lista.map(h => ({ ...h, horaApertura: h.horaApertura?.substring(0, 5) || '09:00', horaCierre: h.horaCierre?.substring(0, 5) || '18:00' })));
      setCargando(false);
    });
    return () => { activo = false; };
  }, []);

  const actualizarDia = (diaSemana, campo, valor) => setHorarios(actuales => actuales.map(dia => dia.diaSemana === diaSemana ? { ...dia, [campo]: valor } : dia));

  const guardar = async event => {
    event.preventDefault();
    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });
    try {
      await horarioService.guardarHorarios(horarios.map(dia => ({ ...dia, horaApertura: `${dia.horaApertura}:00`, horaCierre: `${dia.horaCierre}:00` })));
      setMensaje({ texto: 'La disponibilidad semanal quedó actualizada.', tipo: 'success' });
    } catch {
      setMensaje({ texto: 'No pudimos guardar los cambios. Revisá tu conexión e intentá nuevamente.', tipo: 'error' });
    } finally { setGuardando(false); }
  };

  if (cargando) return <div className="availability-state" role="status">Cargando disponibilidad…</div>;

  return <section className="availability-page" aria-labelledby="availability-title">
    <header className="availability-heading">
      <div><p className="availability-kicker">CONFIGURACIÓN SEMANAL</p><h1 id="availability-title">Disponibilidad</h1><p>Definí qué días atendés y en qué horario. Podés ajustar cada jornada según tu semana.</p></div>
      <span className="availability-heading-mark" aria-hidden="true">◷</span>
    </header>
    {mensaje.texto && <div className={`availability-message ${mensaje.tipo}`} role={mensaje.tipo === 'error' ? 'alert' : 'status'}>{mensaje.texto}</div>}
    <form onSubmit={guardar}>
      <div className="availability-list">
        {horarios.map(dia => <article className={`availability-day ${dia.laborable ? '' : 'is-off'}`} key={dia.diaSemana}>
          <div className="availability-day-heading">
            <div className="availability-day-name"><span className="availability-day-dot" aria-hidden="true"/><div><h2>{nombresDias[dia.diaSemana]}</h2><p>{dia.laborable ? 'Día de atención' : 'Día sin atención'}</p></div></div>
            <label className="availability-toggle"><input type="checkbox" checked={dia.laborable} onChange={event => actualizarDia(dia.diaSemana, 'laborable', event.target.checked)} /><span className="availability-toggle-track" aria-hidden="true"/><span className="availability-toggle-label">{dia.laborable ? 'Disponible' : 'No disponible'}</span></label>
          </div>
          {dia.laborable && <div className="availability-times">
            <label>Desde<input type="time" value={dia.horaApertura} onChange={event => actualizarDia(dia.diaSemana, 'horaApertura', event.target.value)} required /></label>
            <span className="availability-time-separator" aria-hidden="true">a</span>
            <label>Hasta<input type="time" value={dia.horaCierre} onChange={event => actualizarDia(dia.diaSemana, 'horaCierre', event.target.value)} required /></label>
          </div>}
        </article>)}
      </div>
      <div className="availability-footer"><p>Los pacientes solo podrán reservar dentro de estos horarios.</p><button className="availability-save" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar disponibilidad'}</button></div>
    </form>
  </section>;
}
