import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Required for Docker deployment
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Mark pino and related packages as external to avoid bundling test files
    serverComponentsExternalPackages: ['pino', 'pino-pretty', 'pino-abstract-transport'],
  },
};

// Wrap config with Sentry for error tracking in production
// Only active when SENTRY_DSN is set in environment variables
export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  sourcemaps: {
    disable: false,
  },

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: false,
});
