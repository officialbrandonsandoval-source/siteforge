import puppeteer from 'puppeteer'

export interface SiteData {
  url: string
  title: string
  description: string
  screenshot: string // base64
  colors: string[]
  navLinks: { label: string; href: string }[]
  sections: { heading: string; content: string }[]
  logoUrl?: string
  faviconUrl?: string
}

export async function scrapeSite(url: string): Promise<SiteData> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844 })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 })

    // Screenshot
    const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'jpeg' })
    const screenshot = Buffer.from(screenshotBuffer).toString('base64')

    // Title + description
    const title = await page.title()
    const description = await page.$eval(
      'meta[name="description"]',
      (el) => el.getAttribute('content') || ''
    ).catch(() => '')

    // Nav links
    const navLinks = await page.$$eval('nav a, header a', (links) =>
      links
        .map((a) => ({
          label: (a as HTMLAnchorElement).innerText?.trim() || '',
          href: (a as HTMLAnchorElement).href || '',
        }))
        .filter((l) => l.label.length > 0 && l.label.length < 30)
        .slice(0, 8)
    ).catch(() => [])

    // Sections — headings + first paragraph
    const sections = await page.$$eval('h1, h2, h3', (headings) =>
      headings
        .map((h) => {
          const heading = (h as HTMLElement).innerText?.trim() || ''
          const next = h.nextElementSibling
          const content = next ? (next as HTMLElement).innerText?.trim().slice(0, 200) || '' : ''
          return { heading, content }
        })
        .filter((s) => s.heading.length > 0 && s.heading.length < 100)
        .slice(0, 8)
    ).catch(() => [])

    // Logo
    const logoUrl = await page.$eval(
      'img[src*="logo"], header img, nav img',
      (img) => (img as HTMLImageElement).src || ''
    ).catch(() => undefined)

    // Favicon
    const faviconUrl = await page.$eval(
      'link[rel="icon"], link[rel="shortcut icon"]',
      (el) => (el as HTMLLinkElement).href || ''
    ).catch(() => undefined)

    // CSS color extraction (dominant brand colors)
    const colors = await page.evaluate(() => {
      const colorCounts: Record<string, number> = {}
      document.querySelectorAll('*').forEach((el) => {
        const style = window.getComputedStyle(el)
        const bg = style.backgroundColor
        const color = style.color
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          colorCounts[bg] = (colorCounts[bg] || 0) + 1
        }
        if (color) {
          colorCounts[color] = (colorCounts[color] || 0) + 1
        }
      })
      return Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color)
    }).catch(() => [])

    return { url, title, description, screenshot, colors, navLinks, sections, logoUrl, faviconUrl }
  } finally {
    await browser.close()
  }
}
