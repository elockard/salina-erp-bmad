/**
 * Tenant Server Actions
 *
 * Server Actions for tenant management operations including branding,
 * locale configuration, data export, and feature flag initialization.
 *
 * @see Story 1.5: Build Tenant Provisioning Workflow
 * @see docs/architecture.md:866-948 for Server Action pattern
 */

'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '../../db'
import { withTenantContext } from '../../db/tenant-context'
import { tenants, tenantFeatures } from '../../db/schema'
import { logger } from '@/lib/logger'
import { brandingSchema, localeSchema } from '@/validators/tenant'
import { eq } from 'drizzle-orm'

/**
 * Subscription Tier Type
 */
export type SubscriptionTier = 'starter' | 'professional' | 'enterprise'

/**
 * Feature Flag Configuration by Tier
 *
 * Defines feature limits for each subscription tier.
 *
 * @see Story 1.5 Task 2 for tier specifications
 * @see docs/sprint-artifacts/1-5-build-tenant-provisioning-workflow.md:263-271
 */
const TIER_LIMITS: Record<
  SubscriptionTier,
  Array<{ featureKey: string; enabled: boolean; limit: number | null }>
> = {
  starter: [
    { featureKey: 'titles_limit', enabled: true, limit: 50 },
    { featureKey: 'users_limit', enabled: true, limit: 5 },
    { featureKey: 'orders_per_month', enabled: true, limit: 100 },
  ],
  professional: [
    { featureKey: 'titles_limit', enabled: true, limit: 500 },
    { featureKey: 'users_limit', enabled: true, limit: 25 },
    { featureKey: 'orders_per_month', enabled: true, limit: 5000 },
  ],
  enterprise: [
    { featureKey: 'titles_limit', enabled: true, limit: null }, // Unlimited
    { featureKey: 'users_limit', enabled: true, limit: null }, // Unlimited
    { featureKey: 'orders_per_month', enabled: true, limit: null }, // Unlimited
  ],
}

/**
 * initializeFeatureFlags()
 *
 * Initialize feature flags for a newly created tenant based on subscription tier.
 * Called automatically after tenant provisioning (organization.created webhook).
 *
 * @param tenantId - UUID of the tenant to initialize
 * @param tier - Subscription tier ('starter', 'professional', 'enterprise')
 * @returns Promise<void>
 * @throws Error if feature flag creation fails
 *
 * @example
 * ```typescript
 * // Called from organization.created webhook handler
 * await initializeFeatureFlags(tenantId, 'starter')
 * ```
 */
export async function initializeFeatureFlags(
  tenantId: string,
  tier: SubscriptionTier
): Promise<void> {
  logger.info('Initializing feature flags', { tenantId, tier })

  try {
    const features = TIER_LIMITS[tier]

    await withTenantContext(tenantId, async (tx) => {
      // Insert all feature flags for this tier
      for (const feature of features) {
        await tx.insert(tenantFeatures).values({
          tenantId,
          tenantIdRef: tenantId,
          featureKey: feature.featureKey,
          enabled: feature.enabled,
          metadata: JSON.stringify({ limit: feature.limit }),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    })

    logger.info('Feature flags initialized successfully', {
      tenantId,
      tier,
      featureCount: features.length,
    })
  } catch (error) {
    logger.error('Failed to initialize feature flags', {
      error,
      tenantId,
      tier,
    })
    throw error
  }
}

/**
 * updateTenantBranding()
 *
 * Update tenant branding settings (logo URL, primary color, secondary color).
 * Called from CompanySettingsForm client component.
 *
 * @param formData - FormData containing branding fields
 * @returns Promise<{success: true} | {success: false, error: string, message: string}>
 *
 * @example
 * ```typescript
 * const result = await updateTenantBranding(formData)
 * if (result.success) {
 *   toast.success('Branding updated')
 * } else {
 *   toast.error(result.message)
 * }
 * ```
 */
export async function updateTenantBranding(
  formData: FormData
): Promise<
  | { success: true }
  | { success: false; error: string; message: string }
> {
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Not authenticated',
    }
  }

  try {
    // Validate form data
    const validated = brandingSchema.parse({
      logoUrl: formData.get('logoUrl') || '',
      primaryColor: formData.get('primaryColor'),
      secondaryColor: formData.get('secondaryColor'),
    })

    await withTenantContext(orgId, async (tx) => {
      // Fetch current tenant
      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, orgId))
        .limit(1)

      if (!tenant) {
        throw new Error('Tenant not found')
      }

      // Parse existing settings
      const settings = JSON.parse(tenant.settings || '{}')

      // Update branding section
      settings.branding = {
        ...settings.branding,
        ...validated,
      }

      // Save back to database
      await tx
        .update(tenants)
        .set({
          settings: JSON.stringify(settings),
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id))
    })

    logger.info('Tenant branding updated', { tenantId: orgId, userId })

    revalidatePath('/settings/company')

    return { success: true }
  } catch (error) {
    logger.error('Failed to update tenant branding', {
      error,
      tenantId: orgId,
      userId,
    })

    return {
      success: false,
      error: 'UPDATE_FAILED',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to update branding',
    }
  }
}

/**
 * updateTenantLocale()
 *
 * Update tenant locale settings (timezone, currency, measurement system, language).
 * Called from CompanySettingsForm client component.
 *
 * @param formData - FormData containing locale fields
 * @returns Promise<{success: true} | {success: false, error: string, message: string}>
 */
export async function updateTenantLocale(
  formData: FormData
): Promise<
  | { success: true }
  | { success: false; error: string; message: string }
> {
  const { userId, orgId } = await auth()

  if (!userId || !orgId) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Not authenticated',
    }
  }

  try {
    // Validate form data
    const validated = localeSchema.parse({
      timezone: formData.get('timezone'),
      currency: formData.get('currency'),
      measurementSystem: formData.get('measurementSystem'),
      language: formData.get('language'),
    })

    await withTenantContext(orgId, async (tx) => {
      // Fetch current tenant
      const [tenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.clerkOrgId, orgId))
        .limit(1)

      if (!tenant) {
        throw new Error('Tenant not found')
      }

      // Parse existing settings
      const settings = JSON.parse(tenant.settings || '{}')

      // Update locale section
      settings.locale = {
        ...settings.locale,
        ...validated,
      }

      // Save back to database
      await tx
        .update(tenants)
        .set({
          settings: JSON.stringify(settings),
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id))
    })

    logger.info('Tenant locale updated', { tenantId: orgId, userId })

    revalidatePath('/settings/company')

    return { success: true }
  } catch (error) {
    logger.error('Failed to update tenant locale', {
      error,
      tenantId: orgId,
      userId,
    })

    return {
      success: false,
      error: 'UPDATE_FAILED',
      message:
        error instanceof Error ? error.message : 'Failed to update locale',
    }
  }
}
