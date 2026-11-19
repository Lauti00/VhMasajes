const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/;

export function businessDateISO(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(value);
  const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}

export function localDateTimeInput(value) {
  if (!value) return '';
  const match = String(value).match(LOCAL_DATE_TIME);
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}` : '';
}

export function parseLocalDateTime(value) {
  const match = String(value || '').match(LOCAL_DATE_TIME);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] || 0));
}

export function formatLocalDate(value) {
  const dateText = String(value || '').slice(0, 10);
  const match = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function formatLocalTime(value) {
  const match = String(value || '').match(LOCAL_DATE_TIME);
  if (!match) return '';
  return `${match[4]}:${match[5]}`;
}
