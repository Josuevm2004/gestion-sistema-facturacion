export const DEFAULT_MONTHLY_BILLING_DAY = 1;

function parseBillingDay(value?: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MONTHLY_BILLING_DAY;
  return Math.min(31, Math.max(1, Math.trunc(parsed)));
}

export const MONTHLY_BILLING_DAY = parseBillingDay(process.env.NEXT_PUBLIC_MONTHLY_BILLING_DAY);

/**
 * Parsea cualquier fecha (ISO string, YYYY-MM-DD, Date) a la medianoche LOCAL exacta.
 * Evita desfasajes de zona horaria (UTC vs America/Lima) que causan que las fechas
 * retrocedan 1 día o cambien entre distintas PCs.
 */
export function parseLocalDate(dateInput?: string | Date | null): Date | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0);
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  // Extraer solo la parte YYYY-MM-DD ignorando la hora y sufijos UTC 'Z'
  const dateOnly = str.split('T')[0].split(' ')[0].replace(/Z$/i, '');

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [y, m, d] = dateOnly.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateOnly)) {
    const [d, m, y] = dateOnly.split('/').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Obtiene la fecha de hoy a las 00:00:00.000 locales.
 */
export function getTodayLocalMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Formatea una fecha en formato peruano DD/MM/YYYY sin desfasajes.
 */
export function formatDatePeru(dateInput?: string | Date | null): string {
  const parsed = parseLocalDate(dateInput);
  if (!parsed) return '—';
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calcula la diferencia en días enteros entre una fecha objetivo y la fecha base (hoy por defecto).
 */
export function getDiffDays(targetDate?: string | Date | null, baseDate?: Date): number {
  const target = parseLocalDate(targetDate);
  if (!target) return 9999;
  const base = baseDate ? parseLocalDate(baseDate)! : getTodayLocalMidnight();
  const diffTime = target.getTime() - base.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

