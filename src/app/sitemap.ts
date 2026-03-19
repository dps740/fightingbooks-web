import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

const CURATED_BATTLE_SLUGS = [
  'lion-vs-tiger',
  'gorilla-vs-grizzly-bear',
  'orca-vs-great-white-shark',
  'polar-bear-vs-crocodile',
  'elephant-vs-rhino',
  'hippo-vs-rhino',
  'tiger-vs-grizzly-bear',
  'anaconda-vs-crocodile',
  'komodo-dragon-vs-king-cobra',
  'gorilla-vs-lion',
  'crocodile-vs-great-white-shark',
  'wolf-vs-lion',
  'jaguar-vs-leopard',
  'hammerhead-shark-vs-electric-eel',
]

const CURATED_ARTICLE_SLUGS = [
  'books-like-who-would-win',
  'classroom-resources',
  'who-would-win-book-list',
  'who-would-win-complete-guide',
  'lion-vs-tiger',
  'gorilla-vs-bear',
  'orca-vs-great-white-shark',
  'elephant-vs-rhino',
  'hippo-vs-rhino',
  'jaguar-vs-leopard',
  'komodo-dragon-vs-king-cobra',
  'wolf-vs-lion',
  'gorilla-vs-lion',
  'anaconda-vs-crocodile',
  'tiger-vs-bear',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whowouldwinbooks.com'
  
  // Get all blog articles
  const articlesDir = path.join(process.cwd(), 'content', 'articles')
  let articleSlugs: string[] = []
  
  try {
    const files = fs.readdirSync(articlesDir)
    const available = new Set(
      files
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''))
    )
    articleSlugs = CURATED_ARTICLE_SLUGS.filter(slug => available.has(slug))
  } catch (error) {
    console.error('Could not read articles directory:', error)
  }

  // Get all learn articles
  const learnDir = path.join(process.cwd(), 'content', 'learn')
  let learnSlugs: string[] = []
  
  try {
    const files = fs.readdirSync(learnDir)
    learnSlugs = files
      .filter(file => file.endsWith('.md'))
      .map(file => file.replace('.md', ''))
  } catch (error) {
    console.error('Could not read learn directory:', error)
  }

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/battles`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/parents`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/teachers`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
  ]

  const blogPages = articleSlugs.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const learnPages = learnSlugs.map(slug => ({
    url: `${baseUrl}/learn/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }))

  // Curate battle URLs in the sitemap instead of pushing every generated matchup equally.
  // This keeps the sitemap focused on the battle pages we are explicitly strengthening with guides + hub links.
  const battlesDir = path.join(process.cwd(), 'content', 'battles')
  let battleSlugs: string[] = []
  
  try {
    const files = fs.readdirSync(battlesDir)
    const available = new Set(
      files
        .filter(file => file.endsWith('.md'))
        .map(file => file.replace('.md', ''))
    )
    battleSlugs = CURATED_BATTLE_SLUGS.filter(slug => available.has(slug))
  } catch (error) {
    console.error('Could not read battles directory:', error)
  }

  const battlePages = battleSlugs.map(slug => ({
    url: `${baseUrl}/battles/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...blogPages, ...learnPages, ...battlePages]
}
