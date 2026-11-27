// Dates booked on other platforms (Airbnb, Booking.com...), read from their iCal links.
// Direct bookings and owner blocks come from the database (see ./server.ts).

export interface BookedRange {
  /** First booked night, YYYY-MM-DD */
  start: string;
  /** Check-out day (not booked), YYYY-MM-DD */
  end: string;
  source: string;
}

export interface IcalFeed {
  source: string;
  url: string;
}

export async function getFeedBookings(feeds: IcalFeed[]): Promise<BookedRange[]> {
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      // Cloudflare caches each feed for 5 minutes so busy pages don't hammer the platforms.
      const res = await fetch(feed.url, { cf: { cacheTtl: 300, cacheEverything: true } } as RequestInit);
      if (!res.ok) throw new Error(`${feed.source}: HTTP ${res.status}`);
      return parseIcal(await res.text(), feed.source);
    }),
  );
  for (const r of results) if (r.status === 'rejected') console.error('Calendar sync failed:', r.reason);
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

const toIsoDate = (v: string) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;

export function parseIcal(text: string, source: string): BookedRange[] {
  const ranges: BookedRange[] = [];
  for (const event of text.split('BEGIN:VEVENT').slice(1)) {
    const start = event.match(/DTSTART[^:]*:(\d{8})/)?.[1];
    const end = event.match(/DTEND[^:]*:(\d{8})/)?.[1];
    if (start && end) ranges.push({ start: toIsoDate(start), end: toIsoDate(end), source });
  }
  return ranges;
}
