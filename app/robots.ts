import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/estimate'],
        disallow: ['/admin/', '/api/', '/auth/', '/dashboard/']
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/estimate'],
        disallow: ['/admin/', '/api/', '/auth/', '/dashboard/']
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/estimate'],
        disallow: ['/admin/', '/api/', '/auth/', '/dashboard/']
      }
    ],
    sitemap: 'https://igcse-estimator.vercel.app/sitemap.xml'
  }
}