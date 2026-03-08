'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'

interface AppInfo {
  appName: string
  tagline: string
  primaryColor: string
  snackUrl: string | null
  sourceUrl: string
  screens: number
}

function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=000000&color=ffffff&qzone=2`
  return (
    <img
      src={qrUrl}
      width={size}
      height={size}
      alt="QR Code"
      style={{ borderRadius: 16, display: 'block' }}
    />
  )
}

type DeployPath = 'ios' | 'android' | 'web' | null

function PreviewContent() {
  const params = useSearchParams()
  const [deployPath, setDeployPath] = useState<DeployPath>(null)
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')
  const [snackLoaded, setSnackLoaded] = useState(false)

  let appInfo: AppInfo | null = null
  try {
    const spec = params.get('spec')
    if (spec) appInfo = JSON.parse(atob(spec.replace(/-/g, '+').replace(/_/g, '/'))) as AppInfo
  } catch { /* ignore */ }

  const snackUrl = params.get('snack') || appInfo?.snackUrl || ''
  const snackEmbedUrl = snackUrl
    ? `https://snack.expo.dev/embedded/${snackUrl.split('/').pop()}?platform=ios&preview=true&theme=dark&hideQueryParams=true`
    : ''
  // QR opens the snack in Expo Go directly
  const snackQrUrl = snackUrl
    ? snackUrl.replace('https://snack.expo.dev/', 'exp://exp.host/@snack/')
    : ''

  const primaryColor = appInfo?.primaryColor || '#3b82f6'

  if (submitted) {
    return (
      <main style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: -0.5 }}>You're on the list</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
            We'll reach out within 24 hours to get your {appInfo?.appName || 'app'} submitted to the {deployPath === 'android' ? 'Google Play Store' : 'App Store'}. No technical work required on your end.
          </p>
          <button onClick={() => setSubmitted(false)} style={{ color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back to preview
          </button>
        </div>
      </main>
    )
  }

  if (deployPath) {
    const isAndroid = deployPath === 'android'
    return (
      <main style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setDeployPath(null)} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }}>{appInfo?.appName}</span>
          <div style={{ width: 60 }} />
        </nav>
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>{isAndroid ? '🤖' : '🍎'}</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -0.8, marginBottom: 8 }}>
            {isAndroid ? 'Google Play' : 'App Store'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            We handle the entire submission — building, signing, uploading, and app review. You just need {isAndroid ? 'a Google account and the $25 one-time developer fee' : 'an Apple ID and the $99/year developer account'}. That's it.
          </p>

          <div style={{ marginBottom: 32 }}>
            {[
              isAndroid ? 'Create a Google Play Developer account ($25 one-time)' : 'Create an Apple Developer account ($99/year)',
              'Enter your email below — we reach out within 24 hours',
              'We handle building, signing, and submitting',
              isAndroid ? 'Live on Google Play within hours' : 'Live on the App Store in 1-3 days',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${primaryColor}18`, border: `1px solid ${primaryColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: primaryColor }}>
                  {i + 1}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: 0, paddingTop: 4 }}>{step}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={() => { if (email.includes('@')) setSubmitted(true) }}
              style={{ background: primaryColor, border: 'none', borderRadius: 10, padding: '13px 20px', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
            >
              Get it published →
            </button>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
            {isAndroid ? '$99/mo · cancel anytime' : '$99/mo · includes App Store submission · cancel anytime'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', background: '#000', color: '#fff', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Ambient */}
      <div style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: `radial-gradient(ellipse, ${primaryColor}15 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Nav */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <a href="/" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textDecoration: 'none' }}>← Build another</a>
        {appInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{appInfo.appName} — ready</span>
          </div>
        )}
        <div style={{ width: 100 }} />
      </nav>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, letterSpacing: -1.5, marginBottom: 12 }}>
            {appInfo ? (
              <><span style={{ color: primaryColor }}>{appInfo.appName}</span> is live</>
            ) : 'Your app is live'}
          </h1>
          {appInfo?.tagline && (
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 17, fontWeight: 300 }}>{appInfo.tagline}</p>
          )}
        </div>

        {/* Main 2-col: preview + phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 32, alignItems: 'start' }}>

          {/* Left: Live preview */}
          <div>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Live preview</span>
              {snackUrl && (
                <a href={snackUrl} target="_blank" style={{ fontSize: 12, color: '#60a5fa', textDecoration: 'none' }}>
                  Open full screen ↗
                </a>
              )}
            </div>

            {/* Phone frame */}
            <div style={{ position: 'relative', background: '#0a0a0a', borderRadius: 32, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', height: 640, boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
              {/* Notch */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 100, height: 24, background: '#000', borderRadius: '0 0 16px 16px', zIndex: 20 }} />

              {snackEmbedUrl ? (
                <>
                  {!snackLoaded && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 10 }}>
                      <div style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.1)', borderTop: `2px solid ${primaryColor}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Loading your app…</span>
                    </div>
                  )}
                  <iframe
                    src={snackEmbedUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    onLoad={() => setSnackLoaded(true)}
                  />
                </>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, lineHeight: 1.6 }}>Preview unavailable in browser — scan the QR code to see it on your phone</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: QR + Publish */}
          <div style={{ position: 'sticky', top: 24 }}>

            {/* QR — primary action */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 28, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Open on your phone right now</div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20, lineHeight: 1.6 }}>
                Point your phone camera at this code
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                {snackUrl ? (
                  <QRCode value={snackUrl} size={160} />
                ) : (
                  <div style={{ width: 160, height: 160, background: 'rgba(255,255,255,0.04)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>No QR available</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', lineHeight: 1.6 }}>
                Works on iPhone and Android.<br />No app download needed to preview.
              </p>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>READY TO PUBLISH?</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Publish buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setDeployPath('ios')}
                style={{ width: '100%', padding: '14px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>🍎</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Publish to App Store</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>We handle everything · $99/mo</div>
                  </div>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>›</span>
              </button>

              <button
                onClick={() => setDeployPath('android')}
                style={{ width: '100%', padding: '14px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>🤖</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Publish to Google Play</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>We handle everything · $99/mo</div>
                  </div>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>›</span>
              </button>
            </div>

            {/* Source download — secondary, tiny */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>
                Source code downloaded to your Downloads folder
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </main>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  )
}
