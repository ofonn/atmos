# Claude Code Prompt — Weather App Technical Details Page

## Context

I'm building a weather app that uses **OpenWeatherMap One Call API 3.0** and the **Air Pollution API**. I need you to build a **Technical Details page** — this is the "data nerd" page where every single piece of data the API returns is displayed. Nothing gets left out.

The page receives data from two API responses that are already fetched and passed in as props/data:

1. **One Call API 3.0** (`/data/3.0/onecall?lat={lat}&lon={lon}&units=metric`)
2. **Air Pollution API** (`/data/2.5/air_pollution?lat={lat}&lon={lon}`)

All temperatures arrive in **Celsius** (metric units). Wind speeds arrive in **m/s**.

---

## Complete API Response Shapes (display ALL of these)

### One Call 3.0 — Top-level metadata
- `lat`, `lon` — coordinates
- `timezone` — IANA timezone string (e.g. "Africa/Lagos")
- `timezone_offset` — UTC offset in seconds

### One Call 3.0 — `current` object
| Field | What it is | Display guidance |
|---|---|---|
| `dt` | Current timestamp (Unix UTC) | Show as local time using `timezone_offset` |
| `sunrise` | Sunrise (Unix UTC) | Format as local time, also compute and show **day length** from sunrise→sunset |
| `sunset` | Sunset (Unix UTC) | Format as local time |
| `temp` | Temperature °C | Show with 1 decimal |
| `feels_like` | Apparent temperature °C | Show alongside temp, highlight the **difference** (e.g. "+3° warmer") |
| `pressure` | Sea-level pressure in hPa | Show with unit, add a small label: "Normal ~1013 hPa" for context |
| `humidity` | Humidity % | Show with a simple bar or gauge |
| `dew_point` | Dew point °C | Show with brief explainer tooltip: "Temperature at which moisture condenses" |
| `clouds` | Cloudiness % | |
| `uvi` | UV index (float) | Show with a color-coded severity scale: 0-2 Low/Green, 3-5 Moderate/Yellow, 6-7 High/Orange, 8-10 Very High/Red, 11+ Extreme/Violet |
| `visibility` | Visibility in metres (max 10000) | Convert to km for display |
| `wind_speed` | Wind speed m/s | Show with compass arrow for direction |
| `wind_gust` | Wind gust m/s (optional) | Show alongside wind_speed |
| `wind_deg` | Wind direction in degrees | Convert to compass label (N, NE, E, etc.) AND show degree value |
| `rain.1h` | Rain last hour mm/h (optional) | Only show section if present |
| `snow.1h` | Snow last hour mm/h (optional) | Only show section if present |
| `weather[0].id` | Condition code | Show raw code in a subtle "API code" badge |
| `weather[0].main` | Condition group | e.g. "Rain", "Clouds" |
| `weather[0].description` | Condition detail | e.g. "light rain" — capitalize first letter |
| `weather[0].icon` | Icon code | Render the actual icon from `https://openweathermap.org/img/wn/{icon}@2x.png` |

### One Call 3.0 — `minutely` array (60 items, next 60 minutes)
| Field | What it is |
|---|---|
| `dt` | Timestamp (Unix UTC) |
| `precipitation` | Precipitation mm/h |

**Display as:** A mini precipitation timeline/bar chart — 60 bars, one per minute. Label the x-axis with time markers every 15 minutes. If all values are 0, show a "No precipitation expected in the next hour" message instead of an empty chart.

### One Call 3.0 — `hourly` array (48 items, next 48 hours)
Each item contains:
| Field | What it is |
|---|---|
| `dt` | Timestamp |
| `temp` | Temperature °C |
| `feels_like` | Apparent temp °C |
| `pressure` | Pressure hPa |
| `humidity` | Humidity % |
| `dew_point` | Dew point °C |
| `uvi` | UV index |
| `clouds` | Cloudiness % |
| `visibility` | Visibility metres |
| `wind_speed` | Wind m/s |
| `wind_gust` | Gust m/s (optional) |
| `wind_deg` | Direction degrees |
| `pop` | Precipitation probability 0-1 |
| `rain.1h` | Rain mm/h (optional) |
| `snow.1h` | Snow mm/h (optional) |
| `weather[0].*` | Same as current (id, main, description, icon) |

