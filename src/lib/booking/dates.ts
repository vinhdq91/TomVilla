// Date helpers. Booking dates are plain "YYYY-MM-DD" text (no time zone surprises).

export const VILLA_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const DAY = 86_400_000;
const toTime = (iso: string) => Date.parse(iso + 'T00:00:00Z');
const fromTime = (t: number) => new Date(t).toISOString().slice(0, 10);

export const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && fromTime(toTime(v)) === v;

export const addDays = (iso: string, days: number) => fromTime(toTime(iso) + days * DAY);

export const addMonths = (iso: string, months: number) => {
  const d = new Date(toTime(iso));
  d.setUTCMonth(d.getUTCMonth() + months);
  return fromTime(d.getTime());
};

/** Number of nights between check-in and check-out. */
export const nightsBetween = (checkin: string, checkout: string) => Math.round((toTime(checkout) - toTime(checkin)) / DAY);

/** 0 = Sunday ... 6 = Saturday */
export const weekday = (iso: string) => new Date(toTime(iso)).getUTCDay();

/** Today's date at the villa (Vietnam time). */
export const todayAtVilla = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: VILLA_TIME_ZONE });

/** e.g. "Fri 12 Dec 2026" */
export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(toTime(iso)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });

/** Do the stays [aStart, aEnd) and [bStart, bEnd) share at least one night? */
export const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;
