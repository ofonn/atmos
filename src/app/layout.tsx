import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { WeatherProvider } from '@/contexts/WeatherContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { WeatherMoodProvider } from '@/components/WeatherMoodProvider'
import { PageTransition } from '@/components/layout/PageTransition'
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

export const metadata: Metadata = {
  title: 'Atmos — AI Weather Assistant',
  description: 'Your intelligent weather companion.',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${inter.variable}`}>
      <body className={`${jakarta.className} min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SettingsProvider>
            <WeatherProvider>
              <WeatherMoodProvider />
              <div className="w-full min-h-[100dvh] lg:max-w-[1200px] lg:mx-auto lg:shadow-[0_0_100px_rgba(0,0,0,0.1)] lg:dark:shadow-[0_0_100px_rgba(0,0,0,0.8)] relative bg-background flex flex-col safe-p overflow-x-hidden">
                <OfflineBanner />
                <PageTransition>{children}</PageTransition>
              </div>
            </WeatherProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
