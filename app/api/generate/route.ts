import { NextRequest, NextResponse } from 'next/server'
import { scrapeSite } from '@/lib/scraper'
import { analyzeSite } from '@/lib/analyzer'
import { generateApp } from '@/lib/generator'
import { publishToSnack } from '@/lib/snack'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Step 1: Scrape
    const siteData = await scrapeSite(parsedUrl.toString())

    // Step 2: Analyze with Claude
    const appSpec = await analyzeSite(siteData)

    // Step 3: Generate ZIP + Snack in parallel
    const [zipBuffer, snackResult] = await Promise.allSettled([
      generateApp(appSpec, siteData),
      publishToSnack(appSpec, siteData),
    ])

    const zip = zipBuffer.status === 'fulfilled' ? zipBuffer.value : null
    const snack = snackResult.status === 'fulfilled' ? snackResult.value : null

    if (!zip) throw new Error('Failed to generate app code')

    const appName = appSpec.appName.toLowerCase().replace(/\s+/g, '-')

    // Encode app spec for the preview/deploy page
    const specEncoded = Buffer.from(JSON.stringify({
      appName: appSpec.appName,
      tagline: appSpec.tagline,
      primaryColor: appSpec.primaryColor,
      snackUrl: snack?.snackUrl || null,
      sourceUrl: siteData.url,
      screens: appSpec.screens.length,
    })).toString('base64url')

    return new NextResponse(zip as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${appName}.zip"`,
        'X-App-Name': appSpec.appName,
        'X-App-Tagline': appSpec.tagline,
        'X-App-Color': appSpec.primaryColor,
        'X-Snack-Url': snack?.snackUrl || '',
        'X-Spec': specEncoded,
      },
    })
  } catch (err: unknown) {
    console.error('Generation error:', err)
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
