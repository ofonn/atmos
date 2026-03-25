# Claude Code Prompt — Weather App Technical Details Page (Hybrid API Approach)

## Context

I have a weather app that currently uses **OpenWeatherMap free tier** endpoints. I'm adding a **Technical Details page** — the "data nerd" page that displays every piece of weather data we can get. I'm supplementing OpenWeatherMap with **Open-Meteo** (free, no API key) to get fields like UV index, dew point, and more that OpenWeatherMap locks behind their paid One Call 3.0 plan.

The page receives data from **3 API sources**, all fetched beforehand and passed in as props/data:

---

## API Source 1: OpenWeatherMap — Current Weather (already in the app)

**Endpoint:** `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={key}`

```json
{
  "coord": { "lon": 7.9405, "lat": 4.6471 },
  "weather": [
    {
      "id": 804,
      "main": "Clouds",
      "description": "overcast clouds",
      "icon": "04n"
    }
  ],
  "base": "stations",
  "main": {
    "temp": 299.69,
    "feels_like": 299.69,
    "temp_min": 299.69,
    "temp_max": 299.69,
    "pressure": 1007,
    "humidity": 86,
    "sea_level": 1007,
    "grnd_level": 1004
  },
  "visibility": 10000,
  "wind": { "speed": 2.84, "deg": 246, "gust": 5.13 },
  "clouds": { "all": 100 },
  "dt": 1774233757,
  "sys": { "country": "NG", "sunrise": 1774243870, "sunset": 1774287509 },
  "timezone": 3600,
  "id": 2343720,
  "name": "Eket",
  "cod": 200
}
```

**Display every field:**
| Field | Display guidance |
|---|---|
| `weather[0].icon` | Render icon from `https://openweathermap.org/img/wn/{icon}@2x.png` |
| `weather[0].main` | Condition group (e.g. "Clouds", "Rain") |
| `weather[0].description` | Capitalize first letter |
| `weather[0].id` | Show as a subtle "API code" badge |
| `main.temp` | Temperature — convert from Kelvin to °C (subtract 273.15). Show with 1 decimal |
| `main.feels_like` | Show alongside temp, highlight the **difference** |
| `main.temp_min` / `temp_max` | Daily range |
| `main.pressure` | Sea-level pressure hPa. Add context label: "Normal ~1013 hPa" |
| `main.sea_level` | Sea-level pressure hPa |
| `main.grnd_level` | Ground-level pressure hPa |
| `main.humidity` | Humidity % with a simple bar or gauge |
| `visibility` | Convert metres → km (divide by 1000), show as `X.X km` |
| `wind.speed` | Wind speed m/s with compass arrow for direction |
| `wind.deg` | Convert to 16-point compass label (N, NNE, NE, etc.) AND show degree value |
| `wind.gust` | Wind gust m/s (only show if present) |
| `clouds.all` | Cloud coverage % |
| `dt` | "Last updated" timestamp — format to local time using `timezone` offset |
| `sys.sunrise` | Format as local time. Compute **day length** = sunset − sunrise, show as "XXh XXm" |
| `sys.sunset` | Format as local time |
| `timezone` | UTC offset in seconds — display as "UTC+X" |
| `coord.lat` / `coord.lon` | Show in metadata footer |
| `name` | City name |
| `sys.country` | Country code |

**Note:** If using `units=metric` in the API call, temps arrive in °C already. If using default (Kelvin), subtract 273.15. Handle both cases gracefully.

---

## API Source 2: OpenWeatherMap — 5-Day / 3-Hour Forecast (already in the app)

**Endpoint:** `https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={key}`

Returns `list[]` with 40 items (every 3 hours for 5 days). Each item has:

