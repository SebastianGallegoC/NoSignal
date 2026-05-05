const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'America/Bogota',
});

const DATE_TIME_FORMATTER_NO_SECONDS = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value == null || value === '') {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME_FORMATTER.format(date);
}

export function formatDateTimeNoSeconds(value: string | number | Date | null | undefined): string {
  if (value == null || value === '') {
    return '—';
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : DATE_TIME_FORMATTER_NO_SECONDS.format(date);
}