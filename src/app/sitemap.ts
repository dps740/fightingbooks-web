import { MetadataRoute } from 'next';

const BLOG_SLUGS = [
  'lion-vs-tiger',
  'gorilla-vs-bear',
  'hippo-vs-rhino',
  'polar-bear-vs-grizzly-bear',
  'tiger-vs-bear',
  'crocodile-vs-shark',
  'hippo-vs-crocodile',
  'gorilla-vs-lion',
  'elephant-vs-rhino',
  'orca-vs-great-white-shark',
  'wolf-vs-lion',
  'komodo-dragon-vs-king-cobra',
  'honey-badger-vs-lion',
  'jaguar-vs-leopard',
  'anaconda-vs-crocodile',
  'who-would-win-complete-guide',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://fightingbooks.vercel.app';
  
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  const blogPages = BLOG_SLUGS.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...blogPages];
}
