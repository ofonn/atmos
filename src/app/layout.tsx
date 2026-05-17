import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { WeatherProvider } from '@/contexts/WeatherContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { WeatherMoodProvider } from '@/components/WeatherMoodProvider'
import { PageTransition } from '@/components/layout/PageTransition'
import { CloudSync } from '@/components/sync/CloudSync'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { SWRegister } from '@/components/pwa/SWRegister'
import { StreakTracker } from '@/components/streak/StreakTracker'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { WhatsNew } from '@/components/notifications/WhatsNew'
import { JsonLd } from '@/components/seo/JsonLd'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-inter',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://atmos.example.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Atmos — AI Weather Assistant',
    template: '%s — Atmos',
  },
  description:
    'Your intelligent weather companion. Hourly forecasts, AI advice, trip planning — beautifully simple.',
  applicationName: 'Atmos',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Atmos',
    title: 'Atmos — AI Weather Assistant',
    description:
      'Hourly forecasts, AI advice, trip planning. The weather app that thinks with you.',
    images: ['/icon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atmos — AI Weather Assistant',
    description: 'Hourly forecasts, AI advice, trip planning.',
    images: ['/icon.png'],
  },
  formatDetection: { telephone: false },
}

export const viewport = {
  themeColor: '#10131c',
  colorScheme: 'dark light' as const,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${inter.variable}`}>
      <head>
        <JsonLd />
      </head>
      <body className={`${jakarta.className} min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SettingsProvider>
              <WeatherProvider>
                <WeatherMoodProvider />
                <CloudSync />
                <StreakTracker />
                <SWRegister />
                <div className="w-full min-h-[100dvh] lg:max-w-[1200px] lg:mx-auto lg:shadow-[0_0_100px_rgba(0,0,0,0.1)] lg:dark:shadow-[0_0_100px_rgba(0,0,0,0.8)] relative bg-background flex flex-col safe-p [overflow-x:clip]">
                  <OfflineBanner />
                  <PageTransition>{children}</PageTransition>
                  <InstallPrompt />
                  <OnboardingFlow />
                  <WhatsNew />
                </div>
              </WeatherProvider>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
