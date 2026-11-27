import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// Booking database (Cloudflare D1). After changing this file run `npm run db:generate`
// to create a new SQL migration in ./migrations.

/** Status of a direct booking. "Expired" and "completed" are worked out from the dates. */
export const bookingStatuses = ['pending', 'paid', 'confirmed', 'cancelled'] as const;
export type BookingStatus = (typeof bookingStatuses)[number];

export const bookings = sqliteTable(
  'bookings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** Shown to the guest and used as the bank transfer note, e.g. TV7K3QX9 */
    code: text('code').notNull().unique(),
    /** Secret part of the guest's booking page link */
    token: text('token').notNull().unique(),
    status: text('status', { enum: bookingStatuses }).notNull().default('pending'),

    checkin: text('checkin').notNull(), // YYYY-MM-DD
    checkout: text('checkout').notNull(), // YYYY-MM-DD (day of departure)
    nights: integer('nights').notNull(),
    guests: integer('guests').notNull(),

    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone').notNull(),
    contactMethod: text('contact_method').notNull(), // whatsapp | zalo | email
    message: text('message'),

    /** Amounts in VND */
    total: integer('total').notNull(),
    /** 30, 50 or 100 (% paid in advance) */
    paymentOption: integer('payment_option').notNull(),
    amountDue: integer('amount_due').notNull(),
    amountPaid: integer('amount_paid').notNull().default(0),
    paymentMethod: text('payment_method').notNull(), // vietqr | paypal
    /** JSON: nightly prices and fees at the time of booking */
    priceDetails: text('price_details').notNull(),
    /** Free cancellation up to this many days before arrival (copied from settings) */
    cancellationDays: integer('cancellation_days').notNull(),

    /** Unpaid bookings stop holding the dates after this time (ms since 1970) */
    holdExpiresAt: integer('hold_expires_at').notNull(),
    ownerNotes: text('owner_notes'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [index('bookings_dates').on(t.checkin, t.checkout)],
);

/** Dates the owner closed (maintenance, family visits...). */
export const blocks = sqliteTable('blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  start: text('start').notNull(), // first closed night, YYYY-MM-DD
  end: text('end').notNull(), // first open day again, YYYY-MM-DD
  reason: text('reason'),
  createdAt: integer('created_at').notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type Block = typeof blocks.$inferSelect;
