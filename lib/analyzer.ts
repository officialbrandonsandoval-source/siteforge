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

  const prompt = `You are a mobile app architect. Analyze this website screenshot and metadata, then design a native mobile app structure for it.

Website: ${siteData.url}
Title: ${siteData.title}
Description: ${siteData.description}
Navigation links: ${JSON.stringify(siteData.navLinks)}
Page sections: ${JSON.stringify(siteData.sections)}
Detected colors: ${siteData.colors.slice(0, 5).join(', ')}

Look at the screenshot and return a JSON app specification. Be specific to this website's actual content and purpose.

Return ONLY valid JSON in this exact structure:
{
  "appName": "short app name (2-3 words max)",
  "tagline": "one-line description of what the app does",
  "primaryColor": "#hexcolor (dominant brand color from the site)",
  "backgroundColor": "#hexcolor (dark or light background)",
  "textColor": "#hexcolor (main text color)",
  "accentColor": "#hexcolor (call-to-action or highlight color)",
  "screens": [
    {
      "name": "Home",
      "title": "screen title",
      "type": "home",
      "content": "description of what this screen shows and key UI elements",
      "sourceUrl": "optional URL for this specific section"
    }
  ],
  "bottomTabs": [
    { "name": "Home", "icon": "home", "screen": "Home" }
  ]
}

Rules:
- 3-5 screens max
- 3-4 bottom tabs (matching the screens)
- Icon names must be valid Expo vector icons (home, search, person, settings, heart, star, bell, list, grid, info)
- Make screens specific to this site's actual content
- Colors should match the site's brand exactly`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: siteData.screenshot,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to extract app spec from AI response')
  
  return JSON.parse(jsonMatch[0]) as AppSpec
}