**Display as:** A collapsible section titled "48-Hour Forecast". Default view: a scrollable horizontal card strip showing hour, icon, temp, and pop% for each hour. Expandable detail: tapping/clicking a card reveals the full data for that hour (dew point, pressure, humidity, UVI, visibility, wind details, clouds).

### One Call 3.0 — `daily` array (8 items, next 8 days)
Each item contains:
| Field | What it is |
|---|---|
| `dt` | Day timestamp |
| `sunrise` | Sunrise |
| `sunset` | Sunset |
| `moonrise` | Moonrise |
| `moonset` | Moonset |
| `moon_phase` | Moon phase 0-1 float. Map to: 0/1=New Moon, 0.25=First Quarter, 0.5=Full Moon, 0.75=Last Quarter, with waxing/waning crescent/gibbous in between. **Show a moon phase icon/emoji** |
| `summary` | Human-readable day summary from OpenWeather AI |
| `temp.morn` | Morning temp |
| `temp.day` | Day temp |
| `temp.eve` | Evening temp |
| `temp.night` | Night temp |
| `temp.min` | Day minimum |
| `temp.max` | Day maximum |
| `feels_like.morn` | Feels like morning |
| `feels_like.day` | Feels like day |
| `feels_like.eve` | Feels like evening |
| `feels_like.night` | Feels like night |
| `pressure` | Pressure hPa |
| `humidity` | Humidity % |
| `dew_point` | Dew point °C |
| `wind_speed` | Wind m/s |
| `wind_gust` | Gust m/s (optional) |
| `wind_deg` | Direction degrees |
| `clouds` | Cloudiness % |
| `uvi` | Max UV index for the day |
| `pop` | Precipitation probability |
| `rain` | Rain volume mm (optional) |
| `snow` | Snow volume mm (optional) |
| `weather[0].*` | Condition (id, main, description, icon) |

**Display as:** A collapsible section titled "8-Day Forecast". Each day is a collapsible row. Collapsed view shows: day name, icon, min/max temp, pop%, summary text. Expanded view shows EVERYTHING: the 4-period temps (morn/day/eve/night) in a mini table, feels_like alongside each, sun/moon times with computed day length, moon phase with icon, pressure, humidity, dew point, wind, clouds, UVI with color badge, rain/snow volumes.

### One Call 3.0 — `alerts` array (optional, may be empty or absent)
| Field | What it is |
|---|---|
| `sender_name` | Alert source |
| `event` | Alert event name |
| `start` | Start time Unix UTC |
| `end` | End time Unix UTC |
| `description` | Full alert text |
| `tags` | Array of severe weather type tags |

**Display as:** If alerts exist, show them at the TOP of the page in a prominent warning-colored banner/card (yellow/orange/red depending on severity). Each alert is collapsible — collapsed shows event name + sender + time range, expanded shows the full description. If no alerts, don't render this section at all — no "No alerts" placeholder needed.

### Air Pollution API — response shape
```json
{
  "list": [{
    "dt": 1606147200,
    "main": { "aqi": 4 },
    "components": {
      "co": 203.609,
      "no": 0.0,
      "no2": 0.396,
      "o3": 75.102,
      "so2": 0.648,
      "pm2_5": 23.253,
      "pm10": 92.214,
      "nh3": 0.117
    }
  }]
}
```

Display ALL of these:
| Field | Full name | Unit |
|---|---|---|
| `aqi` | Air Quality Index | 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor. Show color-coded badge |
| `co` | Carbon Monoxide | μg/m³ |
| `no` | Nitrogen Monoxide | μg/m³ |
| `no2` | Nitrogen Dioxide | μg/m³ |
| `o3` | Ozone | μg/m³ |
| `so2` | Sulphur Dioxide | μg/m³ |
| `pm2_5` | Fine Particles (PM2.5) | μg/m³ |
| `pm10` | Coarse Particles (PM10) | μg/m³ |
| `nh3` | Ammonia | μg/m³ |

