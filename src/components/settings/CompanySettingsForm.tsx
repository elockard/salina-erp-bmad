/**
 * Company Settings Form
 *
 * Client component for editing tenant branding and locale settings.
 * Uses React Hook Form + Zod for validation, Server Actions for mutations.
 *
 * @see Story 1.5: Build Tenant Provisioning Workflow (Tasks 4-5)
 * @see docs/architecture.md:466-528 for client component pattern
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { brandingSchema, localeSchema } from '@/validators/tenant'
import type { BrandingFormData, LocaleFormData } from '@/validators/tenant'
import { updateTenantBranding, updateTenantLocale } from '@/actions/tenants'
import { toast } from 'sonner'

/**
 * CompanySettingsFormProps
 */
interface CompanySettingsFormProps {
  branding: {
    logoUrl?: string
    primaryColor: string
    secondaryColor: string
  }
  locale: {
    timezone: string
    currency: string
    measurementSystem: 'imperial' | 'metric'
    language: string
  }
}

/**
 * CompanySettingsForm Component
 *
 * Renders forms for branding and locale settings.
 * Submits to Server Actions and shows toast notifications.
 */
export function CompanySettingsForm({
  branding,
  locale,
}: CompanySettingsFormProps) {
  const [brandingLoading, setBrandingLoading] = useState(false)
  const [localeLoading, setLocaleLoading] = useState(false)

  // Branding form
  const brandingForm = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logoUrl: branding.logoUrl || '',
      primaryColor: branding.primaryColor || '#1e3a8a',
      secondaryColor: branding.secondaryColor || '#d97706',
    },
  })

  // Locale form
  const localeForm = useForm<LocaleFormData>({
    resolver: zodResolver(localeSchema),
    defaultValues: {
      timezone: locale.timezone || 'America/New_York',
      currency: locale.currency || 'USD',
      measurementSystem: locale.measurementSystem || 'imperial',
      language: locale.language || 'en-US',
    },
  })

  // Handle branding form submission
  const onSubmitBranding = async (data: BrandingFormData) => {
    setBrandingLoading(true)

    const formData = new FormData()
    formData.append('logoUrl', data.logoUrl || '')
    formData.append('primaryColor', data.primaryColor)
    formData.append('secondaryColor', data.secondaryColor)

    const result = await updateTenantBranding(formData)

    setBrandingLoading(false)

    if (result.success) {
      toast.success('Branding updated successfully')
    } else {
      toast.error(result.message)
    }
  }

  // Handle locale form submission
  const onSubmitLocale = async (data: LocaleFormData) => {
    setLocaleLoading(true)

    const formData = new FormData()
    formData.append('timezone', data.timezone)
    formData.append('currency', data.currency)
    formData.append('measurementSystem', data.measurementSystem)
    formData.append('language', data.language)

    const result = await updateTenantLocale(formData)

    setLocaleLoading(false)

    if (result.success) {
      toast.success('Locale settings updated successfully')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Branding Form */}
      <section className="rounded-lg border border-border p-6">
        <h3 className="mb-4 text-lg font-semibold">Branding</h3>
        <form
          onSubmit={brandingForm.handleSubmit(onSubmitBranding)}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="logoUrl"
              className="block text-sm font-medium text-foreground"
            >
              Logo URL (optional)
            </label>
            <input
              id="logoUrl"
              type="text"
              {...brandingForm.register('logoUrl')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              placeholder="https://example.com/logo.png"
            />
            {brandingForm.formState.errors.logoUrl && (
              <p className="mt-1 text-sm text-destructive">
                {brandingForm.formState.errors.logoUrl.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="primaryColor"
              className="block text-sm font-medium text-foreground"
            >
              Primary Color
            </label>
            <input
              id="primaryColor"
              type="color"
              {...brandingForm.register('primaryColor')}
              className="mt-1 block h-10 w-full rounded-md border border-input bg-background"
            />
            {brandingForm.formState.errors.primaryColor && (
              <p className="mt-1 text-sm text-destructive">
                {brandingForm.formState.errors.primaryColor.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="secondaryColor"
              className="block text-sm font-medium text-foreground"
            >
              Secondary Color
            </label>
            <input
              id="secondaryColor"
              type="color"
              {...brandingForm.register('secondaryColor')}
              className="mt-1 block h-10 w-full rounded-md border border-input bg-background"
            />
            {brandingForm.formState.errors.secondaryColor && (
              <p className="mt-1 text-sm text-destructive">
                {brandingForm.formState.errors.secondaryColor.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={brandingLoading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {brandingLoading ? 'Saving...' : 'Save Branding'}
          </button>
        </form>
      </section>

      {/* Locale Form */}
      <section className="rounded-lg border border-border p-6">
        <h3 className="mb-4 text-lg font-semibold">Locale Settings</h3>
        <form
          onSubmit={localeForm.handleSubmit(onSubmitLocale)}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-foreground"
            >
              Timezone
            </label>
            <select
              id="timezone"
              {...localeForm.register('timezone')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="America/New_York">America/New York (EST/EDT)</option>
              <option value="America/Chicago">America/Chicago (CST/CDT)</option>
              <option value="America/Denver">America/Denver (MST/MDT)</option>
              <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEDT)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-foreground"
            >
              Currency
            </label>
            <select
              id="currency"
              {...localeForm.register('currency')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="measurementSystem"
              className="block text-sm font-medium text-foreground"
            >
              Measurement System
            </label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="imperial"
                  {...localeForm.register('measurementSystem')}
                  className="mr-2"
                />
                <span className="text-sm">Imperial (inches, pounds)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="metric"
                  {...localeForm.register('measurementSystem')}
                  className="mr-2"
                />
                <span className="text-sm">Metric (centimeters, kilograms)</span>
              </label>
            </div>
          </div>

          <div>
            <label
              htmlFor="language"
              className="block text-sm font-medium text-foreground"
            >
              Language
            </label>
            <select
              id="language"
              {...localeForm.register('language')}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={localeLoading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {localeLoading ? 'Saving...' : 'Save Locale Settings'}
          </button>
        </form>
      </section>
    </div>
  )
}
