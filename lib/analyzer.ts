import Anthropic from '@anthropic-ai/sdk'
import { SiteData } from './scraper'

export interface AppSpec {
  appName: string
  tagline: string
  primaryColor: string
  backgroundColor: string
  textColor: string
  accentColor: string
  screens: Screen[]
  bottomTabs: Tab[]
}

export interface Screen {
  name: string
  title: string
  type: 'home' | 'list' | 'detail' | 'form' | 'webview' | 'info'
  content: string
  sourceUrl?: string
}

export interface Tab {
  name: string
  icon: string
  screen: string
}

export async function analyzeSite(siteData: SiteData): Promise<AppSpec> {
  const client = new Anthropic()

  const contextParts: Anthropic.MessageParam['content'] = []

  // Add og:image if available for visual context
  if (siteData.ogImage) {
    try {
      const imgRes = await fetch(siteData.ogImage, { signal: AbortSignal.timeout(8000) })
      if (imgRes.ok) {
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        const mimeType = validTypes.find(t => contentType.includes(t.split('/')[1])) || 'image/jpeg'
        const buffer = await imgRes.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        contextParts.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: base64,
          },
        })
      }
    } catch {
      // Skip image if unavailable
    }
  }

  const prompt = `You are a mobile app architect. Analyze this website and design a native mobile app.

URL: ${siteData.url}
Title: ${siteData.title}
Description: ${siteData.description}
Theme color: ${siteData.themeColor || 'not specified'}
Colors found: ${siteData.colors.slice(0, 6).join(', ')}
Navigation: ${JSON.stringify(siteData.navLinks.slice(0, 6))}
Page sections: ${JSON.stringify(siteData.sections.slice(0, 6))}

Design a native mobile app for this website. Return ONLY valid JSON:

{
  "appName": "2-3 word app name specific to this brand",
  "tagline": "one line — what the app lets you do",
  "primaryColor": "#hexcolor from their brand",
  "backgroundColor": "#0a0a0a or #ffffff depending on brand",
  "textColor": "#f4f4f5 or #111111 depending on background",
  "accentColor": "#hexcolor for buttons and highlights",
  "screens": [
    {
      "name": "Home",
      "title": "screen display title",
      "type": "home",
      "content": "what this screen shows — specific to this brand",
      "sourceUrl": "${siteData.url}"
    }
  ],
  "bottomTabs": [
    { "name": "Home", "icon": "home", "screen": "Home" }
  ]
}

Rules:
- 3-5 screens based on the actual site structure
- 3-4 bottom tabs matching screens
- Icon names: home, search, person, settings, heart, star, bell, list, grid, info, restaurant, fitness, book, cart
- Make it specific to THIS brand — not generic
- Colors must match their actual brand`

  contextParts.push({ type: 'text', text: prompt })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: contextParts }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse app spec from AI response')

  return JSON.parse(jsonMatch[0]) as AppSpec
}
