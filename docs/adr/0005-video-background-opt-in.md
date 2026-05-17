# 5. Weather video background defaults OFF, opt-in via onboarding

Date: 2026-05-17
Status: Accepted

## Context

User asked for animated weather-condition video backgrounds on the home
page (rain on leaves when it's raining, etc.). These look great but
have real costs:
- Data: 1–3 MB per HD clip per load
- Battery: video decode is non-trivial, especially on older devices
- Storage: bundling clips into the APK would balloon install size

## Decision

- Default = **OFF** for both web and mobile
- Onboarding sheet (shown once on first launch) asks explicitly:
  *"Animated weather background? Yes / No, default"*
- Setting is changeable any time in Settings → Background
- Quality: `auto | low | hd`. `auto` downgrades to low on
  `navigator.connection.saveData` or 2g/3g effective type
- Clips are NOT bundled — they're fetched from the deployed
  Next.js `/videos/<condition>.mp4`. Missing files are silently
  ignored (HEAD probe on web, skipped frame on mobile)
- Component pauses playback on `visibilitychange` (web) and
  `AppLifecycleState.paused` (mobile) to save battery

## Consequences

- **Easier:** users on metered / older devices aren't penalized
- **Easier:** changing or adding clips is just dropping MP4s into
  `public/videos/` — no rebuild
- **Risk:** discoverability — users who never saw the onboarding
  modal won't know the feature exists. We mitigate with a
  Settings → Background row and (later) an "what's new" hint
- **Carry cost:** we need `video_player` on mobile (~600KB) and
  no extra deps on web (HTML5 `<video>`)
