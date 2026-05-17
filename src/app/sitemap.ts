import type { MetadataRoute } from 'next'

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://atmos.example.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes = ['/', '/technical', '/overview', '/chat', '/insight', '/locations', '/trip', '/pricing', '/privacy']
  return routes.map((path) => ({
    url: `${site}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1.0 : 0.7,
  }))
}
