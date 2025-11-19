/**
 * Root Layout
 *
 * Top-level layout that wraps the entire application with ClerkProvider.
 * Enables Clerk authentication throughout the app.
 *
 * @see Story 1.4: Integrate Clerk Authentication (AC6)
 */

import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Salina Bookshelf ERP',
  description: 'Publishing operations management platform for independent publishers',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          // Publishing Ink theme colors
          colorPrimary: '#1e3a8a', // Deep Ink Blue (navy)
          colorBackground: '#ffffff',
          colorText: '#1e293b', // Slate 900
          colorTextSecondary: '#64748b', // Slate 500
          colorDanger: '#dc2626', // Red 600
          colorSuccess: '#059669', // Emerald 600
          borderRadius: '0.5rem',
        },
      }}
    >
      <html lang="en">
        <body className="antialiased">
          {children}
          <Toaster position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  )
}
