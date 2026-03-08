import { AppSpec } from './analyzer'
import { SiteData } from './scraper'

export interface SnackResult {
  snackUrl: string
  snackId: string
}

function isLight(hex: string): boolean {
  if (!hex || !hex.startsWith('#')) return false
  const num = parseInt(hex.replace('#', ''), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

function lighten(hex: string, amt = 20): string {
  if (!hex?.startsWith('#')) return '#1c1c1c'
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 0xff) + amt)
  const g = Math.min(255, ((n >> 8) & 0xff) + amt)
  const b = Math.min(255, (n & 0xff) + amt)
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

// Generate a rich, visually branded Snack app
function generateSnackApp(spec: AppSpec, siteData: SiteData): string {
  const heroImg = siteData.heroImages[0] || siteData.ogImage || ''
  const secondImg = siteData.heroImages[1] || ''
  const thirdImg = siteData.heroImages[2] || ''
  const hasPhotography = !!heroImg
  const logoImg = siteData.logoUrl || ''

  const isDark = !isLight(spec.backgroundColor)
  const textColor = isDark ? '#ffffff' : '#111111'
  const mutedColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const tabBorderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'

  // Build real nav items from actual site links
  const navItems = siteData.navLinks
    .filter(l => l.label && l.href)
    .slice(0, 6)

  // Build tab bar from spec
  const tabs = spec.bottomTabs.slice(0, 4).map((t, i) => ({
    id: t.name.toLowerCase().replace(/\s+/g, '_'),
    label: t.name,
    icon: getTabIcon(t.icon || t.name, i),
  }))

  // CTA link
  const ctaLink = siteData.navLinks.find(l => /reserv|book|order/i.test(l.label))
  const ctaHref = esc(ctaLink?.href || siteData.url)
  const ctaLabel = esc(ctaLink?.label || 'Get Started')

  // Reserve link
  const reserveLink = siteData.navLinks.find(l => /reserv|book|order|contact/i.test(l.label))
  const reserveHref = esc(reserveLink?.href || siteData.url)
  const reserveLabel = esc(reserveLink?.label || 'Make a Reservation')

  // Hero fallback: no-photo mode
  const heroNoPhoto = `
        <View style={s.hero}>
          <View style={[s.heroSolid, { backgroundColor: C.primary }]}>
            ${logoImg ? `<Image source={{ uri: '${esc(logoImg)}' }} style={s.heroLogo} resizeMode="contain" />` : `<Text style={s.heroEditorial}>${esc(spec.appName)}</Text>`}
          </View>
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>${esc(spec.appName)}</Text>
            <Text style={s.heroSub}>${esc(spec.tagline)}</Text>
            <TouchableOpacity style={s.heroCta} onPress={() => openLink('${ctaHref}')}>
              <Text style={s.heroCtaText}>${ctaLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>`

  const heroWithPhoto = `
        <View style={s.hero}>
          <Image source={{ uri: HERO_IMG }} style={s.heroBg} resizeMode="cover" />
          {/* Gradient simulation — top fade for status bar */}
          <View style={s.gradTop1} />
          <View style={s.gradTop2} />
          {/* Gradient simulation — bottom fade */}
          <View style={s.gradBot1} />
          <View style={s.gradBot2} />
          <View style={s.gradBot3} />
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>${esc(spec.appName)}</Text>
            <Text style={s.heroSub}>${esc(spec.tagline)}</Text>
            <TouchableOpacity style={s.heroCta} onPress={() => openLink('${ctaHref}')}>
              <Text style={s.heroCtaText}>${ctaLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>`

  // Quick links section
  const quickLinks = navItems.slice(0, 5).map(link => `
        <TouchableOpacity style={s.linkRow} onPress={() => openLink('${esc(link.href)}')}>
          <Text style={s.linkLabel}>${esc(link.label)}</Text>
          <Text style={s.linkArrow}>{'\u2192'}</Text>
        </TouchableOpacity>`).join('')

  // Photo feature
  let photoFeature = ''
  if (secondImg && thirdImg) {
    photoFeature = `
      <View style={s.photoDuo}>
        <Image source={{ uri: '${esc(secondImg)}' }} style={s.photoDuoImg} resizeMode="cover" />
        <Image source={{ uri: '${esc(thirdImg)}' }} style={s.photoDuoImg} resizeMode="cover" />
      </View>`
  } else if (secondImg) {
    photoFeature = `
      <Image source={{ uri: '${esc(secondImg)}' }} style={s.photoSingle} resizeMode="cover" />`
  }

  // Story section
  const storySection = siteData.sections[0] ? `
      <View style={s.storySection}>
        <Text style={s.storyHeadline}>${esc(siteData.sections[0].heading)}</Text>
        ${siteData.sections[0].content ? `<Text style={s.storyBody}>${esc(siteData.sections[0].content.slice(0, 180))}</Text>` : ''}
      </View>` : ''

  // Menu screen links
  const menuLinks = siteData.navLinks.map(link => `
      <TouchableOpacity style={s.menuRow} onPress={() => openLink('${esc(link.href)}')}>
        <Text style={s.menuLabel}>${esc(link.label)}</Text>
        <Text style={s.menuArrow}>{'\u2192'}</Text>
      </TouchableOpacity>`).join('')

  // Story screen sections
  const storySections = siteData.sections.slice(0, 4).map((sec, i) => `
      <View style={[s.storySec, ${i % 2 !== 0 ? '{ paddingLeft: 40 }' : '{}'}]}>
        <Text style={s.storySecHead}>${esc(sec.heading)}</Text>
        ${sec.content ? `<Text style={s.storySecBody}>${esc(sec.content.slice(0, 200))}</Text>` : ''}
      </View>`).join('')

  return `import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Linking, Image,
  Dimensions,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const C = {
  primary:    '${spec.primaryColor || '#000000'}',
  bg:         '${spec.backgroundColor || '#0a0a0a'}',
  text:       '${textColor}',
  muted:      '${mutedColor}',
  divider:    '${dividerColor}',
  tabBorder:  '${tabBorderColor}',
  accent:     '${spec.accentColor || spec.primaryColor || '#3b82f6'}',
};

const SITE_URL = '${esc(siteData.url)}';
const HERO_IMG = '${esc(heroImg)}';

function openLink(path) {
  Linking.openURL(path.startsWith('http') ? path : SITE_URL + path);
}

// ── HOME SCREEN ───────────────────────────────────────────────────────────
function HomeScreen() {
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      {/* Immersive hero — no header bar */}
      ${hasPhotography ? heroWithPhoto : heroNoPhoto}

      {/* Quick links */}
      <View style={s.linksSection}>
        <Text style={s.sectionLabel}>EXPLORE</Text>
${quickLinks}
      </View>

      {/* Photo feature */}
${photoFeature}

      {/* Story / About */}
${storySection}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── MENU / LINKS SCREEN ───────────────────────────────────────────────────
function MenuScreen() {
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <Text style={s.screenTitle}>Menu</Text>
${menuLinks}
      <TouchableOpacity style={s.visitLink} onPress={() => openLink(SITE_URL)}>
        <Text style={s.visitText}>Visit {'\u2197'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── RESERVE / CONTACT SCREEN ──────────────────────────────────────────────
function ReserveScreen() {
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.reserveContainer}>
      ${secondImg ? `<Image source={{ uri: '${esc(secondImg)}' }} style={s.reserveImg} resizeMode="cover" />` : ''}
      <Text style={s.reserveName}>${esc(spec.appName)}</Text>
      <Text style={s.reserveDesc}>${esc(siteData.description?.slice(0, 120) || 'Book your experience today.')}</Text>
      <TouchableOpacity style={s.reserveBtn} onPress={() => openLink('${reserveHref}')}>
        <Text style={s.reserveBtnText}>${reserveLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.reserveSecondary} onPress={() => openLink(SITE_URL)}>
        <Text style={s.reserveSecText}>or visit website</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── OUR STORY SCREEN ──────────────────────────────────────────────────────
function StoryScreen() {
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      <Text style={s.screenTitle}>Our Story</Text>
${storySections}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── APP SHELL ─────────────────────────────────────────────────────────────
const TABS = ${JSON.stringify(tabs)};

export default function App() {
  const [active, setActive] = useState(TABS[0]?.id || 'home');
  const isDark = ${isDark};

  const renderScreen = () => {
    if (active === TABS[0]?.id) return <HomeScreen />;
    if (active === TABS[1]?.id) return <MenuScreen />;
    if (active === TABS[2]?.id) return <ReserveScreen />;
    return <StoryScreen />;
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      <View style={s.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab.id} style={[s.tab, { opacity: active === tab.id ? 1 : 0.5 }]} onPress={() => setActive(tab.id)}>
            <Text style={s.tabIcon}>{tab.icon}</Text>
            <Text style={[s.tabLabel, { fontWeight: active === tab.id ? '700' : '400' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: C.bg },
  screen:           { flex: 1, backgroundColor: C.bg },

  // ── Hero (immersive, no header) ─────────────────────────────────
  hero:             { width: W, height: H * 0.6 },
  heroBg:           { ...StyleSheet.absoluteFillObject, width: W, height: H * 0.6 },
  heroSolid:        { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  heroLogo:         { width: 120, height: 120, tintColor: '${isDark ? '#ffffff' : undefined}' },
  heroEditorial:    { fontSize: 52, fontWeight: '900', color: '#fff', fontStyle: 'italic', letterSpacing: -2, textAlign: 'center', paddingHorizontal: 20 },

  // Gradient simulation layers — top
  gradTop1:         { position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.12, backgroundColor: 'rgba(0,0,0,0.18)' },
  gradTop2:         { position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.06, backgroundColor: 'rgba(0,0,0,0.10)' },
  // Gradient simulation layers — bottom
  gradBot1:         { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.40, backgroundColor: 'rgba(0,0,0,0.15)' },
  gradBot2:         { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.25, backgroundColor: 'rgba(0,0,0,0.25)' },
  gradBot3:         { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.12, backgroundColor: '${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)'}' },

  heroContent:      { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 28 },
  heroTitle:        { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1.5, marginBottom: 6 },
  heroSub:          { fontSize: 16, fontWeight: '300', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5, marginBottom: 20 },
  heroCta:          { alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 20, paddingVertical: 9, borderRadius: 4, backgroundColor: 'transparent' },
  heroCtaText:      { fontSize: 13, fontWeight: '500', color: '#fff', letterSpacing: 0.5 },

  // ── Quick links ─────────────────────────────────────────────────
  linksSection:     { paddingTop: 28 },
  sectionLabel:     { fontSize: 11, fontWeight: '500', letterSpacing: 3, color: C.muted, paddingHorizontal: 20, marginBottom: 8 },
  linkRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.divider },
  linkLabel:        { fontSize: 16, fontWeight: '500', color: C.text },
  linkArrow:        { fontSize: 16, color: C.muted },

  // ── Photo feature ───────────────────────────────────────────────
  photoDuo:         { flexDirection: 'row', marginTop: 24 },
  photoDuoImg:      { width: W / 2, height: 180 },
  photoSingle:      { width: W, height: W * 9 / 16, marginTop: 24 },

  // ── Story / about (editorial) ───────────────────────────────────
  storySection:     { padding: 20, paddingTop: 32 },
  storyHeadline:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: C.text, marginBottom: 12 },
  storyBody:        { fontSize: 15, lineHeight: 24, fontWeight: '300', letterSpacing: 0.1, color: C.muted },

  // ── Menu screen ─────────────────────────────────────────────────
  screenTitle:      { fontSize: 32, fontWeight: '900', letterSpacing: -0.8, color: C.text, paddingTop: 24, paddingHorizontal: 20, paddingBottom: 16 },
  menuRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.divider },
  menuLabel:        { fontSize: 16, fontWeight: '500', color: C.text },
  menuArrow:        { fontSize: 16, color: C.muted },
  visitLink:        { paddingHorizontal: 20, paddingVertical: 24 },
  visitText:        { fontSize: 13, fontWeight: '400', color: C.muted, letterSpacing: 0.5 },

  // ── Reserve screen ──────────────────────────────────────────────
  reserveContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  reserveImg:       { width: W - 40, height: 220, borderRadius: 16, marginBottom: 24 },
  reserveName:      { fontSize: 32, fontWeight: '900', letterSpacing: -0.8, color: C.text, textAlign: 'center', marginBottom: 8 },
  reserveDesc:      { fontSize: 15, fontWeight: '300', lineHeight: 24, color: C.muted, textAlign: 'center', marginBottom: 28, paddingHorizontal: 20 },
  reserveBtn:       { width: '100%', paddingVertical: 16, borderRadius: 8, alignItems: 'center', backgroundColor: C.primary },
  reserveBtnText:   { fontSize: 16, fontWeight: '700', color: '${isLight(spec.primaryColor || '#000') ? '#000000' : '#ffffff'}' },
  reserveSecondary: { marginTop: 16 },
  reserveSecText:   { fontSize: 13, fontWeight: '400', color: C.muted },

  // ── Our Story screen (editorial) ───────────────────────────────
  storySec:         { paddingHorizontal: 20, paddingVertical: 20 },
  storySecHead:     { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, color: C.text, marginBottom: 8 },
  storySecBody:     { fontSize: 15, lineHeight: 24, fontWeight: '300', letterSpacing: 0.1, color: C.muted },

  // ── Tab bar ─────────────────────────────────────────────────────
  tabBar:           { flexDirection: 'row', height: 58, borderTopWidth: 0.5, borderTopColor: C.tabBorder, backgroundColor: C.bg, paddingBottom: 6, paddingTop: 6 },
  tab:              { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon:          { fontSize: 20, marginBottom: 2, color: C.text },
  tabLabel:         { fontSize: 10, letterSpacing: 0.5, color: C.text },
});
`
}

function getTabIcon(nameOrIcon: string, index: number): string {
  const n = nameOrIcon.toLowerCase()
  if (n.includes('home') || n.includes('house')) return '🏠'
  if (n.includes('menu') || n.includes('food') || n.includes('eat') || n.includes('restaurant')) return '☰'
  if (n.includes('reserv') || n.includes('book') || n.includes('order')) return '📅'
  if (n.includes('story') || n.includes('about') || n.includes('info')) return '✦'
  if (n.includes('search') || n.includes('find')) return '🔍'
  if (n.includes('person') || n.includes('account') || n.includes('profile')) return '👤'
  if (n.includes('setting')) return '⚙'
  if (n.includes('dine') || n.includes('dining')) return '🍽'
  const fallbacks = ['🏠', '☰', '📅', '✦']
  return fallbacks[index] || '✦'
}

export async function publishToSnack(spec: AppSpec, siteData: SiteData): Promise<SnackResult> {
  const appCode = generateSnackApp(spec, siteData)

  const payload = {
    manifest: {
      sdkVersion: '52.0.0',
      name: spec.appName,
      slug: `${spec.appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
      description: spec.tagline,
    },
    code: {
      'App.tsx': {
        type: 'CODE',
        contents: appCode,
      },
    },
    dependencies: {
      'react': '18.3.1',
      'react-native': '0.76.5',
      'expo': '~52.0.0',
    },
  }

  const res = await fetch('https://exp.host/--/api/v2/snack/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) throw new Error(`Snack API failed: ${res.status}`)

  const data = await res.json() as { id: string; hashId?: string }
  const snackId = data.hashId || data.id
  const snackUrl = `https://snack.expo.dev/${snackId}`

  return { snackUrl, snackId }
}
