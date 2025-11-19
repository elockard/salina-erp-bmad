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
})

export const db = drizzle(client, {
  logger: process.env.NODE_ENV === 'development',
})

// Log successful connection in development only
if (process.env.NODE_ENV === 'development') {
  try {
    const url = new URL(connectionString)
    console.log('Database client initialized', {
      host: url.host,
      database: url.pathname.slice(1),
    })
  } catch {
    // If URL parsing fails, just skip the log
    console.log('Database client initialized')
  }
}
