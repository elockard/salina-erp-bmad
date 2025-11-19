/**
 * Tenant Form Validation Schemas
 *
 * Zod schemas for validating tenant settings forms (branding, locale).
 * Shared between client (React Hook Form) and server (Server Actions).
 *
 * @see Story 1.5: Build Tenant Provisioning Workflow (Tasks 4-5)
 * @see docs/architecture.md:1015-1066 for form validation pattern
 */

import { z } from 'zod'

/**
 * Branding Schema
 *
 * Validates branding settings: logo URL, primary color, secondary color.
 * Colors must be valid hex format (#RRGGBB).
 */
export const brandingSchema = z.object({
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color (e.g., #1e3a8a)'),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color (e.g., #d97706)'),
})

export type BrandingFormData = z.infer<typeof brandingSchema>

/**
 * Locale Schema
 *
 * Validates locale settings: timezone, currency, measurement system, language.
 */
export const localeSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
  currency: z.string().length(3, 'Currency must be 3-letter ISO code (e.g., USD)'),
  measurementSystem: z.enum(['imperial', 'metric']),
  language: z.string().min(2, 'Language is required'),
})

export type LocaleFormData = z.infer<typeof localeSchema>
