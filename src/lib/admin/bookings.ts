// Owner dashboard helpers: lists, actions and ready-written messages to guests.
import { and, asc, desc, eq, gte, lt, ne, gt } from 'drizzle-orm';
import { bookings, blocks, type Booking } from '../../db/schema';
import { formatDate, overlaps, todayAtVilla, VILLA_TIME_ZONE } from '../booking/dates';
import { formatVnd } from '../booking/pricing';
import { bankName } from '../booking/banks';
import { getDb, holdsDates, displayStatus } from '../booking/server';

export type View = 'upcoming' | 'pending' | 'past' | 'cancelled' | 'all';

export async function listBookings(view: View) {
  const db = getDb();
  const today = todayAtVilla();
  const all = await db
    .select()
    .from(bookings)
    .orderBy(view === 'past' || view === 'all' ? desc(bookings.checkin) : asc(bookings.checkin));
  return all.filter((b) => {
    const s = displayStatus(b);
    if (view === 'upcoming') return ['pending', 'paid', 'confirmed'].includes(s) && b.checkout > today;
    if (view === 'pending') return s === 'pending' || s === 'paid' || (s === 'expired' && b.checkout > today);
    if (view === 'past') return s === 'completed';
    if (view === 'cancelled') return s === 'cancelled' || s === 'expired';
    return true;
  });
}

export async function countAwaiting() {
  const now = Date.now();
  const rows = await getDb()
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(and(holdsDates(now), ne(bookings.status, 'confirmed')));
  return rows.length;
}

export const getBooking = (id: number) => getDb().select().from(bookings).where(eq(bookings.id, id)).get();

/** Another active booking or a block that overlaps these dates (to avoid double booking). */
export async function findClash(checkin: string, checkout: string, exceptId?: number) {
  const db = getDb();
  const other = await db
    .select()
    .from(bookings)
    .where(and(holdsDates(Date.now()), lt(bookings.checkin, checkout), gt(bookings.checkout, checkin)));
  const clash = other.find((b) => b.id !== exceptId);
  if (clash) return `dates overlap booking ${clash.code} (${clash.name})`;
  const closed = await db.select().from(blocks).where(and(lt(blocks.start, checkout), gt(blocks.end, checkin)));
  if (closed.length) return 'dates overlap closed dates';
  return null;
}

export async function updateBooking(id: number, values: Partial<Booking>) {
  await getDb()
    .update(bookings)
    .set({ ...values, updatedAt: Date.now() })
    .where(eq(bookings.id, id));
}

export const listBlocks = () => getDb().select().from(blocks).where(gte(blocks.end, todayAtVilla())).orderBy(asc(blocks.start));

export async function addBlock(start: string, end: string, reason: string) {
  const db = getDb();
  const clash = (await db.select().from(bookings).where(holdsDates(Date.now()))).find((b) => overlaps(start, end, b.checkin, b.checkout));
  if (clash) return `These dates overlap booking ${clash.code} (${clash.name}).`;
  await db.insert(blocks).values({ start, end, reason: reason || null, createdAt: Date.now() });
  return null;
}

export const removeBlock = (id: number) => getDb().delete(blocks).where(eq(blocks.id, id));

// ---- Contacting the guest ------------------------------------------------

/** Phone number for wa.me links: digits only, Vietnamese 0… numbers become 84… */
export function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return phone.trim().startsWith('+') ? digits : digits.replace(/^0/, '84');
}

/** Phone number for zalo.me links: Vietnamese numbers in 0… form. */
export function zaloNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('84') ? '0' + digits.slice(2) : digits;
}

interface MessageContext {
  villa: string;
  bookingUrl: string;
  bank: { bin: string; accountNumber: string; accountName: string };
}

/** Ready-written messages the owner can send on WhatsApp/Zalo. */
export function guestMessages(b: Booking, ctx: MessageContext) {
  const first = b.name.split(' ')[0];
  const dates = `${formatDate(b.checkin)} – ${formatDate(b.checkout)}`;
  const holdUntil = new Date(b.holdExpiresAt).toLocaleString('en-GB', { timeZone: VILLA_TIME_ZONE, hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
  const balance = Math.max(0, b.total - b.amountPaid);

  return [
    {
      id: 'reminder',
      label: 'Payment reminder',
      text: [
        `Hello ${first}, this is ${ctx.villa}. Thank you for your booking ${b.code} (${dates}).`,
        `We're holding your dates until ${holdUntil}. To confirm, please transfer ${formatVnd(b.amountDue)} to:`,
        `${bankName(ctx.bank.bin)} · ${ctx.bank.accountNumber} · ${ctx.bank.accountName}`,
        `Transfer note: ${b.code}`,
        `QR code and details: ${ctx.bookingUrl}`,
      ].join('\n'),
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
      text: [
        `Hello ${first}, your stay at ${ctx.villa} is confirmed! 🌿`,
        `${dates} · ${b.guests} guests · booking ${b.code}`,
        `We received ${formatVnd(b.amountPaid)}.${balance > 0 ? ` The balance of ${formatVnd(balance)} is paid at check-in.` : ''}`,
        `Your booking page: ${ctx.bookingUrl}`,
        `We'll send directions before you arrive. See you soon!`,
      ].join('\n'),
    },
    {
      id: 'cancelled',
      label: 'Cancellation',
      text: `Hello ${first}, this is ${ctx.villa}. Your booking ${b.code} (${dates}) has been cancelled. Please message us if you have any questions.`,
    },
  ];
}
