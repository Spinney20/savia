/**
 * Formatting utilities — Romanian locale
 */

const RO_DATE_FORMAT = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const RO_DATETIME_FORMAT = new Intl.DateTimeFormat('ro-RO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const RO_CURRENCY_FORMAT = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
});

/** Format date as DD.MM.YYYY */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return RO_DATE_FORMAT.format(d);
}

/** Format date as DD.MM.YYYY HH:mm */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return RO_DATETIME_FORMAT.format(d);
}

/** Format number as Romanian currency (RON) */
export function formatCurrency(amount: number): string {
  return RO_CURRENCY_FORMAT.format(amount);
}

/** Format employee full name */
export function formatFullName(firstName: string, lastName: string): string {
  return `${lastName} ${firstName}`;
}
