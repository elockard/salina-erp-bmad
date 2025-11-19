import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Connection pooling configuration
// pgBouncer pattern from Architecture:236 - 100 max connections
const client = postgres(connectionString, {
  max: 100, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Timeout for establishing connection (seconds)
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  onnotice: () => {}, // Suppress NOTICE messages
  connection: {
    application_name: 'salina-erp',
  },
  // Handle connection errors with postgres-specific callback
  onclose: () => {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Database connection closed unexpectedly')
    }
  },
})

export const db = drizzle(client, {
  logger: process.env.NODE_ENV === 'development',
})

// Verify connection in development and test environments
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  try {
    const url = new URL(connectionString)
    if (process.env.NODE_ENV === 'development') {
      console.log('Database client initialized', {
        host: url.host,
        database: url.pathname.slice(1),
        ssl: false,
      })
    }
  } catch {
    // If URL parsing fails, just skip the log
    if (process.env.NODE_ENV === 'development') {
      console.log('Database client initialized')
    }
  }
} else {
  // Production: just log that we're attempting to connect
  console.log('Database client initialized (production mode)')
}