| Field                        | What it is                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `dt`                         | Timestamp (Unix UTC)                                                          |
| `dt_txt`                     | Human-readable datetime string                                                |
| `main.temp`                  | Temperature                                                                   |
| `main.feels_like`            | Feels like temp                                                               |
| `main.temp_min` / `temp_max` | Range                                                                         |
| `main.pressure`              | Sea-level pressure hPa                                                        |
| `main.sea_level`             | Sea-level pressure                                                            |
| `main.grnd_level`            | Ground-level pressure                                                         |
| `main.humidity`              | Humidity %                                                                    |
| `main.temp_kf`               | Internal temperature correction factor — display with label "Temp correction" |
| `weather[0].*`               | id, main, description, icon — same as current                                 |
| `clouds.all`                 | Cloud coverage %                                                              |
| `wind.speed`                 | Wind m/s                                                                      |
| `wind.deg`                   | Wind direction degrees                                                        |
| `wind.gust`                  | Gust m/s (optional)                                                           |
| `visibility`                 | Metres                                                                        |
| `pop`                        | Precipitation probability 0–1, display as percentage                          |
| `rain.3h`                    | Rain volume last 3h in mm (optional — only show if present)                   |
| `snow.3h`                    | Snow volume last 3h in mm (optional — only show if present)                   |
| `sys.pod`                    | "d" = day, "n" = night — use for day/night indicator icon                     |

Also includes `city` object:
| Field | What it is |
|---|---|
| `city.name` | City name |
| `city.coord` | Coordinates |
| `city.country` | Country code |
| `city.population` | Population |
| `city.timezone` | UTC offset in seconds |
| `city.sunrise` / `city.sunset` | Sunrise/sunset timestamps |

**Display as:** Collapsible "5-Day / 3-Hour Forecast" section. Default view: scrollable horizontal card strip showing time, day/night icon, weather icon, temp, and pop% for each 3-hour slot. Cards are grouped by date with date headers. Clicking/tapping a card expands it to show ALL fields for that slot (pressure, humidity, ground-level pressure, wind details, visibility, rain/snow volumes, temp_kf).

---

## API Source 3: Open-Meteo — The Extra Data (NEW — no API key needed)

**Endpoint:**

```
https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,weather_code,pressure_msl,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,evapotranspiration,vapour_pressure_deficit,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day,cape,freezing_level_height,sunshine_duration&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,uv_index_clear_sky_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant&timezone=auto&forecast_days=16
```

### Open-Meteo — `current` object

| Field                  | What it is               | Display guidance                         |
| ---------------------- | ------------------------ | ---------------------------------------- |
| `temperature_2m`       | Current temp °C          | Cross-reference with OpenWeatherMap temp |
| `relative_humidity_2m` | Humidity %               |                                          |
| `apparent_temperature` | Feels like °C            |                                          |
| `is_day`               | 1 = day, 0 = night       | Use for UI theming                       |
| `precipitation`        | Current precipitation mm |                                          |
| `rain`                 | Rain mm                  |                                          |
| `showers`              | Convective showers mm    |                                          |
| `snowfall`             | Snow cm                  |                                          |
| `weather_code`         | WMO code                 | Map to description (see WMO table below) |
| `cloud_cover`          | Total cloud %            |                                          |
| `pressure_msl`         | Sea-level pressure hPa   |                                          |
| `surface_pressure`     | Surface pressure hPa     |                                          |
| `wind_speed_10m`       | Wind km/h                |                                          |
| `wind_direction_10m`   | Wind degrees             | Convert to compass                       |
| `wind_gusts_10m`       | Gusts km/h               |                                          |

### Open-Meteo — `hourly` arrays (up to 16 days × 24 hours)

Every field below is an array indexed by hour. Display alongside or merged with the OpenWeatherMap 3-hour forecast for overlap periods, then continue with Open-Meteo-only data beyond 5 days.

