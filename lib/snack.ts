import { AppSpec } from './analyzer'
import { SiteData } from './scraper'

export interface SnackResult {
  snackUrl: string
  snackId: string
}

function isLight(hex: string): boolean {
  if (!hex?.startsWith('#')) return false
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

function esc(s: string): string {
  return (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ').replace(/`/g, '\\`').trim()
}

function generateSnackApp(spec: AppSpec, siteData: SiteData): string {
  const heroImg = siteData.heroImages[0] || siteData.ogImage || ''
  const img2 = siteData.heroImages[1] || ''
  const img3 = siteData.heroImages[2] || ''

  const dark = !isLight(spec.backgroundColor || '#0a0a0a')
  const textColor = dark ? '#ffffff' : '#111111'
  const mutedColor = dark ? '#aaaaaa' : '#666666'
  const cardBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const borderColor = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)'
  const primaryColor = spec.primaryColor || '#000000'
  const bgColor = spec.backgroundColor || '#0a0a0a'
  const ctaTextColor = isLight(primaryColor) ? '#000000' : '#ffffff'

  // Reservation: is it an external platform we should WebView-embed?
  const reserveUrl = siteData.reservationUrl || siteData.url
  const hasExternalReservation = siteData.reservationUrl &&
    (siteData.reservationUrl.includes('opentable') ||
     siteData.reservationUrl.includes('resy.com') ||
     siteData.reservationUrl.includes('sevenrooms') ||
     siteData.reservationUrl.includes('tock.com') ||
     siteData.reservationUrl.includes('exploretock'))

  // Menu items
  const menuItems = siteData.menuItems.slice(0, 16)
  const menuItemsJson = JSON.stringify(menuItems.map(i => ({
    name: esc(i.name),
    description: i.description ? esc(i.description) : '',
    price: i.price ? esc(i.price) : '',
    category: i.category ? esc(i.category) : '',
  })))

  // Locations
  const locationsJson = JSON.stringify(siteData.locations.slice(0, 6).map(l => ({
    name: l.name ? esc(l.name) : '',
    address: esc(l.address),
    phone: l.phone ? esc(l.phone) : '',
    hours: l.hours ? esc(l.hours) : '',
    mapQuery: l.mapQuery,
  })))

  // About content
  const aboutParagraphs = siteData.aboutContent.slice(0, 4).map(p => esc(p))

  // Nav links for home screen (no reservation link — that's in Reserve tab)
  const homeNavLinks = siteData.navLinks
    .filter(l => !/reserv|book|order/i.test(l.label))
    .slice(0, 5)
    .map(l => ({ label: esc(l.label), href: esc(l.href) }))

  // Tabs
  const tabDefs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'menu', label: 'Menu', icon: '☰' },
    { id: 'reserve', label: siteData.reservationUrl ? 'Reserve' : 'Visit', icon: '📅' },
    { id: 'story', label: 'Our Story', icon: '✦' },
  ]

  return `import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Linking, Image, ImageBackground,
  Dimensions, FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width: W, height: H } = Dimensions.get('window');
const DARK = ${dark};

const C = {
  primary:  '${esc(primaryColor)}',
  bg:       '${esc(bgColor)}',
  text:     '${textColor}',
  muted:    '${mutedColor}',
  card:     '${cardBg}',
  border:   '${borderColor}',
};

const HERO_IMG = '${esc(heroImg)}';
const IMG_2    = '${esc(img2)}';
const IMG_3    = '${esc(img3)}';
const SITE_URL = '${esc(siteData.url)}';

const MENU_ITEMS = ${menuItemsJson};
const LOCATIONS  = ${locationsJson};
const HOME_LINKS = ${JSON.stringify(homeNavLinks)};
const ABOUT_PARAS = ${JSON.stringify(aboutParagraphs)};
const RESERVE_URL = '${esc(reserveUrl)}';
const HAS_WEBVIEW_RESERVE = ${hasExternalReservation ? 'true' : 'false'};

// ── HOME ───────────────────────────────────────────────────────────────────
function HomeScreen() {
  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      {HERO_IMG ? (
        <ImageBackground source={{ uri: HERO_IMG }} style={s.hero} resizeMode="cover">
          {/* bottom gradient layers */}
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}>
            <View style={{ height: '60%', backgroundColor: DARK ? 'rgba(0,0,0,0.0)' : 'rgba(255,255,255,0.0)' }} />
            <View style={{ height: '30%', backgroundColor: DARK ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)' }} />
            <View style={{ height: '25%', backgroundColor: DARK ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.82)' }} />
          </View>
          {/* top scrim for status bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.18)' }} />
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>${esc(spec.appName)}</Text>
            <Text style={s.heroSub}>${esc(spec.tagline)}</Text>
          </View>
        </ImageBackground>
      ) : (
        <View style={[s.hero, { backgroundColor: C.primary }]}>
          <View style={s.heroContent}>
            <Text style={[s.heroTitle, { color: '${ctaTextColor}' }]}>${esc(spec.appName)}</Text>
            <Text style={[s.heroSub, { color: DARK ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }]}>${esc(spec.tagline)}</Text>
          </View>
        </View>
      )}

      {/* Photo pair */}
      {(IMG_2 || IMG_3) && (
        <View style={{ flexDirection: 'row', height: 160 }}>
          {IMG_2 ? <Image source={{ uri: IMG_2 }} style={{ flex: 1 }} resizeMode="cover" /> : null}
          {IMG_3 ? <Image source={{ uri: IMG_3 }} style={{ flex: 1, marginLeft: 2 }} resizeMode="cover" /> : null}
        </View>
      )}

      {/* Explore section */}
      {HOME_LINKS.length > 0 && (
        <View style={{ paddingTop: 24 }}>
          <Text style={s.sectionLabel}>EXPLORE</Text>
          {HOME_LINKS.map((link, i) => (
            <TouchableOpacity
              key={i}
              style={s.linkRow}
              onPress={() => Linking.openURL(link.href)}
            >
              <Text style={[s.linkLabel, { color: C.text }]}>{link.label}</Text>
              <Text style={[s.linkArrow, { color: C.muted }]}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ── MENU ───────────────────────────────────────────────────────────────────
function MenuScreen() {
  const categories = [...new Set(MENU_ITEMS.map(i => i.category).filter(Boolean))];
  const hasCategories = categories.length > 1;

  return (
    <ScrollView style={s.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ padding: 20, paddingTop: 24, paddingBottom: 8 }}>
        <Text style={[s.pageTitle, { color: C.text }]}>Menu</Text>
      </View>

      {MENU_ITEMS.length === 0 ? (
        /* No menu scraped — show nav links instead */
        <View style={{ padding: 20 }}>
          <Text style={[s.bodyText, { color: C.muted, marginBottom: 20 }]}>
            View our full menu at ${esc(new URL(siteData.url).hostname)}
          </Text>
          ${siteData.menuItems.length === 0 && siteData.navLinks.filter(l => /menu|food/i.test(l.label)).length > 0
            ? siteData.navLinks.filter(l => /menu|food/i.test(l.label)).slice(0, 3).map(l =>
              `<TouchableOpacity style={[s.ctaButton, { backgroundColor: C.primary }]} onPress={() => Linking.openURL('${esc(l.href)}')}>
            <Text style={[s.ctaText, { color: '${ctaTextColor}' }]}>${esc(l.label)}</Text>
          </TouchableOpacity>`).join('\n          ')
            : `<TouchableOpacity style={[s.ctaButton, { backgroundColor: C.primary }]} onPress={() => Linking.openURL(SITE_URL + '/menu')}>
            <Text style={[s.ctaText, { color: '${ctaTextColor}' }]}>View Full Menu</Text>
          </TouchableOpacity>`
          }
        </View>
      ) : (
        MENU_ITEMS.map((item, i) => (
          <View key={i}>
            {/* Category divider */}
            {hasCategories && (i === 0 || MENU_ITEMS[i - 1].category !== item.category) && item.category ? (
              <Text style={[s.sectionLabel, { paddingTop: 20 }]}>{item.category.toUpperCase()}</Text>
            ) : null}
            <View style={[s.menuItem, { borderBottomColor: C.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.menuItemName, { color: C.text }]}>{item.name}</Text>
                {item.description ? (
                  <Text style={[s.menuItemDesc, { color: C.muted }]}>{item.description}</Text>
                ) : null}
              </View>
              {item.price ? (
                <Text style={[s.menuItemPrice, { color: C.primary || C.text }]}>{item.price}</Text>
              ) : null}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ── RESERVE ────────────────────────────────────────────────────────────────
function ReserveScreen() {
  const [showWeb, setShowWeb] = useState(false);

  if (showWeb && HAS_WEBVIEW_RESERVE) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={[s.webHeader, { backgroundColor: C.bg, borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => setShowWeb(false)}>
            <Text style={{ color: C.primary, fontSize: 15, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={[s.webHeaderTitle, { color: C.text }]}>Reservations</Text>
          <View style={{ width: 60 }} />
        </View>
        <WebView
          source={{ uri: RESERVE_URL }}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>
    );
  }

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 60 }}>
      {IMG_2 ? (
        <Image source={{ uri: IMG_2 }} style={s.reserveImg} resizeMode="cover" />
      ) : HERO_IMG ? (
        <Image source={{ uri: HERO_IMG }} style={s.reserveImg} resizeMode="cover" />
      ) : null}

      <View style={{ padding: 24 }}>
        <Text style={[s.pageTitle, { color: C.text }]}>
          ${esc(siteData.navLinks.find(l => /reserv|book/i.test(l.label))?.label || 'Reserve a Table')}
        </Text>
        ${siteData.description ? `<Text style={[s.bodyText, { color: C.muted, marginBottom: 28 }]}>${esc(siteData.description.slice(0, 120))}</Text>` : ''}

        <TouchableOpacity
          style={[s.ctaButton, { backgroundColor: C.primary, marginBottom: 12 }]}
          onPress={() => HAS_WEBVIEW_RESERVE ? setShowWeb(true) : Linking.openURL(RESERVE_URL)}
        >
          <Text style={[s.ctaText, { color: '${ctaTextColor}' }]}>
            {HAS_WEBVIEW_RESERVE ? 'Make a Reservation' : 'Book Now'}
          </Text>
        </TouchableOpacity>

        {LOCATIONS.length > 0 && (
          <View style={{ marginTop: 32 }}>
            <Text style={s.sectionLabel}>LOCATIONS</Text>
            {LOCATIONS.map((loc, i) => (
              <TouchableOpacity
                key={i}
                style={[s.locationCard, { backgroundColor: C.card, borderColor: C.border }]}
                onPress={() => Linking.openURL('maps://?q=' + loc.mapQuery)}
              >
                {loc.name ? <Text style={[s.locationName, { color: C.text }]}>{loc.name}</Text> : null}
                <Text style={[s.locationAddr, { color: C.muted }]}>{loc.address}</Text>
                {loc.phone ? <Text style={[s.locationPhone, { color: C.primary }]}>{loc.phone}</Text> : null}
                {loc.hours ? <Text style={[s.locationHours, { color: C.muted }]}>{loc.hours}</Text> : null}
                <Text style={[s.locationDirections, { color: C.primary }]}>Get Directions →</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── STORY ──────────────────────────────────────────────────────────────────
function StoryScreen() {
  const paras = ABOUT_PARAS.length > 0 ? ABOUT_PARAS : [
    '${esc(siteData.description || spec.tagline)}',
  ];

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 60 }}>
      {IMG_3 ? (
        <Image source={{ uri: IMG_3 }} style={{ width: W, height: 240 }} resizeMode="cover" />
      ) : IMG_2 ? (
        <Image source={{ uri: IMG_2 }} style={{ width: W, height: 240 }} resizeMode="cover" />
      ) : null}

      <View style={{ padding: 24 }}>
        <Text style={[s.pageTitle, { color: C.text }]}>Our Story</Text>
        {paras.map((p, i) => (
          <Text key={i} style={[s.bodyText, { color: i === 0 ? C.text : C.muted, marginBottom: 16 }]}>
            {p}
          </Text>
        ))}

        {/* Sections from main page */}
        ${siteData.sections.slice(0, 3).map(sec => `
        <View style={{ marginTop: 16 }}>
          <Text style={[s.sectionTitle, { color: C.text }]}>${esc(sec.heading)}</Text>
          ${sec.content ? `<Text style={[s.bodyText, { color: C.muted }]}>${esc(sec.content.slice(0, 200))}</Text>` : ''}
        </View>`).join('')}
      </View>
    </ScrollView>
  );
}

// ── SHELL ──────────────────────────────────────────────────────────────────
const TABS = ${JSON.stringify(tabDefs)};

export default function App() {
  const [active, setActive] = useState('home');

  const renderScreen = () => {
    switch (active) {
      case 'home':    return <HomeScreen />;
      case 'menu':    return <MenuScreen />;
      case 'reserve': return <ReserveScreen />;
      case 'story':   return <StoryScreen />;
      default:        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={DARK ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
      {renderScreen()}
      <View style={[s.tabBar, { backgroundColor: C.bg, borderTopColor: C.border }]}>
        {TABS.map(tab => {
          const isActive = active === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={s.tab}
              onPress={() => setActive(tab.id)}
            >
              <View style={{ opacity: isActive ? 1 : 0.4 }}>
                <Text style={s.tabIcon}>{tab.icon}</Text>
                <Text style={[s.tabLabel, { color: isActive ? C.primary : C.text, fontWeight: isActive ? '600' : '400' }]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  screen:     { flex: 1 },

  // Hero
  hero:             { width: W, height: H * 0.60, justifyContent: 'flex-end' },
  heroContent:      { padding: 24, paddingBottom: 28 },
  heroTitle:        { fontSize: 42, fontWeight: '900', color: '#ffffff', letterSpacing: -1.5, marginBottom: 8 },
  heroSub:          { fontSize: 16, fontWeight: '300', color: 'rgba(255,255,255,0.78)', letterSpacing: 0.3, lineHeight: 23 },

  // Typography
  pageTitle:    { fontSize: 32, fontWeight: '900', letterSpacing: -0.8, marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 3, color: '${mutedColor}', paddingHorizontal: 20, marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, marginBottom: 6 },
  bodyText:     { fontSize: 15, fontWeight: '300', letterSpacing: 0.1, lineHeight: 24 },

  // Nav links (home)
  linkRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 17, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '${borderColor}' },
  linkLabel:  { fontSize: 16, fontWeight: '500' },
  linkArrow:  { fontSize: 16 },

  // Menu
  menuItem:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  menuItemName:   { fontSize: 16, fontWeight: '500', marginBottom: 3, flex: 1 },
  menuItemDesc:   { fontSize: 13, fontWeight: '300', lineHeight: 18, flex: 1, paddingRight: 8 },
  menuItemPrice:  { fontSize: 15, fontWeight: '600', minWidth: 50, textAlign: 'right' },

  // Reserve
  reserveImg:   { width: W, height: 240 },
  ctaButton:    { width: '100%', paddingVertical: 16, borderRadius: 10, alignItems: 'center' },
  ctaText:      { fontSize: 16, fontWeight: '700' },

  // Location cards
  locationCard:       { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 10 },
  locationName:       { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  locationAddr:       { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  locationPhone:      { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  locationHours:      { fontSize: 12, marginBottom: 6 },
  locationDirections: { fontSize: 13, fontWeight: '600' },

  // WebView header
  webHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  webHeaderTitle:   { fontSize: 15, fontWeight: '600' },

  // Tab bar
  tabBar:   { flexDirection: 'row', borderTopWidth: 0.5, paddingBottom: 6, paddingTop: 8 },
  tab:      { flex: 1, alignItems: 'center' },
  tabIcon:  { fontSize: 20, textAlign: 'center', marginBottom: 2 },
  tabLabel: { fontSize: 10, textAlign: 'center', letterSpacing: 0.3 },
});
`
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
      'react-native-webview': '13.10.5',
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
