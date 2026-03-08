'use client'

import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'scraping' | 'analyzing' | 'generating' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [appName, setAppName] = useState('')

  const steps = [
    { key: 'scraping',   label: 'Reading the website...' },
    { key: 'analyzing',  label: 'Analyzing design with AI...' },
    { key: 'generating', label: 'Generating your app...' },
  ]

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return

    setError('')
    setAppName('')
    setStatus('scraping')

    try {
      // Fake step progression for UX
      setTimeout(() => setStatus('analyzing'), 3000)
      setTimeout(() => setStatus('generating'), 8000)

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

      // Trigger download
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

  return (
    <main className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col">

      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight">SiteForge</span>
        <span className="text-xs text-zinc-500 uppercase tracking-widest">By Sandoval Solutions</span>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full mx-auto text-center">

          <div className="inline-block bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
            Paste a URL. Get a real app.
          </div>

          <h1 className="text-5xl font-bold tracking-tight mb-4 leading-tight">
            Any website.<br />
            <span className="text-[#3b82f6]">Real native app.</span>
          </h1>

          <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
            SiteForge analyzes your website, extracts your brand, and generates
            a production-ready Expo app — iOS and Android — in under 30 seconds.
          </p>

          {/* Input */}
          <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yoursite.com"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={['scraping', 'analyzing', 'generating'].includes(status)}
            />
            <button
              type="submit"
              disabled={!url.trim() || ['scraping', 'analyzing', 'generating'].includes(status)}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
            >
              {['scraping', 'analyzing', 'generating'].includes(status) ? 'Building...' : 'Build My App →'}
            </button>
          </form>

          {/* Progress */}
          {['scraping', 'analyzing', 'generating'].includes(status) && (
            <div className="mt-6 space-y-2">
              {steps.map((step) => {
                const stepIndex = steps.findIndex(s => s.key === status)
                const thisIndex = steps.findIndex(s => s.key === step.key)
                const isDone = thisIndex < stepIndex
                const isActive = step.key === status
                return (
                  <div key={step.key} className={`flex items-center gap-3 text-sm px-4 py-2 rounded-lg transition-all
                    ${isActive ? 'bg-zinc-800 text-white' : isDone ? 'text-zinc-500' : 'text-zinc-700'}`}>
                    <span className="w-4 h-4 flex items-center justify-center">
                      {isDone ? '✓' : isActive ? (
                        <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : '○'}
                    </span>
                    {step.label}
                  </div>
                )
              })}
            </div>
          )}

          {/* Success */}
          {status === 'done' && (
            <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="font-semibold text-white">{appName} generated</span>
              </div>
              <p className="text-zinc-400 text-sm mb-4">Your ZIP is downloading. To run it:</p>
              <pre className="bg-zinc-950 rounded-lg p-4 text-xs text-zinc-300 overflow-x-auto">
{`cd ${appName?.toLowerCase().replace(/\s+/g, '-') || 'your-app'}
npm install
npx expo start`}
              </pre>
              <p className="text-zinc-500 text-xs mt-3">Scan the QR code with Expo Go on your phone. That's it.</p>
              <button
                onClick={() => { setStatus('idle'); setUrl('') }}
                className="mt-4 text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                Build another →
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="mt-4 bg-red-950/30 border border-red-900 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
              <button onClick={() => setStatus('idle')} className="ml-3 text-red-300 hover:text-red-200 underline">Try again</button>
            </div>
          )}

        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-zinc-800 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { num: '01', title: 'Paste your URL', desc: 'Drop in any website URL. Public sites work best.' },
              { num: '02', title: 'AI analyzes it', desc: 'Claude reads your site\'s design, content, and structure. Extracts your brand.' },
              { num: '03', title: 'Download your app', desc: 'Get a production Expo project. Open in Expo Go instantly. Ship to both stores.' },
            ].map(step => (
              <div key={step.num} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="text-blue-500 text-sm font-bold mb-3 tracking-widest">{step.num}</div>
                <div className="font-semibold mb-2">{step.title}</div>
                <div className="text-zinc-400 text-sm leading-relaxed">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-6 text-center text-zinc-600 text-xs">
        SiteForge · Sandoval Solutions LLC · Built by Praxis
      </footer>

    </main>
  )
}
