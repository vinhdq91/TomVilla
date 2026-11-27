import { config, fields, collection, singleton } from '@keystatic/core';
import { amenityIcons } from './src/lib/icons';
import { galleryCategories } from './src/lib/gallery';
import { banks } from './src/lib/booking/banks';

// Everything editable in the admin panel (/keystatic) is defined here.
// Content is saved as YAML files in src/content and images in src/assets/images.

const iconSelect = (label: string) =>
  fields.select({
    label,
    options: amenityIcons.map((i) => ({ label: i.label, value: i.value })),
    defaultValue: amenityIcons[0].value,
  });

export default config({
  // Live site: edits are saved as commits to GitHub, which triggers a Cloudflare rebuild.
  // `npm run admin`: edits are saved straight to files on this computer.
  // `npm run admin:github`: local admin in GitHub mode (used once to create the GitHub App).
  storage:
    import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_STORAGE === 'github'
      ? { kind: 'github', repo: 'vinhdq91/TomVilla' }
      : { kind: 'local' },
  ui: { brand: { name: 'Tom Villa' } },

  singletons: {
    site: singleton({
      label: 'Site settings & contact',
      path: 'src/content/singletons/site',
      format: { data: 'yaml' },
      schema: {
        name: fields.text({ label: 'Villa name' }),
        tagline: fields.text({ label: 'Tagline' }),
        seoDescription: fields.text({ label: 'Description for Google', multiline: true }),
        whatsapp: fields.text({ label: 'WhatsApp number', description: 'International format, digits only, e.g. 84901234567' }),
        zalo: fields.text({ label: 'Zalo number', description: 'e.g. 0901234567' }),
        phone: fields.text({ label: 'Phone (as displayed)' }),
        email: fields.text({ label: 'Email' }),
        address: fields.text({ label: 'Address', multiline: true }),
        mapQuery: fields.text({ label: 'Google Maps search', description: 'Address or place name used for the map' }),
        hideFromSearch: fields.checkbox({
          label: 'Hide from Google',
          description: 'Keep ticked until the real photos and details are in, then untick to launch.',
          defaultValue: true,
        }),
      },
    }),

    booking: singleton({
      label: 'Booking & prices',
      path: 'src/content/singletons/booking',
      format: { data: 'yaml' },
      schema: {
        nightlyPrice: fields.integer({
          label: 'Nightly price (VND)',
          description: 'Normal price per night, e.g. 2500000',
          validation: { isRequired: true, min: 0 },
          defaultValue: 2500000,
        }),
        weekendPrice: fields.integer({
          label: 'Weekend price (VND)',
          description: 'Price for Friday and Saturday nights. Leave 0 to use the nightly price.',
          defaultValue: 0,
          validation: { min: 0 },
        }),
        minNights: fields.integer({ label: 'Minimum nights', defaultValue: 2, validation: { isRequired: true, min: 1 } }),
        maxGuests: fields.integer({ label: 'Maximum guests', defaultValue: 8, validation: { isRequired: true, min: 1 } }),
        cleaningFee: fields.integer({
          label: 'Cleaning fee (VND)',
          description: 'Added once per stay. 0 for none.',
          defaultValue: 0,
          validation: { min: 0 },
        }),
        seasons: fields.array(
          fields.object({
            name: fields.text({ label: 'Season name', description: 'e.g. Tết holiday, Summer' }),
            start: fields.date({ label: 'First night', validation: { isRequired: true } }),
            end: fields.date({ label: 'Last night', validation: { isRequired: true } }),
            nightlyPrice: fields.integer({ label: 'Nightly price (VND)', validation: { isRequired: true, min: 0 } }),
            weekendPrice: fields.integer({
              label: 'Weekend price (VND)',
              description: 'Friday and Saturday nights. 0 = same as the nightly price.',
              defaultValue: 0,
            }),
            minNights: fields.integer({
              label: 'Minimum nights',
              description: '0 = use the normal minimum.',
              defaultValue: 0,
            }),
          }),
          {
            label: 'Seasonal prices',
            description: 'Nights inside a season use its price instead of the normal one.',
            itemLabel: (p) => `${p.fields.name.value || 'Season'} (${p.fields.start.value ?? '?'} → ${p.fields.end.value ?? '?'})`,
          },
        ),
        paymentOptions: fields.multiselect({
          label: 'Payment choices for guests',
          options: [
            { label: '30% deposit', value: '30' },
            { label: '50% deposit', value: '50' },
            { label: 'Pay in full', value: '100' },
          ],
          defaultValue: ['30', '50', '100'],
        }),
        cancellationDays: fields.select({
          label: 'Free cancellation',
          description: 'Guests get their payment back if they cancel at least this long before arrival.',
          options: [
            { label: 'Up to 7 days before arrival', value: '7' },
            { label: 'Up to 14 days before arrival', value: '14' },
          ],
          defaultValue: '14',
        }),
        holdHours: fields.integer({
          label: 'Hold dates while unpaid (hours)',
          description: 'Dates are released if the guest has not paid within this time.',
          defaultValue: 2,
          validation: { isRequired: true, min: 1 },
        }),
        bookAheadMonths: fields.integer({
          label: 'Bookable months ahead',
          defaultValue: 12,
          validation: { isRequired: true, min: 1 },
        }),
        bank: fields.object(
          {
            bin: fields.select({
              label: 'Bank',
              options: banks.map((b) => ({ label: b.label, value: b.value })),
              defaultValue: banks[0].value,
            }),
            accountNumber: fields.text({ label: 'Account number' }),
            accountName: fields.text({ label: 'Account holder name', description: 'As on the bank account, e.g. NGUYEN VAN A' }),
          },
          { label: 'Bank account for VietQR payments' },
        ),
        calendarFeeds: fields.array(
          fields.object({
            source: fields.text({ label: 'Name', description: 'e.g. Airbnb, Booking.com' }),
            url: fields.url({ label: 'Calendar (iCal) link', validation: { isRequired: true } }),
          }),
          {
            label: 'Calendar sync links',
            description: 'Dates booked on these platforms are blocked on this website.',
            itemLabel: (p) => p.fields.source.value || 'Calendar',
          },
        ),
        intro: fields.text({ label: 'Booking page intro', multiline: true }),
        houseRules: fields.text({ label: 'House rules', multiline: true }),
      },
    }),

    home: singleton({
      label: 'Home page',
      path: 'src/content/singletons/home',
      format: { data: 'yaml' },
      schema: {
        hero: fields.object(
          {
            title: fields.text({ label: 'Title' }),
            subtitle: fields.text({ label: 'Subtitle' }),
            text: fields.text({ label: 'Intro text', multiline: true }),
            buttonLabel: fields.text({ label: 'Button label' }),
            image: fields.image({
              label: 'Background photo',
              directory: 'src/assets/images/home',
              publicPath: '../../assets/images/home/',
              validation: { isRequired: true },
            }),
          },
          { label: 'Hero (top of page)' },
        ),
        villa: fields.object(
          {
            eyebrow: fields.text({ label: 'Small label' }),
            heading: fields.text({ label: 'Heading' }),
            text: fields.text({ label: 'Text', multiline: true }),
            amenities: fields.array(
              fields.object({ icon: iconSelect('Icon'), label: fields.text({ label: 'Label' }) }),
              { label: 'Amenities', itemLabel: (p) => p.fields.label.value },
            ),
          },
          { label: 'The Villa section' },
        ),
        stay: fields.object(
          {
            eyebrow: fields.text({ label: 'Small label' }),
            heading: fields.text({ label: 'Heading' }),
            steps: fields.array(
              fields.object({
                icon: iconSelect('Icon'),
                title: fields.text({ label: 'Title' }),
                text: fields.text({ label: 'Text', multiline: true }),
              }),
              { label: 'Steps', itemLabel: (p) => p.fields.title.value },
            ),
            bookingTitle: fields.text({ label: 'Booking card title' }),
            bookingText: fields.text({ label: 'Booking card text', multiline: true }),
          },
          { label: 'Your Stay section' },
        ),
        location: fields.object(
          {
            eyebrow: fields.text({ label: 'Small label' }),
            heading: fields.text({ label: 'Heading' }),
            text: fields.text({ label: 'Text', multiline: true }),
            image: fields.image({
              label: 'Photo',
              directory: 'src/assets/images/home',
              publicPath: '../../assets/images/home/',
            }),
            distances: fields.array(
              fields.object({ place: fields.text({ label: 'Place' }), time: fields.text({ label: 'Travel time' }) }),
              { label: 'Nearby places', itemLabel: (p) => p.fields.place.value },
            ),
          },
          { label: 'Location section' },
        ),
        faqs: fields.array(
          fields.object({
            question: fields.text({ label: 'Question' }),
            answer: fields.text({ label: 'Answer', multiline: true }),
          }),
          { label: 'FAQs', itemLabel: (p) => p.fields.question.value },
        ),
      },
    }),
  },

  collections: {
    gallery: collection({
      label: 'Gallery photos',
      slugField: 'caption',
      path: 'src/content/gallery/*',
      format: { data: 'yaml' },
      columns: ['caption', 'category', 'order'],
      schema: {
        caption: fields.slug({ name: { label: 'Caption', description: 'Short description, also used for accessibility' } }),
        category: fields.select({
          label: 'Category',
          options: galleryCategories.map((c) => ({ label: c.label, value: c.value })),
          defaultValue: galleryCategories[0].value,
        }),
        order: fields.integer({ label: 'Display order', description: 'Lower numbers appear first', defaultValue: 10 }),
        image: fields.image({
          label: 'Photo',
          directory: 'src/assets/images/gallery',
          publicPath: '../../assets/images/gallery/',
          validation: { isRequired: true },
        }),
      },
    }),
    spaces: collection({
      label: 'Villa spaces (photo cards)',
      slugField: 'name',
      path: 'src/content/spaces/*',
      format: { data: 'yaml' },
      columns: ['name', 'order'],
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        order: fields.integer({ label: 'Display order', defaultValue: 1 }),
        summary: fields.text({ label: 'Short description', multiline: true }),
        image: fields.image({
          label: 'Photo',
          directory: 'src/assets/images/spaces',
          publicPath: '../../assets/images/spaces/',
          validation: { isRequired: true },
        }),
      },
    }),
  },
});
