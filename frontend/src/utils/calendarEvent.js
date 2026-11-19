const TIME_ZONE = 'America/Argentina/Buenos_Aires';

function escapeIcsText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function offsetMinutesAt(instant) {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, timeZoneName: 'longOffset' })
    .formatToParts(instant)
    .find(item => item.type === 'timeZoneName')?.value || 'GMT';
  const match = part.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] || 0);
  return match[1] === '+' ? minutes : -minutes;
}

function toUtcStamp(localDateTime) {
  const match = String(localDateTime || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) throw new Error('La fecha del turno no es válida para crear el recordatorio.');
  const [, year, month, day, hour, minute, second = '00'] = match;
  const localAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  let instant = localAsUtc;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    instant = localAsUtc - offsetMinutesAt(new Date(instant)) * 60_000;
  }
  return new Date(instant).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function endLocalDateTime(localDateTime, durationMinutes) {
  const match = String(localDateTime || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) throw new Error('La fecha del turno no es válida para crear el recordatorio.');
  const [, year, month, day, hour, minute, second = '00'] = match;
  const end = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute) + durationMinutes, Number(second)));
  const pad = value => String(value).padStart(2, '0');
  return `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}T${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}:${pad(end.getUTCSeconds())}`;
}

export function downloadTurnoCalendarEvent({ fecha, servicio, duracionMinutos = 60 }) {
  const duration = Number(duracionMinutos) > 0 ? Number(duracionMinutos) : 60;
  const end = endLocalDateTime(fecha, duration);
  const uid = `${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}@vhmasajes`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const eventLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VH Masajes//Agenda//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${toUtcStamp(fecha)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcsText(`VH Masajes · ${servicio || 'Turno de masaje'}`)}`,
    `DESCRIPTION:${escapeIcsText('Tu momento de bienestar en VH Masajes. Hora local de Argentina.')}`,
    'STATUS:CONFIRMED',
    'CLASS:PRIVATE',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio: mañana tenés un turno en VH Masajes',
    'TRIGGER:-PT24H',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio: tu turno en VH Masajes es en dos horas',
    'TRIGGER:-PT2H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  const content = `${eventLines.join('\r\n')}\r\n`;
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `VH-Masajes-${String(fecha).slice(0, 10)}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
