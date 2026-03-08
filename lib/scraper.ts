import * as cheerio from 'cheerio'

export interface SiteData {
  url: string
  title: string
  description: string
  ogImage?: string
  heroImages: string[]       // Real brand photography from the site
  logoUrl?: string           // Detected logo/wordmark image
  colors: string[]
  themeColor?: string
  navLinks: { label: string; href: string }[]
  sections: { heading: string; content: string }[]
  faviconUrl?: string
}

/** Detect if an image is likely a logo/wordmark rather than photography */
function isLikelyLogo(src: string, alt: string, width: number, height: number): boolean {
  const srcLower = src.toLowerCase()
  const altLower = alt.toLowerCase()

  // SVGs are always logos
  if (/\.svg(\?|$)/i.test(src)) return true

  // Path/filename contains logo-related keywords
  if (/logo|wordmark|brand|emblem|crest/i.test(srcLower)) return true
  if (/logo|wordmark|brand/i.test(altLower)) return true

  // Square and small — likely an icon or logo
  if (width > 0 && height > 0 && width < 300 && Math.abs(width - height) / Math.max(width, height) < 0.15) return true

  // Filename is just the brand name (e.g., "sugarfish.jpg", "nobu.png")
  const filename = srcLower.split('/').pop()?.split('?')[0] || ''
  if (/^[a-z\-_]+\.(jpe?g|png|webp|gif)$/i.test(filename)) {
    const name = filename.replace(/\.(jpe?g|png|webp|gif)$/i, '')
    // Very short single-word filenames are often brand/logo files
    if (name.length <= 12 && !name.includes('-') && !name.includes('_')) return true
  }

  return false
}

/** Check if an image path looks like real photography */
function isLikelyPhotography(src: string): boolean {
  return /\/(images|media|photos|gallery|wp-content\/uploads|assets\/img)\//i.test(src)
}

export async function scrapeSite(url: string): Promise<SiteData> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) throw new Error(`Failed to fetch site: ${res.status}`)

  const html = await res.text()
  const $ = cheerio.load(html)
  const origin = new URL(url).origin

  const toAbsolute = (href: string) => {
    if (!href) return ''
    if (href.startsWith('http')) return href
    if (href.startsWith('//')) return `https:${href}`
    if (href.startsWith('/')) return `${origin}${href}`
    return `${origin}/${href}`
  }

  // ── Meta ──────────────────────────────────────────────────────────────
  const title = $('title').first().text().trim()
    || $('meta[property="og:title"]').attr('content') || ''
  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') || ''
  const themeColor = $('meta[name="theme-color"]').attr('content') || undefined
  const faviconUrl = toAbsolute(
    $('link[rel="apple-touch-icon"]').attr('href') ||
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    '/favicon.ico'
  )

  // ── Logo detection ──────────────────────────────────────────────────
  const logoSrc = toAbsolute(
    $('header img, nav img, .logo img, [class*="logo"] img').first().attr('src') || ''
  ) || undefined

  // ── Collect ALL candidate images ────────────────────────────────────
  const imageSet = new Set<string>()

  // 1. og:image (usually the best hero)
  const ogImage = $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content')
  if (ogImage) imageSet.add(toAbsolute(ogImage))

  // 2. Large <img> tags (skip icons/thumbnails)
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src') || ''
    const width = parseInt($(el).attr('width') || '0')
    const height = parseInt($(el).attr('height') || '0')
    if (src.startsWith('data:')) return
    if (src.includes('icon') && (width < 64 || !width)) return
    const abs = toAbsolute(src)
    if (abs && !abs.includes('pixel') && !abs.includes('1x1')) {
      imageSet.add(abs)
    }
  })

  // 3. CSS background-image inline styles
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || ''
    const matches = style.match(/url\(['"]?([^'")\s]+)['"]?\)/g) || []
    matches.forEach(m => {
      const src = m.replace(/url\(['"]?/, '').replace(/['"]?\)$/, '')
      if (src && !src.startsWith('data:')) imageSet.add(toAbsolute(src))
    })
  })

  // 4. srcset — grab the highest-res version
  $('img[srcset], source[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset') || ''
    const parts = srcset.split(',').map(s => s.trim().split(/\s+/))
    const last = parts[parts.length - 1]?.[0]
    if (last && !last.startsWith('data:')) imageSet.add(toAbsolute(last))
  })

  // 5. picture > source
  $('picture source[src]').each((_, el) => {
    const src = $(el).attr('src') || ''
    if (src && !src.startsWith('data:')) imageSet.add(toAbsolute(src))
  })

  // ── Classify images into photography vs logos ───────────────────────
  const allImages = [...imageSet]
    .filter(src => !src.includes('sprite') && !src.includes('placeholder'))

  const photography: string[] = []
  let detectedLogo: string | undefined = logoSrc

  for (const src of allImages) {
    // Get dimensions from DOM if possible
    const imgEl = $(`img[src="${src}"], img[src="${src.replace(origin, '')}"]`).first()
    const alt = imgEl.attr('alt') || ''
    const w = parseInt(imgEl.attr('width') || '0')
    const h = parseInt(imgEl.attr('height') || '0')

    if (isLikelyLogo(src, alt, w, h)) {
      if (!detectedLogo) detectedLogo = src
      continue
    }

    // Only keep raster images for photography
    if (/\.(jpe?g|png|webp)(\?|$)/i.test(src)) {
      photography.push(src)
    }
  }

  // Sort: prefer images from known photography paths
  photography.sort((a, b) => {
    const aPhoto = isLikelyPhotography(a) ? 0 : 1
    const bPhoto = isLikelyPhotography(b) ? 0 : 1
    return aPhoto - bPhoto
  })

  const heroImages = photography
    .filter(src => !src.includes('icon'))
    .slice(0, 8)

  // ── Navigation ────────────────────────────────────────────────────────
  const navLinks: { label: string; href: string }[] = []
  $('nav a, header a, [role="navigation"] a').each((_, el) => {
    const label = $(el).text().trim().replace(/\s+/g, ' ')
    const href = $(el).attr('href') || ''
    if (!label || label.length > 30 || label.length < 2) return
    if (href.startsWith('tel:') || href.startsWith('mailto:')) return
    const absHref = toAbsolute(href)
    if (!navLinks.find(l => l.label.toLowerCase() === label.toLowerCase())) {
      navLinks.push({ label, href: absHref })
    }
  })

  // ── Content sections ──────────────────────────────────────────────────
  const sections: { heading: string; content: string }[] = []
  $('h1, h2, h3').each((_, el) => {
    const heading = $(el).text().trim().replace(/\s+/g, ' ')
    if (!heading || heading.length > 100 || heading.length < 2) return
    const next = $(el).next()
    const content = next.text().trim().replace(/\s+/g, ' ').slice(0, 200)
    sections.push({ heading, content })
  })

  // ── Colors ────────────────────────────────────────────────────────────
  const colors: string[] = []
  if (themeColor) colors.push(themeColor)
  const styleContent = $('style').text()
  const hexColors = [...new Set(styleContent.match(/#[0-9a-fA-F]{6}/g) || [])]
  colors.push(...hexColors.slice(0, 8))

  return {
    url,
    title,
    description,
    ogImage: ogImage ? toAbsolute(ogImage) : undefined,
    heroImages,
    logoUrl: detectedLogo,
    colors: colors.slice(0, 8),
    themeColor,
    navLinks: navLinks.slice(0, 8),
    sections: sections.slice(0, 8),
    faviconUrl,
  }
}
