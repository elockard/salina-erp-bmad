import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

// Load .env.local first, then fall back to .env
config({ path: '.env.local' })
config({ path: '.env' })

export default {
  schema: './db/schema/*',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
