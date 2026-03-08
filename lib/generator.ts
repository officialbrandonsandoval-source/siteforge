import JSZip from 'jszip'
import { AppSpec, Screen } from './analyzer'
import { SiteData } from './scraper'

export async function generateApp(spec: AppSpec, siteData: SiteData): Promise<Buffer> {
  const zip = new JSZip()

  // package.json
  zip.file('package.json', JSON.stringify({
    name: spec.appName.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    main: 'expo-router/entry',
    scripts: {
      start: 'expo start',
      android: 'expo run:android',
      ios: 'expo run:ios',
    },
    dependencies: {
      expo: '~52.0.0',
      'expo-router': '~4.0.0',
      'expo-status-bar': '~2.0.0',
      'expo-web-browser': '~14.0.0',
      react: '18.3.1',
      'react-native': '0.76.5',
      'react-native-safe-area-context': '4.12.0',
      'react-native-screens': '~4.1.0',
      '@expo/vector-icons': '^14.0.0',
    },
    devDependencies: {
      '@babel/core': '^7.25.0',
      '@types/react': '~18.3.12',
      typescript: '^5.3.3',
    },
  }, null, 2))

  // app.json
  zip.file('app.json', JSON.stringify({
    expo: {
      name: spec.appName,
      slug: spec.appName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'automatic',
      splash: {
        image: './assets/splash.png',
        resizeMode: 'contain',
        backgroundColor: spec.backgroundColor,
      },
      ios: { supportsTablet: true },
      android: { adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: spec.primaryColor } },
      scheme: spec.appName.toLowerCase().replace(/\s+/g, '-'),
      plugins: ['expo-router'],
    },
  }, null, 2))

  // babel.config.js
  zip.file('babel.config.js', `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};`)

  // tsconfig.json
  zip.file('tsconfig.json', JSON.stringify({
    extends: 'expo/tsconfig.base',
    compilerOptions: { strict: true },
    include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.d.ts', 'expo-env.d.ts'],
  }, null, 2))

  // Theme
  zip.file('constants/theme.ts', generateTheme(spec))

  // Root layout
  zip.file('app/_layout.tsx', generateRootLayout(spec))

  // Tab layout
  zip.file('app/(tabs)/_layout.tsx', generateTabLayout(spec))

  // Generate each screen
  for (const screen of spec.screens) {
    const filename = screen.name.toLowerCase().replace(/\s+/g, '-')
    const isHome = screen.name.toLowerCase() === 'home' || spec.screens.indexOf(screen) === 0
    const routeName = isHome ? 'index' : filename
    zip.file(`app/(tabs)/${routeName}.tsx`, generateScreen(screen, spec, siteData))
  }

  // README
  zip.file('README.md', generateReadme(spec, siteData.url))

  return zip.generateAsync({ type: 'nodebuffer' }) as Promise<Buffer>
}

function generateTheme(spec: AppSpec): string {
  return `export const theme = {
  colors: {
    primary: '${spec.primaryColor}',
    background: '${spec.backgroundColor}',
    text: '${spec.textColor}',
    accent: '${spec.accentColor}',
    card: '${adjustColor(spec.backgroundColor, 15)}',
    border: '${adjustColor(spec.backgroundColor, 25)}',
    muted: '${adjustColor(spec.textColor, -40)}',
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
  },
  radius: {
    sm: 6, md: 12, lg: 20,
  },
  font: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
}
`
}

function adjustColor(hex: string, amount: number): string {
  // Simple color adjustment — lighten or darken
  if (!hex.startsWith('#')) return hex
  const num = parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function generateRootLayout(spec: AppSpec): string {
  return `import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  )
}
`
}

function generateTabLayout(spec: AppSpec): string {
  const tabImports = spec.bottomTabs.map(() => '').join('')
  const tabs = spec.bottomTabs.map((tab, i) => {
    const isHome = i === 0
    const href = isHome ? '/' : `/(tabs)/${tab.screen.toLowerCase().replace(/\s+/g, '-')}`
    return `        <Tabs.Screen
          name="${isHome ? 'index' : tab.screen.toLowerCase().replace(/\s+/g, '-')}"
          options={{
            title: '${tab.name}',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="${tab.icon}" size={size} color={color} />
            ),
          }}
        />`
  }).join('\n')

  return `import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../../constants/theme'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: '${spec.bottomTabs.length > 0 ? '600' : '500'}' },
      }}
    >
${tabs}
    </Tabs>
  )
}
`
}

function generateScreen(screen: Screen, spec: AppSpec, siteData: SiteData): string {
  if (screen.type === 'webview') {
    return generateWebviewScreen(screen, spec, siteData)
  }
  return generateNativeScreen(screen, spec, siteData)
}

function generateNativeScreen(screen: Screen, spec: AppSpec, siteData: SiteData): string {
  const isHome = screen.type === 'home'

  return `import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { theme } from '../../constants/theme'

export default function ${screen.name.replace(/\s+/g, '')}Screen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      ${isHome ? `
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>${siteData.title}</Text>
        <Text style={styles.heroSubtitle}>${siteData.description || spec.tagline}</Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => Linking.openURL('${siteData.url}')}
        >
          <Text style={styles.ctaText}>Visit Website</Text>
        </TouchableOpacity>
      </View>

      {/* Sections */}
      ${siteData.sections.slice(0, 4).map(s => `
      <View style={styles.card}>
        <Text style={styles.cardTitle}>${s.heading.replace(/'/g, "\\'")}</Text>
        ${s.content ? `<Text style={styles.cardText}>${s.content.slice(0, 120).replace(/'/g, "\\'")}...</Text>` : ''}
      </View>`).join('')}
      ` : `
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>${screen.title}</Text>
        <Text style={styles.sectionText}>${screen.content.slice(0, 200)}</Text>
      </View>

      {/* Nav Links */}
      ${siteData.navLinks.slice(0, 5).map(link => `
      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => Linking.openURL('${link.href}')}
      >
        <Text style={styles.linkText}>${link.label.replace(/'/g, "\\'")}</Text>
        <Text style={styles.linkChevron}>›</Text>
      </TouchableOpacity>`).join('')}
      `}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  hero: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  ctaButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  ctaText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardText: {
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sectionText: {
    fontSize: 15,
    color: theme.colors.muted,
    lineHeight: 22,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  linkText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  linkChevron: {
    fontSize: 20,
    color: theme.colors.muted,
  },
})
`
}

function generateWebviewScreen(screen: Screen, spec: AppSpec, siteData: SiteData): string {
  return `import { WebView } from 'react-native-webview'
import { View, StyleSheet } from 'react-native'
import { theme } from '../../constants/theme'

export default function ${screen.name.replace(/\s+/g, '')}Screen() {
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: '${screen.sourceUrl || siteData.url}' }}
        style={styles.webview}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  webview: { flex: 1 },
})
`
}

function generateReadme(spec: AppSpec, sourceUrl: string): string {
  return `# ${spec.appName}

> ${spec.tagline}

Generated by SiteForge from ${sourceUrl}

## Quick Start

\`\`\`bash
npm install
npx expo start
\`\`\`

Scan the QR code with Expo Go (iOS/Android) to run immediately.

## Build for Production

\`\`\`bash
# iOS
npx eas build --platform ios

# Android
npx eas build --platform android
\`\`\`

## Screens

${spec.screens.map(s => `- **${s.name}** — ${s.content.slice(0, 80)}`).join('\n')}

---
*Built with SiteForge*
`
}