| Field                       | What it is                   | Display guidance                                                                                                                            |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `temperature_2m`            | Temp °C                      |                                                                                                                                             |
| `relative_humidity_2m`      | Humidity %                   |                                                                                                                                             |
| `dew_point_2m`              | **Dew point °C**             | Show with tooltip: "Temperature at which moisture condenses. Closer to actual temp = more humid it feels."                                  |
| `apparent_temperature`      | Feels like °C                |                                                                                                                                             |
| `precipitation_probability` | Precip probability %         | Show as percentage                                                                                                                          |
| `precipitation`             | Total precip mm              |                                                                                                                                             |
| `rain`                      | Rain mm                      |                                                                                                                                             |
| `showers`                   | Convective showers mm        |                                                                                                                                             |
| `snowfall`                  | Snow cm                      |                                                                                                                                             |
| `snow_depth`                | Snow on ground (metres)      | Only show if > 0                                                                                                                            |
| `weather_code`              | WMO code                     | Map to description                                                                                                                          |
| `pressure_msl`              | Sea-level pressure hPa       |                                                                                                                                             |
| `surface_pressure`          | Surface pressure hPa         |                                                                                                                                             |
| `cloud_cover`               | Total cloud %                |                                                                                                                                             |
| `cloud_cover_low`           | Low clouds % (below 3km)     | Show in a stacked cloud breakdown                                                                                                           |
| `cloud_cover_mid`           | Mid clouds % (3–8km)         |                                                                                                                                             |
| `cloud_cover_high`          | High clouds % (8km+)         |                                                                                                                                             |
| `visibility`                | Metres → convert to km       |                                                                                                                                             |
| `evapotranspiration`        | mm                           | Show with tooltip: "Water lost from soil and plants to atmosphere"                                                                          |
| `vapour_pressure_deficit`   | kPa                          | Show with tooltip: "High VPD (>1.6) = very dry air. Low VPD (<0.4) = very humid"                                                            |
| `wind_speed_10m`            | Wind km/h                    |                                                                                                                                             |
| `wind_direction_10m`        | Degrees → compass            |                                                                                                                                             |
| `wind_gusts_10m`            | Gusts km/h                   |                                                                                                                                             |
| `uv_index`                  | **UV Index**                 | Color-coded: 0-2 Low/Green, 3-5 Moderate/Yellow, 6-7 High/Orange, 8-10 Very High/Red, 11+ Extreme/Violet                                    |
| `is_day`                    | 1/0                          | Day/night indicator                                                                                                                         |
| `cape`                      | J/kg                         | Show with tooltip: "Convective Available Potential Energy — higher values indicate thunderstorm potential. >1000 = significant instability" |
| `freezing_level_height`     | Metres                       | Show with tooltip: "Altitude where temperature drops to 0°C"                                                                                |
| `sunshine_duration`         | Seconds → convert to minutes | Actual sunshine in the past hour                                                                                                            |

### Open-Meteo — `daily` arrays (up to 16 days)

| Field                           | What it is                 | Display guidance                                                        |
| ------------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| `weather_code`                  | WMO code                   | Map to description                                                      |
| `temperature_2m_max`            | Day high °C                |                                                                         |
| `temperature_2m_min`            | Day low °C                 |                                                                         |
| `apparent_temperature_max`      | Feels like high            |                                                                         |
| `apparent_temperature_min`      | Feels like low             |                                                                         |
| `sunrise`                       | ISO 8601 time              | Format to local time                                                    |
| `sunset`                        | ISO 8601 time              | Format to local time, compute **day length**                            |
| `daylight_duration`             | Seconds → "Xh Xm"          | Total daylight                                                          |
| `sunshine_duration`             | Seconds → "Xh Xm"          | Actual sunshine (less than daylight if cloudy) — show both side by side |
| `uv_index_max`                  | **Max UV for the day**     | Same color scale as hourly                                              |
| `uv_index_clear_sky_max`        | Max UV assuming clear sky  | Show as "potential max" alongside actual                                |
| `precipitation_sum`             | Total precip mm            |                                                                         |
| `rain_sum`                      | Rain total mm              |                                                                         |
| `showers_sum`                   | Shower total mm            |                                                                         |
| `snowfall_sum`                  | Snow total cm              |                                                                         |
| `precipitation_hours`           | Hours with precip          |                                                                         |
| `precipitation_probability_max` | Max precip chance %        |                                                                         |
| `wind_speed_10m_max`            | Max wind km/h              |                                                                         |
| `wind_gusts_10m_max`            | Max gust km/h              |                                                                         |
| `wind_direction_10m_dominant`   | Dominant direction degrees | Convert to compass                                                      |

---

## API Source 4: OpenWeatherMap — Air Pollution (free, already has API key)

**Endpoint:** `https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={key}`

```json
{
  "list": [
    {
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
    }
  ]
}
```

