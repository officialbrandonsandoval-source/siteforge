'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

interface AppInfo {
  appName: string
  tagline: string
  primaryColor: string
  snackUrl: string | null
  sourceUrl: string
  screens: number
}

const deployPaths = [
  {
    id: 'ios',
    icon: '🍎',
    title: 'App Store',
    subtitle: 'iOS · iPhone + iPad',
    cost: '$99/year',
    time: '~2 hours + 1-3 day review',
    color: '#3b82f6',
    steps: [
      { num: 1, text: 'Create an Apple Developer account at developer.apple.com ($99/yr)' },
      { num: 2, text: 'Install EAS CLI: npm install -g eas-cli && eas login' },
      { num: 3, text: 'In your app folder: eas build --platform ios' },
      { num: 4, text: 'Submit: eas submit --platform ios — EAS handles everything else' },
      { num: 5, text: 'Apple reviews in 1-3 days. You\'re live.' },
    ],
  },
  {
    id: 'android',
    icon: '🤖',
    title: 'Google Play',
    subtitle: 'Android · All devices',
    cost: '$25 one-time',
    time: '~2 hours + same-day review',
    color: '#22c55e',
    steps: [
      { num: 1, text: 'Create a Google Play Developer account ($25 one-time fee)' },
      { num: 2, text: 'Install EAS CLI: npm install -g eas-cli && eas login' },
      { num: 3, text: 'In your app folder: eas build --platform android' },
      { num: 4, text: 'Submit: eas submit --platform android' },
      { num: 5, text: 'Google reviews same day. Usually live within hours.' },
    ],
  },
  {
    id: 'web',
    icon: '🌐',
    title: 'Web App',
    subtitle: 'Browser · Any device',
    cost: 'Free on Vercel',
    time: '~15 minutes',
    color: '#8b5cf6',
    steps: [
      { num: 1, text: 'In your app folder: npx expo export --platform web' },
      { num: 2, text: 'Install Vercel CLI: npm install -g vercel' },
      { num: 3, text: 'Deploy: vercel dist/ --prod' },
      { num: 4, text: 'Vercel gives you a free URL like yourapp.vercel.app' },
      { num: 5, text: 'Add your custom domain in Vercel settings.' },
    ],
  },
  {
    id: 'personal',
    icon: '📱',
    title: 'Personal Use',
    subtitle: 'Just for you · Instant',
    cost: 'Free',
    time: '2 minutes',
    color: '#f59e0b',
    steps: [
      { num: 1, text: 'Download Expo Go from the App Store or Google Play' },
      { num: 2, text: 'In your app folder: npm install && npx expo start' },
      { num: 3, text: 'Scan the QR code in the terminal with Expo Go' },
      { num: 4, text: 'Your app opens instantly on your phone — no App Store needed' },
      { num: 5, text: 'Keep it running on your phone any time you want.' },
    ],
  },
]

