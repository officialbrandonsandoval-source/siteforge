import * as cheerio from 'cheerio'

export interface SiteData {
  url: string
  title: string
  description: string
  ogImage?: string
  colors: string[]
  navLinks: { label: string; href: string }[]
  sections: { heading: string; content: string }[]
  faviconUrl?: string
  themeColor?: string
}

export async function scrapeSite(url: string): Promise<SiteData> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) throw new Error(`Failed to fetch site: ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)

  // Meta
  const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || ''
  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    ''
  const ogImage =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    undefined
  const themeColor = $('meta[name="theme-color"]').attr('content') || undefined
  const faviconUrl =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    '/favicon.ico'

  // Nav links
  const navLinks: { label: string; href: string }[] = []
  $('nav a, header a').each((_, el) => {
    const label = $(el).text().trim()
    const href = $(el).attr('href') || ''
    if (label && label.length < 30 && label.length > 1 && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
      const absHref = href.startsWith('http') ? href : `${new URL(url).origin}${href.startsWith('/') ? href : '/' + href}`
      if (!navLinks.find(l => l.label === label)) {
        navLinks.push({ label, href: absHref })
      }
    }
  })

  // Content sections
  const sections: { heading: string; content: string }[] = []
  $('h1, h2, h3').each((_, el) => {
    const heading = $(el).text().trim()
    if (!heading || heading.length > 100) return
    const next = $(el).next()
    const content = next.text().trim().slice(0, 200)
    sections.push({ heading, content })
  })

  // Color extraction from inline styles + bg colors
  const colors: string[] = []
  if (themeColor) colors.push(themeColor)

  // Try to get brand colors from CSS custom properties or inline styles
  const styleContent = $('style').text()
  const hexColors = styleContent.match(/#[0-9a-fA-F]{6}/g) || []
  const uniqueColors = [...new Set(hexColors)].slice(0, 10)
  colors.push(...uniqueColors)

  return {
    url,
    title,
    description,
    ogImage,
    colors: colors.slice(0, 8),
    navLinks: navLinks.slice(0, 8),
    sections: sections.slice(0, 8),
    faviconUrl,
    themeColor,
  }
}