| Field   | Full Name               | Unit                                                          |
| ------- | ----------------------- | ------------------------------------------------------------- |
| `aqi`   | Air Quality Index       | 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor — color badge |
| `co`    | Carbon Monoxide (CO)    | μg/m³                                                         |
| `no`    | Nitrogen Monoxide (NO)  | μg/m³                                                         |
| `no2`   | Nitrogen Dioxide (NO₂)  | μg/m³                                                         |
| `o3`    | Ozone (O₃)              | μg/m³                                                         |
| `so2`   | Sulphur Dioxide (SO₂)   | μg/m³                                                         |
| `pm2_5` | Fine Particles (PM2.5)  | μg/m³                                                         |
| `pm10`  | Coarse Particles (PM10) | μg/m³                                                         |
| `nh3`   | Ammonia (NH₃)           | μg/m³                                                         |

---

## LLM-Generated Air Quality Summary

**Important feature:** After the Air Quality section loads, pass the AQI value and all 8 pollutant readings to the Anthropic API (Claude Sonnet) to generate a **plain-English summary paragraph** that explains:

- What the AQI level means for the person practically (should they go outside? wear a mask? keep windows open?)
- Which specific pollutants are elevated (if any) and what they come from (traffic, industry, dust, etc.)
- Who should be extra careful (children, elderly, people with asthma, etc.)

Display this summary inside the Air Quality section in a distinct card with an AI icon/badge, styled differently from the raw data (e.g. slightly different background, a ✨ or 🤖 label). The summary should be 2-4 sentences, conversational, and specific to the actual values — not generic boilerplate.

**Implementation:** Make the API call client-side to `https://api.anthropic.com/v1/messages` with model `claude-sonnet-4-20250514`. The prompt should include the actual pollutant values and AQI number. Do NOT pass an API key in the client code — route through a backend proxy or serverless function, or use the existing app backend.

---

## WMO Weather Code Mapping (for Open-Meteo)

Open-Meteo uses WMO weather interpretation codes instead of OpenWeatherMap's condition IDs. Map these to descriptions:

```
0: Clear sky
1: Mainly clear
2: Partly cloudy
3: Overcast
45: Fog
48: Depositing rime fog
51: Light drizzle
53: Moderate drizzle
55: Dense drizzle
56: Light freezing drizzle
57: Dense freezing drizzle
61: Slight rain
63: Moderate rain
65: Heavy rain
66: Light freezing rain
67: Heavy freezing rain
71: Slight snowfall
73: Moderate snowfall
75: Heavy snowfall
77: Snow grains
80: Slight rain showers
81: Moderate rain showers
82: Violent rain showers
85: Slight snow showers
86: Heavy snow showers
95: Thunderstorm
96: Thunderstorm with slight hail
99: Thunderstorm with heavy hail
```

---

## Page Layout & UX Requirements

### Structure (top to bottom)

1. **Current Conditions** — always open, hero section. Merge OpenWeatherMap current + Open-Meteo current. Group into sub-sections:
   - **Temperature & Comfort**: temp, feels like, dew point (from Open-Meteo hourly index 0), humidity
   - **Wind**: speed, direction (compass + degrees), gusts
   - **Sky**: cloud cover, visibility, weather description + icon
   - **Atmosphere**: sea-level pressure, ground/surface pressure, UV index (from Open-Meteo hourly index 0), CAPE
   - **Sun**: sunrise, sunset, day length, is_day indicator
   - **Precipitation**: current rain/snow, evapotranspiration
2. **Hourly Forecast** — collapsible, default OPEN. Uses Open-Meteo hourly data. Scrollable horizontal card strip. Each card: hour, weather icon (mapped from WMO code), temp, precip probability, UV. Tapping expands to full detail (dew point, cloud layers, CAPE, VPD, all wind data, visibility, freezing level, sunshine).
3. **5-Day / 3-Hour Forecast** — collapsible, default OPEN. Uses OpenWeatherMap forecast data. Grouped by day. Each 3-hour slot is a card showing time, icon, temp, pop%, rain volume. Expandable to show all fields.
4. **16-Day Daily Forecast** — collapsible, default OPEN. Uses Open-Meteo daily data. Each day is a collapsible row. Collapsed: day name, WMO icon, min/max temp, precip probability, UV max. Expanded: EVERYTHING — sunrise/sunset with day length, daylight vs sunshine duration, feels-like range, precip breakdown (rain/showers/snow), precip hours, wind max/gust/direction, UV index (actual vs clear-sky potential).
5. **Air Quality** — collapsible, default OPEN. Shows AQI badge, then the **LLM-generated summary card**, then all 8 pollutant readings with full chemical names, values, and units. Use small progress bars against WHO guideline thresholds.
6. **Location Metadata** — small footer: city name, country, lat, lon, timezone, population, data sources ("OpenWeatherMap + Open-Meteo + Air Pollution API"), last updated timestamp.

