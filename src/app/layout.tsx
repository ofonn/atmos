import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { WeatherProvider } from '@/contexts/WeatherContext'
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SettingsProvider>
            <WeatherProvider>
              <div className="min-h-screen max-w-md mx-auto relative flex flex-col">
                {children}
              </div>
            </WeatherProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
