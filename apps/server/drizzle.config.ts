import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { env } from './src/lib/env';

export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
