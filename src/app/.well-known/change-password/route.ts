import { NextResponse } from 'next/server'

/**
 * Standard endpoint per W3C `.well-known/change-password`. Password
 * managers (1Password, Apple Keychain, etc.) probe this to find the
 * site's reset flow.
 */
export function GET() {
  return NextResponse.redirect(
    new URL('/reset', process.env.NEXT_PUBLIC_SITE_URL || 'https://atmos.example.com'),
    302,
  )
}
