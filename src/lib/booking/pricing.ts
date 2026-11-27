// Price calculation, used by the booking page (instant price) and by the server
// (the price the guest pays is always recalculated on the server).
import { addDays, nightsBetween, weekday } from './dates';

export interface Season {
  name: string;
  start: string; // first night
  end: string; // last night
  nightlyPrice: number;
  weekendPrice: number; // 0 = same as nightly
  minNights: number; // 0 = normal minimum
}

export interface PricingSettings {
  nightlyPrice: number;
  weekendPrice: number;
  minNights: number;
  maxGuests: number;
  cleaningFee: number;
  seasons: Season[];
}

export interface Night {
  date: string;
  price: number;
  season?: string;
}

export interface Quote {
  checkin: string;
  checkout: string;
  nights: Night[];
  nightsTotal: number;
  cleaningFee: number;
  total: number;
  minNights: number;
}

const isWeekendNight = (date: string) => [5, 6].includes(weekday(date)); // Friday and Saturday nights

export function priceForNight(settings: PricingSettings, date: string): Night {
  const season = settings.seasons.find((s) => s.start <= date && date <= s.end);
  const weekend = isWeekendNight(date);
  if (season) {
    const price = weekend && season.weekendPrice > 0 ? season.weekendPrice : season.nightlyPrice;
    return { date, price, season: season.name };
  }
  const price = weekend && settings.weekendPrice > 0 ? settings.weekendPrice : settings.nightlyPrice;
  return { date, price };
}

/** Price for a stay. Throws a guest-friendly message if the stay is too short. */
export function quote(settings: PricingSettings, checkin: string, checkout: string): Quote {
  const count = nightsBetween(checkin, checkout);
  if (count < 1) throw new Error('Check-out must be after check-in.');
  const nights = Array.from({ length: count }, (_, i) => priceForNight(settings, addDays(checkin, i)));

  // The longest minimum of any season the stay touches.
  const minNights = Math.max(
    settings.minNights,
    ...settings.seasons.filter((s) => s.minNights > 0 && nights.some((n) => n.season === s.name)).map((s) => s.minNights),
  );
  if (count < minNights) throw new Error(`The minimum stay for these dates is ${minNights} nights.`);

  const nightsTotal = nights.reduce((sum, n) => sum + n.price, 0);
  return { checkin, checkout, nights, nightsTotal, cleaningFee: settings.cleaningFee, total: nightsTotal + settings.cleaningFee, minNights };
}

/** Amount paid when booking: a deposit rounded to 1,000 ₫, or the full price. */
export const amountDueNow = (total: number, percent: number) => (percent >= 100 ? total : Math.round((total * percent) / 100 / 1000) * 1000);

export const formatVnd = (amount: number) => `${amount.toLocaleString('en-US')} ₫`;

/** Groups consecutive nights with the same price for a short breakdown, e.g. "3 nights × 2,500,000 ₫". */
export function groupNights(nights: Night[]) {
  const groups: { count: number; price: number; season?: string }[] = [];
  for (const n of nights) {
    const last = groups.find((g) => g.price === n.price && g.season === n.season);
    if (last) last.count++;
    else groups.push({ count: 1, price: n.price, season: n.season });
  }
  return groups;
}
