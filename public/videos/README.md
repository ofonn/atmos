# Weather video backgrounds

Drop short MP4 loops here to power the **opt-in weather video
background** feature (enabled via onboarding or
Settings → Background → Weather video).

The home page renders `<WeatherVideoBackground />` which maps the
current WMO weather code + is-day flag to a file in this directory.
Missing files are silently ignored (a HEAD probe disables them so
there's no broken-video flash).

## File names → conditions

| Condition | WMO codes | Day clip | Night clip |
|---|---|---|---|
| Clear | 0 | `clear-day.mp4` | `clear-night.mp4` |
| Partly cloudy | 1–2 | `partly-cloudy-day.mp4` | `partly-cloudy-night.mp4` |
| Overcast | 3 | `cloudy.mp4` | (reuse `cloudy.mp4`) |
| Fog | 45, 48 | `fog.mp4` | (reuse) |
| Drizzle | 51–57 | `drizzle.mp4` | (reuse) |
| Rain | 61–67 | `rain.mp4` | (reuse) |
| Snow | 71–77 | `snow.mp4` | (reuse) |
| Showers | 80–82 | `showers.mp4` | (reuse) |
| Snow showers | 85–86 | `snow-showers.mp4` | (reuse) |
| Thunderstorm | 95–99 | `thunder.mp4` | (reuse) |

### Low-quality variants
Append `-low` (e.g. `rain-low.mp4`) to provide a smaller clip that the
component picks automatically when:
- the user picked Settings → Video quality → "Low", OR
- `navigator.connection.saveData` is true, OR
- effective connection type is 2g / 3g / slow-2g.

If a `-low` variant is missing, the HD file is used regardless.

## Recommended specs

- Format: MP4 (H.264 baseline or main, AAC audio stripped)
- Resolution: 1080×1920 (portrait) is ideal; 1280×720 works
- Length: 5–15 seconds, **must loop cleanly**
- File size target: ~1–3 MB HD, ~400–800 KB low
- No audio track (the component renders muted anyway, but stripping
  saves bytes)

Encode example:
```bash
ffmpeg -i source.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=cover,crop=1080:1920" \
  -c:v libx264 -profile:v main -level 4.0 -crf 28 -preset slow \
  -movflags +faststart -an -t 12 rain.mp4

ffmpeg -i rain.mp4 -vf "scale=720:1280" -c:v libx264 -crf 30 -preset slow \
  -movflags +faststart -an rain-low.mp4
```

## Free stock sources

- https://www.pexels.com/videos/ (CC0)
- https://pixabay.com/videos/ (Pixabay license)
- https://coverr.co/ (CC0)
- https://mixkit.co/ (mixkit license — free with attribution)

Search terms that work well:
- "rain on leaves", "rain window", "raindrops slow motion"
- "fog drift", "morning mist forest"
- "clouds timelapse", "sunset clouds"
- "snow falling", "snow forest"
- "lightning storm night", "thunderstorm clouds"

## Privacy / data

These files are served from the same origin — no third-party requests,
no tracking. The video tag is muted and `playsInline`, so iOS Safari
doesn't full-screen it.

## Performance notes

- The component pauses playback when the tab is hidden
  (`visibilitychange` listener).
- Network-Information API auto-downgrades to `-low` on metered
  connections when quality is `auto`.
- The video is `opacity: 0.55` over the background so text stays
  legible against any clip.