function PreviewContent() {
  const params = useSearchParams()
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [snackLoaded, setSnackLoaded] = useState(false)

  let appInfo: AppInfo | null = null
  try {
    const spec = params.get('spec')
    if (spec) {
      appInfo = JSON.parse(Buffer.from(spec, 'base64').toString()) as AppInfo
    }
  } catch { /* ignore */ }

  const snackUrl = appInfo?.snackUrl
  const snackEmbedUrl = snackUrl
    ? `${snackUrl}?platform=web&preview=true&theme=dark`
    : null

  return (
    <main className="min-h-screen bg-black text-white" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-15 rounded-full"
          style={{ background: `radial-gradient(ellipse, ${appInfo?.primaryColor || '#3b82f6'} 0%, transparent 70%)`, filter: 'blur(80px)' }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <a href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h4v10H2zM8 2h4v4H8zM8 9h4v3H8z" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-sm group-hover:text-white/70 transition-colors">SiteForge</span>
        </a>
        {appInfo && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/40 text-xs">{appInfo.appName} — ready</span>
          </div>
        )}
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="text-center mb-12">
          {appInfo ? (
            <>
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-4 py-1.5 rounded-full mb-4">
                <span>✓</span> App generated — {appInfo.screens} screens
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">
                <span style={{ color: appInfo.primaryColor }}>{appInfo.appName}</span> is ready
              </h1>
              <p className="text-white/40 text-lg">{appInfo.tagline}</p>
            </>
          ) : (
            <h1 className="text-4xl font-bold tracking-tight">Your app is ready</h1>
          )}
        </div>

        {/* Preview + Deploy grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

          {/* Live Preview */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Live Preview</h2>
              {snackUrl && (
                <a href={snackUrl} target="_blank"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/20 px-3 py-1 rounded-lg">
                  Open full screen ↗
                </a>
              )}
            </div>

            {snackEmbedUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]" style={{ height: '600px' }}>
                {!snackLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                    <div className="w-8 h-8 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
                    <span className="text-white/30 text-sm">Loading preview...</span>
                  </div>
                )}
                <iframe
                  src={snackEmbedUrl}
                  className="w-full h-full border-0"
                  allow="geolocation; camera; microphone"
                  onLoad={() => setSnackLoaded(true)}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 text-center p-12" style={{ height: '600px' }}>
                <div className="text-5xl mb-2">📱</div>
                <h3 className="font-semibold text-white">Preview unavailable</h3>
                <p className="text-white/30 text-sm max-w-xs leading-relaxed">
                  Your app was generated successfully. Download the code and run it locally to see it on your phone.
                </p>
              </div>
            )}

            {/* Phone/web toggle hint */}
            {snackUrl && (
              <div className="mt-3 flex items-center gap-3 text-xs text-white/25">
                <span>💡</span>
                <span>To see it on your actual phone: open the preview, tap the QR icon, scan with your phone camera</span>
              </div>
            )}
          </div>

          {/* Deploy Options */}
          <div className="flex flex-col">
            <h2 className="font-semibold text-white mb-4">
              {activeTab ? 'How to deploy' : 'How do you want to ship it?'}
            </h2>

            {!activeTab ? (
              <div className="grid grid-cols-2 gap-3">
                {deployPaths.map(path => (
                  <button
                    key={path.id}
                    onClick={() => setActiveTab(path.id)}
                    className="text-left rounded-2xl p-[1px] transition-all hover:scale-[1.02] active:scale-[0.99]"
                    style={{ background: `linear-gradient(135deg, ${path.color}33, rgba(255,255,255,0.03))` }}
                  >
                    <div className="bg-[#080808] rounded-2xl p-5 h-full">
                      <div className="text-2xl mb-3">{path.icon}</div>
                      <div className="font-semibold text-white text-sm mb-1">{path.title}</div>
                      <div className="text-white/40 text-xs mb-3">{path.subtitle}</div>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs" style={{ color: path.color }}>{path.cost}</div>
                        <div className="text-xs text-white/25">{path.time}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              (() => {
                const path = deployPaths.find(p => p.id === activeTab)!
                return (
                  <div className="rounded-2xl p-[1px]"
                    style={{ background: `linear-gradient(135deg, ${path.color}33, rgba(255,255,255,0.03))` }}>
                    <div className="bg-[#080808] rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{path.icon}</span>
                          <div>
                            <div className="font-semibold text-white">{path.title}</div>
                            <div className="text-xs text-white/30">{path.cost} · {path.time}</div>
                          </div>
                        </div>
                        <button onClick={() => setActiveTab(null)}
                          className="text-white/30 hover:text-white/60 transition-colors text-sm">
                          ← Back
                        </button>
                      </div>

                      <div className="space-y-4">
                        {path.steps.map(step => (
                          <div key={step.num} className="flex gap-4">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                              style={{ background: `${path.color}20`, color: path.color }}>
                              {step.num}
                            </div>
                            <p className="text-white/70 text-sm leading-relaxed">{step.text}</p>
                          </div>
                        ))}
                      </div>

                      {path.id === 'ios' || path.id === 'android' ? (
                        <div className="mt-6 p-4 rounded-xl bg-white/3 border border-white/5">
                          <p className="text-white/30 text-xs leading-relaxed">
                            💡 EAS (Expo Application Services) handles the complex parts — signing certificates,
                            build infrastructure, and store submission. You just need an account.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })()
            )}

            {/* Back to build another */}
            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <a href="/" className="text-sm text-white/30 hover:text-white/60 transition-colors">
                ← Build another site
              </a>
              <a href={appInfo?.sourceUrl || '#'} target="_blank"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View original site ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
      </div>
    }>
      <PreviewContent />
    </Suspense>
  )
}
