import * as cheerio from 'cheerio'

export interface MenuItem {
  name: string
  description?: string
  price?: string
  category?: string
}

export interface Location {
  name?: string
  address: string
  city?: string
  phone?: string
  hours?: string
  mapQuery: string
}

export interface SiteData {
  url: string
  title: string
  description: string
  ogImage?: string
  heroImages: string[]
  logoUrl?: string
  colors: string[]
  themeColor?: string
  navLinks: { label: string; href: string }[]
  sections: { heading: string; content: string }[]
  faviconUrl?: string
  // Sub-page content
  menuItems: MenuItem[]
  menuUrl?: string
  locations: Location[]
  locationsUrl?: string
  aboutContent: string[]
  aboutUrl?: string
  reservationUrl?: string  // OpenTable, Resy, SevenRooms etc.
}

function isLikelyLogo(src: string, alt?: string, width?: number, height?: number): boolean {
  const lower = src.toLowerCase()
  if (lower.endsWith('.svg')) return true
  if (/logo|wordmark|brand|emblem|badge/.test(lower)) return true
  if (alt && /logo|wordmark|brand/.test(alt.toLowerCase())) return true
  // Square small images are usually logos
  if (width && height && Math.abs(width - height) < 20 && width < 300) return true
  return false
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return res.text()
  } catch {
    return null
  }
}

function extractMenuItems($: cheerio.CheerioAPI): MenuItem[] {
  const items: MenuItem[] = []

  // Strategy 1: Look for price patterns ($XX) near text
  const pricePattern = /\$\d+(\.\d{2})?/

  // Check definition lists (common for menus)
  $('dl').each((_, dl) => {
    let currentCategory = ''
    $(dl).find('dt, dd').each((_, el) => {
      const tag = (el as { tagName: string }).tagName.toLowerCase()
      const text = $(el).text().trim()
      if (!text || text.length > 200) return
      if (tag === 'dt') {
        if (pricePattern.test(text)) {
          const priceMatch = text.match(pricePattern)
          items.push({
            name: text.replace(pricePattern, '').trim(),
            price: priceMatch?.[0],
            category: currentCategory,
          })
        } else {
          currentCategory = text
        }
      } else if (tag === 'dd' && items.length > 0) {
        items[items.length - 1].description = text.slice(0, 120)
      }
    })
  })

  // Strategy 2: List items with prices
  if (items.length < 3) {
    $('li, .menu-item, [class*="menu-item"], [class*="dish"], [class*="food-item"]').each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ')
      if (!text || text.length < 3 || text.length > 200) return
      if (pricePattern.test(text)) {
        const priceMatch = text.match(pricePattern)
        const name = text.split(priceMatch![0])[0].trim()
        if (name.length > 2) {
          items.push({ name: name.slice(0, 60), price: priceMatch![0] })
        }
      }
    })
  }

  // Strategy 3: Headings with descriptions (omakase-style menus like SUGARFISH)
  if (items.length < 2) {
    $('h2, h3, h4').each((_, el) => {
      const name = $(el).text().trim()
      if (!name || name.length > 80 || name.length < 2) return
      if (/nav|footer|header|copyright|cookie/i.test(name)) return
      const desc = $(el).next('p, div').first().text().trim()
      const priceEl = $(el).closest('[class*="item"], [class*="price"], section').find('[class*="price"], .price')
      const price = priceEl.first().text().trim().match(pricePattern)?.[0]
      items.push({
        name: name.slice(0, 60),
        description: desc.slice(0, 120) || undefined,
        price: price || undefined,
      })
    })
  }

  return items.slice(0, 20)
}

