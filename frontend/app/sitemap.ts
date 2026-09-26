import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/how-it-works', '/docs', '/login'].map((path) => ({ url: `https://robank.co${path}`, changeFrequency: 'weekly' }));
}
