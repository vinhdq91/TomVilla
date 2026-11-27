import type { APIRoute } from 'astro';
import { getUnavailable } from '../../lib/booking/server';

export const prerender = false;

/** Booked stays for the calendar on /book (dates only, no guest details). */
export const GET: APIRoute = async () => {
  const booked = (await getUnavailable()).map(({ start, end }) => ({ start, end }));
  return Response.json({ booked }, { headers: { 'Cache-Control': 'no-store' } });
};
