const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://atmos.example.com'

/**
 * Organization + WebApplication structured data. Inlined in the root
 * layout (server-rendered) so search engines and link-preview services
 * have rich context without any JS.
 */
export function JsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}#org`,
        name: 'Atmos',
        url: siteUrl,
        logo: `${siteUrl}/icon.png`,
        sameAs: ['https://github.com/ofonn/atmos'],
      },
      {
        '@type': 'WebApplication',
        '@id': `${siteUrl}#app`,
        name: 'Atmos — AI Weather Assistant',
        description:
          'AI-powered weather companion. Hourly forecasts, outfit advice, trip packing list, and conversational chat.',
        url: siteUrl,
        applicationCategory: 'WeatherApplication',
        operatingSystem: 'Web, Android',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        publisher: { '@id': `${siteUrl}#org` },
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
