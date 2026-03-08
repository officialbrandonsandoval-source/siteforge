import { AppSpec } from './analyzer'
import { SiteData } from './scraper'

export interface SnackResult {
  snackUrl: string
  snackId: string
}

// Generate a single-file Snack preview (Expo Snack doesn't support expo-router)
function generateSnackApp(spec: AppSpec, siteData: SiteData): string {
  const sections = siteData.sections.slice(0, 4)
  const navLinks = siteData.navLinks.slice(0, 5)

  return `import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Linking, Image,
} from 'react-native';

const theme = {
  primary: '${spec.primaryColor}',
  background: '${spec.backgroundColor}',
  text: '${spec.textColor}',
  accent: '${spec.accentColor}',
  card: '${lightenColor(spec.backgroundColor)}',
  muted: '${mutedColor(spec.textColor)}',
};

const screens = [
  { id: 'home', label: 'Home', icon: '⊞' },
  ${spec.bottomTabs.slice(1).map(t => `{ id: '${t.name.toLowerCase()}', label: '${t.name}', icon: '◎' }`).join(',\n  ')}
];

function HomeScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.appName}>${spec.appName}</Text>
        <Text style={styles.tagline}>${spec.tagline}</Text>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => Linking.openURL('${siteData.url}')}
        >
          <Text style={styles.ctaText}>Visit Website</Text>
        </TouchableOpacity>
      </View>

      {/* Sections */}
      ${sections.map(s => `
      <View style={styles.card}>
        <Text style={styles.cardTitle}>${s.heading.replace(/'/g, "\\'").replace(/\n/g, ' ')}</Text>
        ${s.content ? `<Text style={styles.cardText}>${s.content.slice(0, 100).replace(/'/g, "\\'").replace(/\n/g, ' ')}...</Text>` : ''}
      </View>`).join('')}
    </ScrollView>
  );
}

function LinksScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.sectionTitle}>Navigation</Text>
      ${navLinks.map(l => `
      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => Linking.openURL('${l.href.replace(/'/g, "\\'")}')}
      >
        <Text style={styles.linkText}>${l.label.replace(/'/g, "\\'")}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>`).join('')}
    </ScrollView>
  );
}

function AboutScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>${spec.appName}</Text>
        <Text style={styles.cardText}>${(siteData.description || spec.tagline).replace(/'/g, "\\'")}</Text>
      </View>
      <TouchableOpacity
        style={[styles.cta, { marginTop: 20 }]}
        onPress={() => Linking.openURL('${siteData.url}')}
      >
        <Text style={styles.ctaText}>Open ${siteData.url.replace('https://', '').replace('http://', '').split('/')[0]}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderScreen = () => {
    if (activeTab === 'home') return <HomeScreen />;
    if (activeTab === '${spec.bottomTabs[1]?.name.toLowerCase() || 'links'}') return <LinksScreen />;
    return <AboutScreen />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="${isLight(spec.backgroundColor) ? 'dark-content' : 'light-content'}" backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>${spec.appName}</Text>
      </View>

      {/* Screen */}
      <View style={{ flex: 1 }}>
        {renderScreen()}
      </View>

      {/* Bottom tabs */}
      <View style={styles.tabBar}>
        {screens.map(screen => (
          <TouchableOpacity
            key={screen.id}
            style={styles.tab}
            onPress={() => setActiveTab(screen.id)}
          >
            <Text style={[styles.tabIcon, activeTab === screen.id && { color: theme.primary }]}>
              {screen.icon}
            </Text>
            <Text style={[styles.tabLabel, activeTab === screen.id && { color: theme.primary }]}>
              {screen.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.card,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: -0.3,
  },
  screen: { flex: 1, backgroundColor: theme.background },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 15,
    color: theme.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  cta: {
    backgroundColor: theme.primary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
  },
  ctaText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    color: theme.muted,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  linkText: { fontSize: 15, color: theme.text, fontWeight: '500' },
  chevron: { fontSize: 20, color: theme.muted },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.background,
    borderTopWidth: 1,
    borderTopColor: theme.card,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIcon: { fontSize: 20, color: theme.muted, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: theme.muted, fontWeight: '500' },
});
`
}

function lightenColor(hex: string): string {
  if (!hex.startsWith('#')) return '#1a1a1a'
  const num = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((num >> 16) & 0xff) + 25)
  const g = Math.min(255, ((num >> 8) & 0xff) + 25)
  const b = Math.min(255, (num & 0xff) + 25)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function mutedColor(hex: string): string {
  if (!hex.startsWith('#')) return '#888888'
  const num = parseInt(hex.slice(1), 16)
  const r = Math.round(((num >> 16) & 0xff) * 0.5)
  const g = Math.round(((num >> 8) & 0xff) * 0.5)
  const b = Math.round((num & 0xff) * 0.5)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function isLight(hex: string): boolean {
  if (!hex.startsWith('#')) return false
  const num = parseInt(hex.slice(1), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

export async function publishToSnack(spec: AppSpec, siteData: SiteData): Promise<SnackResult> {
  const appCode = generateSnackApp(spec, siteData)

  const payload = {
    manifest: {
      sdkVersion: '52.0.0',
      name: spec.appName,
      slug: spec.appName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      description: spec.tagline,
    },
    code: {
      'App.tsx': {
        type: 'CODE',
        contents: appCode,
      },
    },
  }

  const snackPayload = {
    ...payload,
    dependencies: {
      'react': '18.3.1',
      'react-native': '0.76.5',
      'expo': '~52.0.0',
    },
  }

  const res = await fetch('https://exp.host/--/api/v2/snack/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(snackPayload),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    throw new Error(`Snack API failed: ${res.status}`)
  }

  const data = await res.json() as { id: string; hashId?: string }
  const snackId = data.hashId || data.id
  const snackUrl = `https://snack.expo.dev/${snackId}`

  return { snackUrl, snackId }
}
