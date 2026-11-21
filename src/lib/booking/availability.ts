// Single source of truth for booked dates.
//
// v1: reads iCal feeds exported from Airbnb / Booking.com.
// v2: will also read direct bookings from Cloudflare D1 — only this file changes,
//     the calendar UI keeps calling getBookedDates().

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

export async function getBookedDates(feeds: IcalFeed[]): Promise<BookedRange[]> {
  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const res = await fetch(feed.url);
      if (!res.ok) throw new Error(`${feed.source}: HTTP ${res.status}`);
      return parseIcal(await res.text(), feed.source);
    }),
  );
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
