/**
 * Vitest Setup File
 *
 * Runs before all test files to configure global test environment
 */

import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local for testing
config({ path: path.resolve(__dirname, '../.env.local') })

// Fallback to .env.example if .env.local doesn't exist
if (!process.env.DATABASE_URL) {
  config({ path: path.resolve(__dirname, '../.env.example') })
}
