// Site navigation, used by the sidebar, header and mobile menu.
// Links starting with "/#" are sections of the home page (highlighted while scrolling).
export const nav = [
  { href: '/#home', label: 'Home' },
  { href: '/#villa', label: 'The Villa' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/#stay', label: 'Your Stay' },
  { href: '/#location', label: 'Location' },
  { href: '/#faqs', label: 'FAQs' },
  { href: '/#contact', label: 'Contact' },
] as const;

/** Section id for home-page links, e.g. "/#villa" -> "villa". */
export const sectionId = (href: string) => (href.startsWith('/#') ? href.slice(2) : undefined);

/** True when `href` is the page currently open (not used for home sections). */
export const isCurrentPage = (href: string, pathname: string) =>
  !href.includes('#') && pathname.replace(/\/$/, '') === href;
