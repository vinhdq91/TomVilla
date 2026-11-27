// Server-only booking functions (Cloudflare D1). Never import this in browser code.
import { env } from 'cloudflare:workers';
import { getEntry } from 'astro:content';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq, gt, gte, inArray, or, asc } from 'drizzle-orm';
import * as schema from '../../db/schema';
import { bookings, blocks, type Booking } from '../../db/schema';
import { getFeedBookings, type BookedRange } from './availability';
import { addMonths, todayAtVilla, overlaps } from './dates';
import { amountDueNow, quote } from './pricing';

export const getDb = () => drizzle(env.DB, { schema });

export async function getBookingSettings() {
  return (await getEntry('booking', 'booking'))!.data;
}

/** SQL condition: bookings that currently hold their dates. */
export const holdsDates = (now: number) =>
  or(inArray(bookings.status, ['paid', 'confirmed']), and(eq(bookings.status, 'pending'), gt(bookings.holdExpiresAt, now)));

/** Every unavailable stay from today on: direct bookings, owner blocks and other platforms. */
export async function getUnavailable(): Promise<BookedRange[]> {
  const db = getDb();
  const today = todayAtVilla();
  const settings = await getBookingSettings();
  const [own, closed, external] = await Promise.all([
    db.select({ start: bookings.checkin, end: bookings.checkout }).from(bookings).where(and(holdsDates(Date.now()), gt(bookings.checkout, today))),
    db.select({ start: blocks.start, end: blocks.end }).from(blocks).where(gt(blocks.end, today)),
    getFeedBookings(settings.calendarFeeds),
  ]);
  return [
    ...own.map((r) => ({ ...r, source: 'direct' })),
    ...closed.map((r) => ({ ...r, source: 'blocked' })),
    ...external.filter((r) => r.end > today),
  ];
}

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I/L, easy to read aloud
function randomString(length: number, chars = CODE_CHARS) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export interface BookingRequest {
  checkin: string;
  checkout: string;
  guests: number;
  name: string;
  email: string;
  phone: string;
  contactMethod: 'whatsapp' | 'zalo' | 'email';
  message?: string;
  paymentOption: number;
  paymentMethod: 'vietqr';
}

/** A problem the guest can fix (shown to them as is). */
export class BookingError extends Error {}

/** Creates a booking that holds the dates, or throws a BookingError. */
export async function createBooking(req: BookingRequest): Promise<Booking> {
  const settings = await getBookingSettings();
  const today = todayAtVilla();

  if (req.checkin < today) throw new BookingError('Check-in date is in the past.');
  if (req.checkout > addMonths(today, settings.bookAheadMonths)) throw new BookingError('These dates are too far ahead to book yet.');
  if (req.guests < 1 || req.guests > settings.maxGuests) throw new BookingError(`The villa sleeps up to ${settings.maxGuests} guests.`);
  if (!(settings.paymentOptions as string[]).includes(String(req.paymentOption))) throw new BookingError('Please choose a payment option.');

  let q;
  try {
    q = quote(settings, req.checkin, req.checkout);
  } catch (e) {
    throw new BookingError((e as Error).message);
  }

  // Dates taken on Airbnb / Booking.com, checked live right now.
  const external = await getFeedBookings(settings.calendarFeeds);
  if (external.some((r) => overlaps(req.checkin, req.checkout, r.start, r.end))) {
    throw new BookingError('Sorry, these dates have just been booked. Please choose other dates.');
  }

  const now = Date.now();
  const row = {
    code: 'TV' + randomString(6),
    token: randomString(24, 'abcdefghijkmnpqrstuvwxyz23456789'),
    status: 'pending' as const,
    checkin: req.checkin,
    checkout: req.checkout,
    nights: q.nights.length,
    guests: req.guests,
    name: req.name,
    email: req.email,
    phone: req.phone,
    contactMethod: req.contactMethod,
    message: req.message || null,
    total: q.total,
    paymentOption: req.paymentOption,
    amountDue: amountDueNow(q.total, req.paymentOption),
    amountPaid: 0,
    paymentMethod: req.paymentMethod,
    priceDetails: JSON.stringify({ nights: q.nights, cleaningFee: q.cleaningFee }),
    cancellationDays: settings.cancellationDays,
    holdExpiresAt: now + settings.holdHours * 3_600_000,
    ownerNotes: null,
    createdAt: now,
    updatedAt: now,
  } satisfies Omit<Booking, 'id'>;

  // A single SQL statement: insert only if no other booking or block overlaps.
  // The database runs it in one go, so two guests can never take the same dates.
  const cols = Object.keys(row).map((k) => k.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase()));
  const result = await env.DB.prepare(
    `INSERT INTO bookings (${cols.join(', ')})
     SELECT ${cols.map(() => '?').join(', ')}
     WHERE NOT EXISTS (
       SELECT 1 FROM bookings
       WHERE checkin < ? AND checkout > ?
         AND (status IN ('paid', 'confirmed') OR (status = 'pending' AND hold_expires_at > ?))
     )
     AND NOT EXISTS (SELECT 1 FROM blocks WHERE start < ? AND "end" > ?)`,
  )
    .bind(...Object.values(row), req.checkout, req.checkin, now, req.checkout, req.checkin)
    .run();

  if (!result.meta.changes) throw new BookingError('Sorry, these dates are no longer available. Please choose other dates.');
  return (await getDb().select().from(bookings).where(eq(bookings.code, row.code)).get())!;
}

export const getBookingByToken = (token: string) => getDb().select().from(bookings).where(eq(bookings.token, token)).get();

/** Paid/confirmed bookings and blocks from today on, for the calendar export. */
export async function getCalendarEvents() {
  const db = getDb();
  const today = todayAtVilla();
  const [booked, closed] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(and(inArray(bookings.status, ['paid', 'confirmed']), gte(bookings.checkout, today)))
      .orderBy(asc(bookings.checkin)),
    db.select().from(blocks).where(gte(blocks.end, today)),
  ]);
  return { booked, closed };
}

/** What the guest and owner see, including the time-based states. */
export function displayStatus(b: Booking, now = Date.now(), today = todayAtVilla()) {
  if (b.status === 'cancelled') return 'cancelled';
  if (b.status === 'pending' && b.holdExpiresAt <= now) return 'expired';
  if (b.status === 'confirmed' && b.checkout <= today) return 'completed';
  return b.status;
}
export type DisplayStatus = ReturnType<typeof displayStatus>;

export const statusLabels: Record<DisplayStatus, string> = {
  pending: 'Awaiting payment',
  expired: 'Hold expired',
  paid: 'Paid – to confirm',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
