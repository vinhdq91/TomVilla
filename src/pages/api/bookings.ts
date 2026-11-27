import type { APIRoute } from 'astro';
import { z } from 'astro/zod';
import { isIsoDate } from '../../lib/booking/dates';
import { BookingError, createBooking } from '../../lib/booking/server';

export const prerender = false;

const isoDate = z.string().refine(isIsoDate, 'Invalid date');

const BookingInput = z.object({
  checkin: isoDate,
  checkout: isoDate,
  guests: z.coerce.number().int(),
  name: z.string().trim().min(2, 'Please enter your name.').max(100),
  email: z.string().trim().pipe(z.email('Please enter a valid email address.').max(200)),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s().-]{7,20}$/, 'Please enter a valid phone number.'),
  contactMethod: z.enum(['whatsapp', 'zalo', 'email']),
  message: z.string().trim().max(1000).optional(),
  paymentOption: z.coerce.number().int(),
  paymentMethod: z.literal('vietqr'),
  // Hidden field that people never fill in, but spam bots often do.
  website: z.string().max(0).optional(),
});

/** Creates a booking and returns the link to the guest's booking page. */
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = BookingInput.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? 'Please check the form.' }, { status: 400 });
  }

  const { website: _honeypot, ...input } = parsed.data;
  try {
    const booking = await createBooking(input);
    return Response.json({ url: `/booking/${booking.token}` }, { status: 201 });
  } catch (e) {
    if (e instanceof BookingError) return Response.json({ error: e.message }, { status: 409 });
    console.error('Booking failed', e);
    return Response.json({ error: 'Something went wrong. Please try again or contact us on WhatsApp.' }, { status: 500 });
  }
};
