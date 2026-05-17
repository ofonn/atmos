import type { MetadataRoute } from 'next'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://atmos.example.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Don't index auth-gated views or API endpoints.
        disallow: ['/api/', '/sign-in', '/sign-up', '/reset', '/settings', '/auth/'],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  }
}
