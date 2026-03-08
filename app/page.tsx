'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEMO_SITES = [
  { name: 'sugarfishsushi.com', label: 'Restaurant' },
  { name: 'crossfitinvictus.com', label: 'Gym' },
  { name: 'garagegym.com', label: 'Fitness' },
]

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const router = useRouter()

  const steps = [
    'Reading your website…',
    'Understanding your brand…',
    'Building your app…',
    'Almost ready…',
  ]

  const handleBuild = async (inputUrl?: string) => {
    const target = inputUrl || url
    if (!target.trim()) return

    setStatus('loading')
    setStep(0)
    setError('')

    const interval = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 4000)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      })

      clearInterval(interval)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Something went wrong')
      }

      const spec = res.headers.get('X-Spec') || ''
      const snackUrl = res.headers.get('X-Snack-Url') || ''
      const appName = res.headers.get('X-App-Name') || 'Your App'

      // Download ZIP silently in background
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${appName.toLowerCase().replace(/\s+/g, '-')}.zip`
      a.click()

      setStatus('done')

      // Go to phone-first preview page
      setTimeout(() => {
        router.push(`/preview?spec=${encodeURIComponent(spec)}&snack=${encodeURIComponent(snackUrl)}`)
      }, 800)

    } catch (err) {
      clearInterval(interval)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h4v10H2zM8 2h4v4H8zM8 9h4v3H8z" fill="white" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>SiteForge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Free to try</span>
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>$99/mo to publish</span>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 10, maxWidth: 720, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 999, padding: '6px 14px', marginBottom: 32, fontSize: 12, color: '#60a5fa' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', animation: 'pulse 2s infinite' }} />
          Live in seconds — no code required
        </div>

        <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: -2, marginBottom: 24 }}>
          Your website.
          <br />
          <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Now a real app.
          </span>
        </h1>

        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 48px', fontWeight: 300 }}>
          Paste your URL. We read your brand, extract your content, and build a native app in under 30 seconds. Scan a QR and it's on your phone.
        </p>

        {/* Input */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 6, display: 'flex', gap: 6, maxWidth: 560, margin: '0 auto 16px', boxShadow: '0 0 60px rgba(59,130,246,0.08)' }}>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBuild()}
            placeholder="yourwebsite.com"
            disabled={status === 'loading'}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 16, padding: '12px 16px', fontFamily: 'inherit' }}
          />
          <button
            onClick={() => handleBuild()}
            disabled={status === 'loading' || !url.trim()}
            style={{ background: status === 'loading' ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: 11, padding: '12px 24px', color: '#fff', fontWeight: 700, fontSize: 15, cursor: status === 'loading' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'opacity 0.2s' }}
          >
            {status === 'loading' ? 'Building…' : 'Build App →'}
          </button>
        </div>

        {/* Demo sites */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', paddingTop: 3 }}>Try:</span>
          {DEMO_SITES.map(site => (
            <button key={site.name} onClick={() => { setUrl(site.name); handleBuild(site.name) }}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              {site.name}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {status === 'loading' && (
          <div style={{ marginTop: 32, padding: '20px 24px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 14, maxWidth: 400, margin: '32px auto 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{steps[step]}</span>
            </div>
          </div>
        )}

        {/* Success transition */}
        {status === 'done' && (
          <div style={{ marginTop: 32, padding: '16px 24px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, maxWidth: 400, margin: '32px auto 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>App ready — opening preview…</span>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ marginTop: 32, padding: '16px 24px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, maxWidth: 400, margin: '32px auto 0' }}>
            <p style={{ fontSize: 14, color: '#f87171', margin: 0 }}>{error}</p>
            <button onClick={() => setStatus('idle')} style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Try again →</button>
          </div>
        )}
      </section>

      {/* How it works */}
      <section style={{ position: 'relative', zIndex: 10, maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          {[
            { step: '01', title: 'Paste your URL', body: 'We read your website — your brand, photos, menu, content.' },
            { step: '02', title: 'We build the app', body: 'In under 30 seconds. Native screens, real content, no code.' },
            { step: '03', title: 'Scan. It\'s live.', body: 'Scan a QR code and your app opens on your phone right now.' },
          ].map(item => (
            <div key={item.step} style={{ padding: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.2)', marginBottom: 12 }}>{item.step}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        ::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </main>
  )
}
