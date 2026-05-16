import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

interface ServiceAccount {
  client_email: string
  private_key: string
}

interface IntegrityVerdict {
  tokenPayloadExternal: {
    requestDetails: {
      requestPackageName: string
      timestampMillis: string
      nonce: string
    }
    appIntegrity: {
      appRecognitionVerdict: string
      packageName?: string
    }
    deviceIntegrity: {
      deviceRecognitionVerdict?: string[]
    }
    accountDetails?: {
      appLicensingVerdict?: string
    }
  }
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.token
  }
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claims = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/playintegrity',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), sa.private_key)
  const jwt = `${signingInput}.${b64url(signature)}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!tokenRes.ok) {
    throw new Error(`Google OAuth token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`)
  }
  const tokenJson = (await tokenRes.json()) as { access_token: string; expires_in: number }
  cachedAccessToken = {
    token: tokenJson.access_token,
    expiresAt: Date.now() + tokenJson.expires_in * 1000,
  }
  return tokenJson.access_token
}

async function decodeIntegrityToken(
  integrityToken: string,
  packageName: string,
  accessToken: string,
): Promise<IntegrityVerdict> {
  const url = `https://playintegrity.googleapis.com/v1/${packageName}:decodeIntegrityToken`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ integrityToken }),
  })
  if (!res.ok) {
    throw new Error(`Play Integrity decode failed: ${res.status} ${await res.text()}`)
  }
  return res.json() as Promise<IntegrityVerdict>
}

function unauthorized(reason: string): NextResponse {
  return new NextResponse(JSON.stringify({ error: 'Unauthorized', reason }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * Gate `/api/*` routes behind Play Integrity attestation. Same-origin browser
 * sessions on the deployed site continue to pass through.
 *
 * Returns `null` if the request is authorized — the caller should proceed.
 * Returns a 401 `NextResponse` if the request should be rejected — the caller
 * should return it as-is.
 *
 * Required env vars (set on Vercel):
 *   - GOOGLE_PLAY_INTEGRITY_SA_JSON: service-account JSON with role
 *     `roles/playintegrity.user` on the linked Google Cloud project.
 *   - ANDROID_PACKAGE_NAME: e.g. `com.atmos.app`. Must match the APK.
 *   - PLAY_INTEGRITY_STRICTNESS (optional): `strict` rejects sideloaded /
 *     unrecognized installs; default `lenient` allows them (for internal
 *     testing). Flip to `strict` once published to Play Store.
 */
export async function requirePlayIntegrity(req: NextRequest): Promise<NextResponse | null> {
  // Allow the deployed website's own browser sessions through.
  const fetchSite = req.headers.get('sec-fetch-site') ?? ''
  if (fetchSite === 'same-origin' || fetchSite === 'none' || fetchSite === '') {
    return null
  }

  const integrityToken = req.headers.get('x-play-integrity-token')
  if (!integrityToken) return unauthorized('missing integrity token')

  const saJson = process.env.GOOGLE_PLAY_INTEGRITY_SA_JSON
  const packageName = process.env.ANDROID_PACKAGE_NAME
  if (!saJson || !packageName) {
    console.error('[playIntegrity] missing GOOGLE_PLAY_INTEGRITY_SA_JSON or ANDROID_PACKAGE_NAME')
    return unauthorized('server not configured')
  }

  let sa: ServiceAccount
  try {
    sa = JSON.parse(saJson) as ServiceAccount
    if (!sa.client_email || !sa.private_key) throw new Error('missing fields')
  } catch {
    console.error('[playIntegrity] malformed service-account JSON')
    return unauthorized('server misconfigured')
  }

  try {
    const accessToken = await getAccessToken(sa)
    const verdict = await decodeIntegrityToken(integrityToken, packageName, accessToken)
    const payload = verdict.tokenPayloadExternal

    const ageMs = Date.now() - parseInt(payload.requestDetails.timestampMillis, 10)
    if (ageMs > 5 * 60 * 1000 || ageMs < -60_000) {
      return unauthorized('token expired or clock-skewed')
    }
    if (payload.requestDetails.requestPackageName !== packageName) {
      return unauthorized('package mismatch')
    }

    const appVerdict = payload.appIntegrity.appRecognitionVerdict
    const deviceVerdicts = payload.deviceIntegrity.deviceRecognitionVerdict ?? []
    const strict = (process.env.PLAY_INTEGRITY_STRICTNESS ?? 'lenient') === 'strict'

    if (strict) {
      if (appVerdict !== 'PLAY_RECOGNIZED') return unauthorized(`app verdict: ${appVerdict}`)
      if (!deviceVerdicts.includes('MEETS_DEVICE_INTEGRITY')) {
        return unauthorized('device integrity failed')
      }
    } else {
      if (appVerdict === 'UNEVALUATED') return unauthorized('app verdict unevaluated')
    }

    return null
  } catch (e) {
    console.error('[playIntegrity] verification error', e)
    return unauthorized('verification error')
  }
}