function extractLocations($: cheerio.CheerioAPI, origin: string): Location[] {
  const locations: Location[] = []

  // Look for address patterns
  const addressPattern = /\d+\s+[A-Z][a-zA-Z\s]+(?:St|Ave|Blvd|Dr|Rd|Way|Lane|Ln|Court|Ct|Place|Pl|Road)\b/i
  const cityStateZip = /[A-Z][a-zA-Z\s]+,\s*[A-Z]{2}\s*\d{5}/

  const seen = new Set<string>()

  // Check common address containers
  $('[class*="location"], [class*="address"], address, [itemtype*="PostalAddress"]').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, ' ')
    if (!text || text.length > 300 || seen.has(text.slice(0, 30))) return
    seen.add(text.slice(0, 30))

    const hasAddress = addressPattern.test(text) || cityStateZip.test(text)
    if (!hasAddress) return

    const phone = text.match(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/)?.[0]
    const addressMatch = text.match(addressPattern)?.[0]

    locations.push({
      address: addressMatch || text.slice(0, 80),
      phone: phone,
      mapQuery: encodeURIComponent((addressMatch || text).slice(0, 100)),
    })
  })

  // If nothing found, look for any text with address patterns
  if (locations.length === 0) {
    $('p, li, td, div').each((_, el) => {
      const children = $(el).children().length
      if (children > 3) return // Skip containers
      const text = $(el).text().trim().replace(/\s+/g, ' ')
      if (text.length > 200 || text.length < 10) return
      if (addressPattern.test(text) && !seen.has(text.slice(0, 30))) {
        seen.add(text.slice(0, 30))
        locations.push({
          address: text.slice(0, 100),
          mapQuery: encodeURIComponent(text.slice(0, 80)),
        })
      }
    })
  }

  return locations.slice(0, 6)
}

