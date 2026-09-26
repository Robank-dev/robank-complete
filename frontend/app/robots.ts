import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: ['/', '/how-it-works', '/docs'], disallow: ['/api/'] }], sitemap: 'https://robank.co/sitemap.xml' };
}
