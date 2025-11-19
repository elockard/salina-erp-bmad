/**
 * Grant Permissions Script
 *
 * Applies GRANT permissions for tenant_features table to authenticated role.
 * Run this once after creating the tenant_features table.
 */

import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL not set in .env.local')
  process.exit(1)
}

const sql = postgres(connectionString)

async function grantPermissions() {
  try {
    console.log('Granting permissions on tenant_features...')

    await sql`
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE tenant_features TO authenticated
    `

    console.log('✓ Permissions granted successfully')
    await sql.end()
  } catch (error) {
    console.error('Failed to grant permissions:', error)
    await sql.end()
    process.exit(1)
  }
}

grantPermissions()
