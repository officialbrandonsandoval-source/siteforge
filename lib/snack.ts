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

function darken(hex: string, amt = 30): string {
  if (!hex?.startsWith('#')) return '#000000'
  const n = parseInt(hex.slice(1), 16)
  const r = Math.max(0, ((n >> 16) & 0xff) - amt)
  const g = Math.max(0, ((n >> 8) & 0xff) - amt)
  const b = Math.max(0, (n & 0xff) - amt)
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

// Generate a rich, visually branded Snack app
function generateSnackApp(spec: AppSpec, siteData: SiteData): string {
  const heroImg = siteData.heroImages[0] || siteData.ogImage || ''
  const secondImg = siteData.heroImages[1] || ''
  const thirdImg = siteData.heroImages[2] || ''

  const textColor = isLight(spec.backgroundColor) ? '#111111' : '#ffffff'
  const mutedColor = isLight(spec.backgroundColor) ? '#555555' : '#aaaaaa'
  const cardBg = isLight(spec.backgroundColor) ? '#f5f5f5' : lighten(spec.backgroundColor, 12)
  const borderColor = isLight(spec.backgroundColor) ? '#e0e0e0' : lighten(spec.backgroundColor, 20)

  // Build real nav items from actual site links
  const navItems = siteData.navLinks
    .filter(l => l.label && l.href)
    .slice(0, 5)

  // Build tab bar from spec
  const tabs = spec.bottomTabs.slice(0, 4).map((t, i) => ({
    id: t.name.toLowerCase().replace(/\s+/g, '_'),
    label: t.name,
    icon: getTabIcon(t.icon || t.name, i),
  }))

  return `import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Linking, Image, ImageBackground,
  Dimensions,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const C = {
  primary:    '${spec.primaryColor || '#000000'}',
  bg:         '${spec.backgroundColor || '#0a0a0a'}',
  text:       '${textColor}',
  muted:      '${mutedColor}',
  card:       '${cardBg}',
  border:     '${borderColor}',
  accent:     '${spec.accentColor || spec.primaryColor || '#3b82f6'}',
};

const SITE_URL = '${siteData.url}';
const HERO_IMG = '${heroImg}';
const IMG_2    = '${secondImg}';
const IMG_3    = '${thirdImg}';

function openLink(path) {
  Linking.openURL(path.startsWith('http') ? path : SITE_URL + path);
}

// ── HOME SCREEN ───────────────────────────────────────────────────────────
function HomeScreen() {
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      {/* Hero with brand photography */}
      {HERO_IMG ? (
        <ImageBackground source={{ uri: HERO_IMG }} style={s.hero} resizeMode="cover">
          <View style={s.heroOverlay}>
            <Text style={s.heroTitle}>${spec.appName}</Text>
            <Text style={s.heroSub}>${spec.tagline}</Text>
            <TouchableOpacity
              style={s.heroCta}
              onPress={() => openLink('${siteData.navLinks.find(l => /reserv|book|order/i.test(l.label))?.href || siteData.url}')}
            >
              <Text style={s.heroCtaText}>${siteData.navLinks.find(l => /reserv|book|order/i.test(l.label))?.label || 'Get Started'}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      ) : (
        <View style={[s.hero, { backgroundColor: C.primary, justifyContent: 'flex-end' }]}>
          <View style={s.heroOverlay}>
            <Text style={s.heroTitle}>${spec.appName}</Text>
            <Text style={s.heroSub}>${spec.tagline}</Text>
          </View>
        </View>
      )}

      {/* Quick action tiles */}
      <View style={s.tiles}>
        ${navItems.slice(0, 4).map((link, i) => `
        <TouchableOpacity style={[s.tile, { backgroundColor: C.card }]} onPress={() => openLink('${link.href}')}>
          <Text style={[s.tileLabel, { color: C.text }]}>${link.label}</Text>
          <Text style={[s.tileArrow, { color: C.accent }]}>›</Text>
        </TouchableOpacity>`).join('')}
      </View>

      {/* Brand photo strip */}
      ${secondImg || thirdImg ? `
      <View style={s.photoStrip}>
        ${secondImg ? `<Image source={{ uri: '${secondImg}' }} style={s.stripPhoto} resizeMode="cover" />` : ''}
        ${thirdImg ? `<Image source={{ uri: '${thirdImg}' }} style={s.stripPhoto} resizeMode="cover" />` : ''}
      </View>` : ''}

      {/* Story / About */}
      ${siteData.sections[0] ? `
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: C.text }]}>${siteData.sections[0].heading.replace(/'/g, "\\'")}</Text>
        ${siteData.sections[0].content ? `<Text style={[s.sectionBody, { color: C.muted }]}>${siteData.sections[0].content.slice(0, 160).replace(/'/g, "\\'")}</Text>` : ''}
      </View>` : ''}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── MENU / LINKS SCREEN ───────────────────────────────────────────────────
function MenuScreen() {
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20 }}>
      <Text style={[s.pageTitle, { color: C.text }]}>Menu</Text>
      ${siteData.navLinks.map((link, i) => `
      <TouchableOpacity style={[s.menuRow, { backgroundColor: C.card, borderBottomColor: C.border }]} onPress={() => openLink('${link.href}')}>
        <Text style={[s.menuLabel, { color: C.text }]}>${link.label.replace(/'/g, "\\'")}</Text>
        <Text style={[s.menuArrow, { color: C.accent }]}>›</Text>
      </TouchableOpacity>`).join('')}
    </ScrollView>
  );
}

// ── RESERVE / CONTACT SCREEN ──────────────────────────────────────────────
function ReserveScreen() {
  const reserveLink = '${siteData.navLinks.find(l => /reserv|book|order|contact/i.test(l.label))?.href || siteData.url}';
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
      ${secondImg ? `<Image source={{ uri: '${secondImg}' }} style={s.reserveImg} resizeMode="cover" />` : ''}
      <Text style={[s.pageTitle, { color: C.text, textAlign: 'center', marginTop: 20 }]}>${siteData.navLinks.find(l => /reserv|book|order/i.test(l.label))?.label || 'Make a Reservation'}</Text>
      <Text style={[s.sectionBody, { color: C.muted, textAlign: 'center', marginBottom: 24 }]}>${siteData.description?.slice(0, 100).replace(/'/g, "\\'") || 'Book your table today.'}</Text>
      <TouchableOpacity style={[s.bigCta, { backgroundColor: C.primary }]} onPress={() => openLink(reserveLink)}>
        <Text style={s.bigCtaText}>${siteData.navLinks.find(l => /reserv|book|order/i.test(l.label))?.label || 'Reserve Now'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.bigCtaOutline, { borderColor: C.primary, marginTop: 12 }]} onPress={() => openLink(SITE_URL)}>
        <Text style={[s.bigCtaOutlineText, { color: C.primary }]}>Visit Website</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── OUR STORY SCREEN ──────────────────────────────────────────────────────
function StoryScreen() {
  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20 }}>
      <Text style={[s.pageTitle, { color: C.text }]}>Our Story</Text>
      ${siteData.sections.slice(0, 4).map(sec => `
      <View style={[s.storyCard, { backgroundColor: C.card }]}>
        <Text style={[s.storyHeading, { color: C.text }]}>${sec.heading.replace(/'/g, "\\'")}</Text>
        ${sec.content ? `<Text style={[s.storyBody, { color: C.muted }]}>${sec.content.slice(0, 180).replace(/'/g, "\\'")}</Text>` : ''}
      </View>`).join('')}
    </ScrollView>
  );
}

// ── APP SHELL ─────────────────────────────────────────────────────────────
const TABS = ${JSON.stringify(tabs)};

export default function App() {
  const [active, setActive] = useState(TABS[0]?.id || 'home');
  const isDark = ${isLight(spec.backgroundColor) ? 'false' : 'true'};

  const renderScreen = () => {
    if (active === TABS[0]?.id) return <HomeScreen />;
    if (active === TABS[1]?.id) return <MenuScreen />;
    if (active === TABS[2]?.id) return <ReserveScreen />;
    return <StoryScreen />;
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      <View style={[s.header, { backgroundColor: C.bg, borderBottomColor: C.border }]}>
        <Text style={[s.headerTitle, { color: C.text }]}>${spec.appName}</Text>
      </View>
      <View style={{ flex: 1 }}>{renderScreen()}</View>
      <View style={[s.tabBar, { backgroundColor: C.bg, borderTopColor: C.border }]}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab.id} style={s.tab} onPress={() => setActive(tab.id)}>
            <Text style={[s.tabIcon, { color: active === tab.id ? C.primary : C.muted }]}>{tab.icon}</Text>
            <Text style={[s.tabLabel, { color: active === tab.id ? C.primary : C.muted, fontWeight: active === tab.id ? '600' : '400' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1 },
  header:         { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle:    { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  screen:         { flex: 1 },

  // Hero
  hero:           { width: W, height: H * 0.52 },
  heroOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', justifyContent: 'flex-end', padding: 24 },
  heroTitle:      { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.8, marginBottom: 6 },
  heroSub:        { fontSize: 15, color: 'rgba(255,255,255,0.82)', lineHeight: 22, marginBottom: 20 },
  heroCta:        { alignSelf: 'flex-start', backgroundColor: '${spec.primaryColor || '#ffffff'}', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10 },
  heroCtaText:    { fontSize: 14, fontWeight: '700', color: '${isLight(spec.primaryColor || '#ffffff') ? '#000000' : '#ffffff'}' },

  // Tiles
  tiles:          { padding: 16, gap: 8 },
  tile:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12 },
  tileLabel:      { fontSize: 15, fontWeight: '500' },
  tileArrow:      { fontSize: 22, fontWeight: '300' },

  // Photo strip
  photoStrip:     { flexDirection: 'row', gap: 2, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  stripPhoto:     { flex: 1, height: 130 },

  // Section
  section:        { padding: 20, paddingTop: 8 },
  sectionTitle:   { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: 8 },
  sectionBody:    { fontSize: 14, lineHeight: 21 },

  // Menu
  pageTitle:      { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16 },
  menuRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 10, marginBottom: 8 },
  menuLabel:      { fontSize: 15, fontWeight: '500' },
  menuArrow:      { fontSize: 22 },

  // Reserve
  reserveImg:     { width: W - 40, height: 200, borderRadius: 14, marginBottom: 4 },
  bigCta:         { width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  bigCtaText:     { fontSize: 16, fontWeight: '700', color: '${isLight(spec.primaryColor || '#000') ? '#000000' : '#ffffff'}' },
  bigCtaOutline:  { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  bigCtaOutlineText: { fontSize: 15, fontWeight: '600' },

  // Story
  storyCard:      { borderRadius: 12, padding: 16, marginBottom: 10 },
  storyHeading:   { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  storyBody:      { fontSize: 13, lineHeight: 19 },

  // Tab bar
  tabBar:         { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 8, paddingTop: 6 },
  tab:            { flex: 1, alignItems: 'center' },
  tabIcon:        { fontSize: 22, marginBottom: 2 },
  tabLabel:       { fontSize: 10 },
});
`
}

function getTabIcon(nameOrIcon: string, index: number): string {
  const n = nameOrIcon.toLowerCase()
  if (n.includes('home') || n.includes('house')) return '⊞'
  if (n.includes('menu') || n.includes('food') || n.includes('eat') || n.includes('restaurant')) return '◉'
  if (n.includes('reserv') || n.includes('book') || n.includes('order')) return '◈'
  if (n.includes('story') || n.includes('about') || n.includes('info')) return '◎'
  if (n.includes('search') || n.includes('find')) return '⊕'
  if (n.includes('person') || n.includes('account') || n.includes('profile')) return '⊙'
  if (n.includes('setting')) return '⊘'
  const fallbacks = ['⊞', '◉', '◈', '◎']
  return fallbacks[index] || '◎'
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
