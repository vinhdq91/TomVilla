import { defineConfig } from 'drizzle-kit';

// Only used to generate SQL migrations from src/db/schema.ts (`npm run db:generate`).
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './migrations',
});
