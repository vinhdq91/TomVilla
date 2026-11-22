import { config, fields, collection, singleton } from '@keystatic/core';
import { amenityIcons } from './src/lib/icons';
import { galleryCategories } from './src/lib/gallery';

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