**Display as:** A collapsible "Air Quality" section. Collapsed shows the AQI badge with label. Expanded shows all 8 pollutant readings, each with its full chemical name, value, and unit. Use small progress bars or gauges against WHO guideline thresholds if feasible.

---

## Page Layout & UX Requirements

### Structure (top to bottom)
1. **Weather Alerts** (only if `alerts` exists and is non-empty) — pinned at top, prominent
2. **Current Conditions** — always open by default, this is the hero section. Show all current fields in a well-organized grid/card layout
3. **Minutely Precipitation** — precipitation timeline for the next 60 minutes, collapsible, default OPEN
4. **48-Hour Forecast** — collapsible, default OPEN showing the card strip
5. **8-Day Forecast** — collapsible, default OPEN showing collapsed day rows
6. **Air Quality** — collapsible, default OPEN
7. **Location Metadata** — small footer section showing lat, lon, timezone, timezone_offset, and a "Last updated" timestamp from `current.dt`

### Collapsible behavior
- Each major section has a section header with a chevron/arrow toggle
- Smooth expand/collapse animation (CSS transition on max-height or similar)
- Within the 8-day forecast, each individual day row is ALSO independently collapsible
- Within the 48-hour forecast, each hour card is expandable for full details

### Data formatting rules
- All Unix timestamps → format to local time using the `timezone_offset` from the API. Show as "HH:MM" for times, "Day, Mon DD" for dates
- Temperatures → show as `XX.X°C` with 1 decimal place
- Wind direction degrees → always show both the compass label (N, NNE, NE, ENE, E, etc. — use 16-point compass) AND the raw degree value
- Precipitation probability (`pop`) → convert from 0-1 to percentage display (`XX%`)
- Visibility → convert metres to km (divide by 1000), show as `X.X km`
- Moon phase → map the 0-1 float to a phase name AND a representative icon/emoji (🌑🌒🌓🌔🌕🌖🌗🌘)
- Day length → compute from sunrise and sunset, display as `XXh XXm`
- Optional/conditional fields (`rain`, `snow`, `wind_gust`) → only render their UI element if the field is present in the data. Don't show empty rows or "N/A" for these

### Tooltip explainers
Add small info (ℹ️) icons next to these fields that show a tooltip on hover/tap explaining what the value means:
- **Dew Point**: "The temperature at which air becomes saturated and dew forms. Closer to the actual temp = more humid it feels."
- **UV Index**: "Measures solar UV radiation intensity. 0-2: Low risk, 3-5: Moderate, 6-7: High, 8-10: Very High, 11+: Extreme."
- **Pressure**: "Atmospheric pressure at sea level. Standard is ~1013 hPa. Falling pressure may indicate incoming storms."
- **AQI**: "Air Quality Index on a 1-5 scale. 1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor."
- **Moon Phase**: "0 and 1 = New Moon, 0.25 = First Quarter, 0.5 = Full Moon, 0.75 = Last Quarter."
- **Precipitation Probability**: "The likelihood of precipitation occurring during this period, from 0% to 100%."

### Visual design
- Clean, information-dense but not cluttered — think of a cockpit instrument panel vibe
- Use subtle grid lines and section dividers
- Color coding for severity scales (UVI, AQI) should use accessible color contrast
- Dark mode compatible (use CSS variables for theming)
- Mobile responsive — the grids should reflow to single column on narrow screens
- For the minutely precipitation chart, use simple CSS bars (no heavy chart libraries needed unless already in the project)
- Section headers should be sticky when scrolling within their section on mobile

### What NOT to do
- Do NOT leave out any field from the API response. This is a technical details page — completeness is the whole point
- Do NOT show "N/A" or empty placeholders for optional fields that are absent. Just omit them
- Do NOT hardcode any data. Everything should be dynamic from the passed-in API data
- Do NOT make additional API calls from this component. Data is passed in
- Do NOT use heavy charting libraries just for the minutely precipitation bar — CSS is fine
