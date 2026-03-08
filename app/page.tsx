'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'scraping' | 'analyzing' | 'generating' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [appName, setAppName] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const steps = [
    { key: 'scraping',   label: 'Reading the website',     detail: 'Fetching content, colors, and structure' },
    { key: 'analyzing',  label: 'Analyzing with Claude',   detail: 'Extracting brand, layout, and navigation' },
    { key: 'generating', label: 'Generating native app',   detail: 'Writing screens, components, and config' },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === status)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setError('')
    setAppName('')
    setStatus('scraping')

    setTimeout(() => setStatus('analyzing'), 4000)
    setTimeout(() => setStatus('generating'), 10000)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }

      const name = res.headers.get('X-App-Name') || 'your-app'
      setAppName(name)

      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${name.toLowerCase().replace(/\s+/g, '-')}.zip`
      link.click()

      setStatus('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  const isLoading = ['scraping', 'analyzing', 'generating'].includes(status)

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, #3b82f6 0%, #8b5cf6 40%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, #06b6d4 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h4v10H2zM8 2h4v4H8zM8 9h4v3H8z" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-white tracking-tight">SiteForge</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/30 uppercase tracking-widest hidden sm:block">AI-Powered</span>
          <a href="https://github.com/officialbrandonsandoval-source/siteforge"
            target="_blank"
            className="text-xs text-white/40 hover:text-white/70 transition-colors border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg">
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 text-xs text-white/60">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Powered by Claude Vision + Expo
        </div>

        {/* Headline */}
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight leading-none mb-6">
          <span className="text-white">Any website.</span>
          <br />
          <span style={{
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Real native app.
          </span>
        </h1>

        <p className="text-white/50 text-xl leading-relaxed max-w-2xl mx-auto mb-12">
          Paste a URL. Claude analyzes your site, extracts your brand, and ships
          a production Expo app for iOS and Android — in under 30 seconds.
        </p>

        {/* Input card */}
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-2xl p-[1px]"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.4), rgba(139,92,246,0.2), rgba(255,255,255,0.05))' }}>
            <div className="bg-[#0a0a0a] rounded-2xl p-2">
              <form onSubmit={handleGenerate} className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM6.5 5a.75.75 0 000 1.5H8v3.25a.75.75 0 001.5 0V6a1 1 0 00-1-1H6.5z"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full bg-transparent pl-10 pr-4 py-4 text-white placeholder-white/20 focus:outline-none text-base"
                    disabled={isLoading}
                    autoComplete="url"
                    spellCheck={false}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!url.trim() || isLoading}
                  className="relative shrink-0 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: !url.trim() || isLoading
                      ? 'rgba(255,255,255,0.05)'
                      : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Building
                    </span>
                  ) : 'Build App →'}
                </button>
              </form>
            </div>
          </div>

          {/* Hint */}
          {status === 'idle' && (
            <p className="text-white/20 text-xs mt-3">
              Works with any public website · Generates real Expo code · iOS + Android
            </p>
          )}

          {/* Progress steps */}
          {isLoading && (
            <div className="mt-6 space-y-1">
              {steps.map((step, i) => {
                const isDone = i < currentStepIndex
                const isActive = step.key === status
                return (
                  <div key={step.key}
                    className="flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300"
                    style={{ background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent', border: isActive ? '1px solid rgba(59,130,246,0.15)' : '1px solid transparent' }}>
                    <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                      {isDone ? (
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="7" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.4)" strokeWidth="1"/>
                          <path d="M5 8l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : isActive ? (
                        <span className="w-4 h-4 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white/10" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className={`text-sm font-medium ${isActive ? 'text-white' : isDone ? 'text-white/40' : 'text-white/20'}`}>
                        {step.label}
                      </div>
                      {isActive && (
                        <div className="text-xs text-white/30 mt-0.5">{step.detail}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Success */}
          {status === 'done' && (
            <div className="mt-6 rounded-2xl p-[1px]"
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.05))' }}>
              <div className="bg-[#0a0a0a] rounded-2xl p-6 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/10 border border-green-500/20">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3 3 6-6" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{appName} is ready</div>
                    <div className="text-xs text-white/40">ZIP downloaded · Open in Expo Go instantly</div>
                  </div>
                </div>
                <div className="bg-black/50 rounded-xl p-4 font-mono text-xs text-white/60 space-y-1 border border-white/5">
                  <div><span className="text-white/25">$</span> cd {appName?.toLowerCase().replace(/\s+/g, '-') || 'your-app'}</div>
                  <div><span className="text-white/25">$</span> npm install</div>
                  <div><span className="text-white/25">$</span> npx expo start</div>
                  <div className="text-green-400/70 pt-1">✓ Scan QR with Expo Go → running on your phone</div>
                </div>
                <button onClick={() => { setStatus('idle'); setUrl('') }}
                  className="mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Build another site →
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="mt-4 flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-left">
              <span className="text-red-400 shrink-0 mt-0.5">⚠</span>
              <div>
                <div className="text-red-400 text-sm">{error}</div>
                <button onClick={() => setStatus('idle')} className="text-xs text-white/30 hover:text-white/50 mt-1 transition-colors">Try again</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social proof strip */}
      <div className="relative z-10 border-y border-white/5 py-5 px-6 mb-20">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-xs text-white/25 uppercase tracking-widest">
          {['Claude Vision', 'Expo SDK 52', 'React Native', 'iOS + Android', 'App Store Ready'].map(item => (
            <span key={item} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/20" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight mb-3">From URL to app store in minutes</h2>
          <p className="text-white/40">Three steps. No configuration. No design work.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              num: '01',
              icon: '🌐',
              title: 'Paste any URL',
              desc: 'Drop in your website address. SiteForge handles the rest — scraping content, colors, nav structure, and your brand identity.',
              color: '#3b82f6',
            },
            {
              num: '02',
              icon: '🧠',
              title: 'AI designs your app',
              desc: 'Claude Vision analyzes a mobile screenshot of your site. Extracts brand colors, defines screens, maps navigation — all automatically.',
              color: '#8b5cf6',
            },
            {
              num: '03',
              icon: '📦',
              title: 'Download and ship',
              desc: 'Get a production-ready Expo project. Run it instantly with Expo Go. Submit to App Store or Google Play when ready.',
              color: '#ec4899',
            },
          ].map(step => (
            <div key={step.num}
              className="relative rounded-2xl p-[1px]"
              style={{ background: `linear-gradient(135deg, ${step.color}22, rgba(255,255,255,0.03))` }}>
              <div className="bg-[#080808] rounded-2xl p-6 h-full">
                <div className="flex items-center justify-between mb-5">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs font-mono" style={{ color: step.color + '80' }}>{step.num}</span>
                </div>
                <h3 className="font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M2 2h4v10H2zM8 2h4v4H8zM8 9h4v3H8z" fill="white" />
              </svg>
            </div>
            <span className="text-white/30 text-sm">SiteForge</span>
          </div>
          <span className="text-white/20 text-xs">Built by Praxis · Sandoval Solutions LLC</span>
        </div>
      </footer>

    </main>
  )
}