function detectReservationUrl(navLinks: { label: string; href: string }[]): string | undefined {
  // Direct reservation platforms
  for (const link of navLinks) {
    const href = link.href.toLowerCase()
    if (
      href.includes('opentable') ||
      href.includes('resy.com') ||
      href.includes('sevenrooms') ||
      href.includes('tock.com') ||
      href.includes('yelp.com/reservations') ||
      href.includes('exploretock') ||
      href.includes('table8') ||
      href.includes('bookatable')
    ) {
      return link.href
    }
  }
  // Internal reservation/booking page
  for (const link of navLinks) {
    const label = link.label.toLowerCase()
    const href = link.href.toLowerCase()
    if (/reserv|book|order|appointment/i.test(label) || /reserv|book|order/i.test(href)) {
      return link.href
    }
  }
  return undefined
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

  const isSameDomain = (href: string) => {
    try { return new URL(href).origin === origin } catch { return false }
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

  // ── Navigation ────────────────────────────────────────────────────────
  const navLinks: { label: string; href: string }[] = []
  $('nav a, header a, [role="navigation"] a').each((_, el) => {
    const label = $(el).text().trim().replace(/\s+/g, ' ')
    const href = $(el).attr('href') || ''
    if (!label || label.length > 40 || label.length < 2) return
    if (href.startsWith('tel:') || href.startsWith('mailto:')) return
    const absHref = toAbsolute(href)
    if (!navLinks.find(l => l.label.toLowerCase() === label.toLowerCase())) {
      navLinks.push({ label, href: absHref })
    }
  })

  // ── Detect reservation URL ─────────────────────────────────────────────
  const reservationUrl = detectReservationUrl(navLinks)

  // ── Identify sub-pages to scrape ──────────────────────────────────────
  const menuLink = navLinks.find(l =>
    /\bmenu\b|\bfood\b|\beat\b|\bdishes\b|\bour food\b/i.test(l.label) && isSameDomain(l.href)
  )
  const aboutLink = navLinks.find(l =>
    /\babout\b|\bour story\b|\bstory\b|\bwho we are\b/i.test(l.label) && isSameDomain(l.href)
  )
  const locationsLink = navLinks.find(l =>
    /\blocation\b|\bfind us\b|\bvisit\b|\bwhere\b|\bour location/i.test(l.label) && isSameDomain(l.href)
  )

  // ── Images ────────────────────────────────────────────────────────────
  const imageSet = new Set<string>()
  let logoUrl: string | undefined

  const ogImage = $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content')
  if (ogImage) imageSet.add(toAbsolute(ogImage))

  $('img[src]').each((_, el) => {
    const src = $(el).attr('src') || ''
    const alt = $(el).attr('alt') || ''
    const width = parseInt($(el).attr('width') || '0')
    const height = parseInt($(el).attr('height') || '0')
    if (src.startsWith('data:')) return
    const abs = toAbsolute(src)
    if (!abs || abs.includes('pixel') || abs.includes('1x1')) return
    if (isLikelyLogo(src, alt, width, height)) {
      if (!logoUrl) logoUrl = abs
    } else {
      imageSet.add(abs)
    }
  })

  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || ''
    const matches = style.match(/url\(['"]?([^'")\s]+)['"]?\)/g) || []
    matches.forEach(m => {
      const src = m.replace(/url\(['"]?/, '').replace(/['"]?\)$/, '')
      if (src && !src.startsWith('data:') && !isLikelyLogo(src)) imageSet.add(toAbsolute(src))
    })
  })

  $('img[srcset], source[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset') || ''
    const parts = srcset.split(',').map(s => s.trim().split(/\s+/))
    const last = parts[parts.length - 1]?.[0]
    if (last && !last.startsWith('data:') && !isLikelyLogo(last)) imageSet.add(toAbsolute(last))
  })

  // Sort: prefer /images/, /media/, /photos/, /gallery/ paths
  const photoPathScore = (src: string) => {
    if (/\/(images?|media|photos?|gallery|uploads|content)\//i.test(src)) return 2
    return 1
  }

  const heroImages = [...imageSet]
    .filter(src => /\.(jpe?g|png|webp)(\?|$)/i.test(src))
    .filter(src => !src.includes('icon') && !src.includes('sprite') && !src.includes('placeholder'))
    .sort((a, b) => photoPathScore(b) - photoPathScore(a))
    .slice(0, 8)

  // ── Sections ──────────────────────────────────────────────────────────
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

  // ── Scrape sub-pages in parallel ──────────────────────────────────────
  const [menuHtml, aboutHtml, locationsHtml] = await Promise.all([
    menuLink ? fetchPage(menuLink.href) : Promise.resolve(null),
    aboutLink ? fetchPage(aboutLink.href) : Promise.resolve(null),
    locationsLink ? fetchPage(locationsLink.href) : Promise.resolve(null),
  ])

  let menuItems: MenuItem[] = []
  if (menuHtml) {
    const $menu = cheerio.load(menuHtml)
    menuItems = extractMenuItems($menu)
  }
  // Fallback: try extracting menu from main page
  if (menuItems.length < 2) {
    menuItems = extractMenuItems($)
  }

  let aboutContent: string[] = []
  if (aboutHtml) {
    const $about = cheerio.load(aboutHtml)
    $about('p').each((_, el) => {
      const text = $about(el).text().trim().replace(/\s+/g, ' ')
      if (text.length > 40 && text.length < 600) aboutContent.push(text)
    })
    aboutContent = aboutContent.slice(0, 6)
  }
  if (aboutContent.length === 0) {
    $('p').each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ')
      if (text.length > 40 && text.length < 600) aboutContent.push(text)
    })
    aboutContent = aboutContent.slice(0, 4)
  }

  let locations: Location[] = []
  if (locationsHtml) {
    const $locs = cheerio.load(locationsHtml)
    locations = extractLocations($locs, origin)
  }
  if (locations.length === 0) {
    locations = extractLocations($, origin)
  }

  return {
    url,
    title,
    description,
    ogImage: ogImage ? toAbsolute(ogImage) : undefined,
    heroImages,
    logoUrl,
    colors: colors.slice(0, 8),
    themeColor,
    navLinks: navLinks.slice(0, 8),
    sections: sections.slice(0, 8),
    faviconUrl,
    menuItems,
    menuUrl: menuLink?.href,
    locations,
    locationsUrl: locationsLink?.href,
    aboutContent,
    aboutUrl: aboutLink?.href,
    reservationUrl,
  }
}
