import type { APIRoute } from 'astro';
import { addDays } from '../lib/booking/dates';
import { getCalendarEvents } from '../lib/booking/server';

export const prerender = false;

// The villa's calendar for Airbnb / Booking.com ("import calendar").
// Contains dates only — no guest names or details.

const compact = (iso: string) => iso.replaceAll('-', '');

export const GET: APIRoute = async ({ url }) => {
  const { booked, closed } = await getCalendarEvents();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const event = (uid: string, start: string, end: string, summary: string) => [
    'BEGIN:VEVENT',
    `UID:${uid}@${url.hostname}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(start)}`,
    `DTEND;VALUE=DATE:${compact(end)}`,
    `SUMMARY:${summary}`,
    'END:VEVENT',
  ];

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tom Villa//Bookings//EN',
    'CALSCALE:GREGORIAN',
    ...booked.flatMap((b) => event(`booking-${b.id}`, b.checkin, b.checkout, 'Booked')),
    ...closed.flatMap((b) => event(`block-${b.id}`, b.start, b.end > b.start ? b.end : addDays(b.start, 1), 'Not available')),
    'END:VCALENDAR',
  ];

  return new Response(lines.join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
};
