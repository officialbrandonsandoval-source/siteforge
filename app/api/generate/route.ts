import { NextRequest, NextResponse } from 'next/server'
import { scrapeSite } from '@/lib/scraper'
import { analyzeSite } from '@/lib/analyzer'
import { generateApp } from '@/lib/generator'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Step 1: Scrape
    const siteData = await scrapeSite(parsedUrl.toString())

    // Step 2: Analyze with Claude Vision
    const appSpec = await analyzeSite(siteData)

    // Step 3: Generate Expo project
    const zipBuffer = await generateApp(appSpec, siteData)

    const appName = appSpec.appName.toLowerCase().replace(/\s+/g, '-')

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${appName}.zip"`,
        'X-App-Name': appSpec.appName,
        'X-App-Tagline': appSpec.tagline,
      },
    })
  } catch (err: unknown) {
    console.error('Generation error:', err)
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