### Collapsible behavior

- Each major section has a section header with chevron toggle
- Smooth expand/collapse animation (CSS transition)
- Within the 16-day forecast, each individual day row is ALSO independently collapsible
- Within the hourly forecast, each hour card is expandable
- Within the 5-day forecast, each 3-hour card is expandable

### Data formatting rules

- All Unix timestamps → local time using timezone offset. "HH:MM" for times, "Day, Mon DD" for dates
- Temperatures → `XX.X°C` with 1 decimal
- Wind direction degrees → 16-point compass (N, NNE, NE, ENE, E, etc.) + raw degree value
- Precipitation probability → percentage display
- Visibility metres → km (divide by 1000)
- Durations in seconds → "Xh Xm" format
- Day length → compute from sunrise/sunset, display as "XXh XXm"
- Optional fields (rain, snow, gust) → only render if present and > 0. Don't show empty rows

### Tooltip explainers (ℹ️ icon on hover/tap)

- **Dew Point**: "The temperature at which air becomes saturated and dew forms. Closer to actual temp = more humid it feels."
- **UV Index**: "Solar UV radiation intensity. 0-2: Low, 3-5: Moderate, 6-7: High, 8-10: Very High, 11+: Extreme."
- **Pressure**: "Atmospheric pressure at sea level. Standard ~1013 hPa. Falling pressure may indicate storms."
- **Surface Pressure**: "Actual pressure at ground level. Lower than sea-level pressure at higher elevations."
- **AQI**: "Air Quality Index. 1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor."
- **CAPE**: "Convective Available Potential Energy. Higher = more thunderstorm potential. >1000 J/kg = significant instability."
- **VPD**: "Vapour Pressure Deficit. >1.6 kPa = very dry air, <0.4 kPa = very humid."
- **Evapotranspiration**: "Water lost from soil and plants to atmosphere. 1mm/h = 1 litre per square metre."
- **Freezing Level**: "Altitude where temperature reaches 0°C."
- **Sunshine Duration**: "Actual minutes of direct sunshine, as opposed to total daylight hours."
- **Precipitation Probability**: "Likelihood of precipitation, based on ensemble weather models running 30 different simulations."

### Handling two data sources for overlapping fields

- For the **Current Conditions** section: use OpenWeatherMap as the primary display (since the app already uses it), but pull dew_point, UV index, CAPE, VPD, evapotranspiration, and surface_pressure from Open-Meteo (these don't exist in OpenWeatherMap free tier)
- Where both sources provide the same field (e.g. temperature, humidity), show the OpenWeatherMap value as primary. Do NOT show both — avoid confusing users with two different temperature readings
- Label the data source subtly in the metadata footer, not on every field

### Visual design

- Clean, information-dense but not cluttered — cockpit instrument panel vibe
- Subtle grid lines and section dividers
- Color coding for severity scales (UV, AQI) with accessible contrast
- Dark mode compatible via CSS variables
- Mobile responsive — grids reflow to single column on narrow screens
- Section headers sticky on mobile when scrolling within their section

### What NOT to do

- Do NOT leave out any field. This is the technical details page — completeness is everything
- Do NOT show "N/A" for optional fields that are absent. Just omit them
- Do NOT hardcode any data. Everything dynamic from passed-in API data
- Do NOT make API calls from this component (except the LLM summary call). Data is passed in
- Do NOT confuse the user by showing the same measurement twice from different sources
- Do NOT use WMO codes raw — always map to human-readable descriptions
