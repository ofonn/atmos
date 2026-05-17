import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../api/models/open_meteo.dart';
import '../../state/ai_content_provider.dart';
import '../../state/location_provider.dart';
import '../../state/settings_provider.dart';
import '../../state/weather_provider.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';
import '../../utils/formatters.dart';
import '../../utils/weather_codes.dart';
import '../../widgets/ai_fab.dart';
import '../../widgets/animated_number.dart';
import '../../widgets/hourly_forecast.dart';
import '../../widgets/meteo_icon.dart';
import '../../widgets/onboarding_sheet.dart';
import '../../widgets/outfit_card.dart';
import '../../widgets/responsive_headline.dart';
import '../../widgets/severe_weather_banner.dart';
import '../../widgets/share_button.dart';
import '../../widgets/weather_video_background.dart';
import '../../widgets/weather_particles.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _searchOpen = false;
  final TextEditingController _search = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Show onboarding on first launch (no-op if already completed).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) OnboardingSheet.maybeShow(context, ref);
    });
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  ({String headline, String advice, String? hook}) _fallbackHeadline(double temp, int code) {
    final int h = DateTime.now().hour;
    final bool night = h < 6 || h >= 22;
    final bool morning = h >= 6 && h < 12;

    if (code >= 95) {
      return (headline: 'Thunderstorm moving through right now.',
          advice: 'Stay inside. Dangerous lightning and heavy rain until it passes.',
          hook: null);
    }
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
      return (headline: night ? 'Snowing through the night.' : 'Snow falling right now.',
          advice: 'Roads will be slippery. Give yourself extra time.', hook: null);
    }
    if (code >= 45 && code <= 48) {
      return (headline: 'Thick fog cutting visibility down.',
          advice: 'Drive with lights on and slow down — visibility is low.', hook: null);
    }
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
      return (headline: night ? 'Raining through the night.' : "It's raining right now.",
          advice: night ? "It'll likely clear by morning." : 'Grab an umbrella.', hook: null);
    }
    if ((code == 0 || code == 1) && temp >= 28) {
      return (headline: 'Hot, sunny, and bright outside.',
          advice: 'Sun is strong today. Sunscreen if you head out.', hook: null);
    }
    if ((code == 0 || code == 1)) {
      return (headline: morning ? 'Beautiful morning out there.' : 'Perfect weather right now.',
          advice: 'Almost perfect conditions. Get out if you can.', hook: null);
    }
    if (code == 2 || code == 3) {
      return (headline: 'Grey skies but staying dry.',
          advice: 'No rain expected — no umbrella needed.', hook: null);
    }
    return (headline: 'Conditions are pretty normal today.',
        advice: 'Nothing out of the ordinary. Check the hourly for changes.', hook: null);
  }

  Color? _skyTint(OmCurrent c, OmDaily d) {
    if (d.sunrise.isEmpty || d.sunset.isEmpty) return null;
    final DateTime now = DateTime.now();
    final DateTime sunrise = DateTime.parse(d.sunrise.first);
    final DateTime sunset = DateTime.parse(d.sunset.first);
    final Duration win = const Duration(minutes: 30);
    if (now.isAfter(sunrise.subtract(win)) && now.isBefore(sunrise.add(win))) {
      return const Color(0x12FF8C3C);
    }
    if (now.isAfter(sunset.subtract(win)) && now.isBefore(sunset.add(win))) {
      return const Color(0x12FF5064);
    }
    if (c.isDay == 0) return const Color(0x1F141E50);
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final AtmosSettings settings = ref.watch(settingsProvider);
    final AsyncValue<LocationState> locAsync = ref.watch(locationProvider);
    final AsyncValue<WeatherSnapshot?> weatherAsync = ref.watch(weatherProvider);
    final AsyncValue<Map<String, dynamic>?> airAsync = ref.watch(airQualityProvider);
    final AsyncValue<dynamic> aiAsync = ref.watch(aiContentProvider);

    final LocationState? loc = locAsync.valueOrNull;
    final WeatherSnapshot? snap = weatherAsync.valueOrNull;

    final bool locLoading = locAsync.isLoading || (loc?.loading ?? false);
    final bool weatherLoading = weatherAsync.isLoading && snap == null;

    return Scaffold(
      backgroundColor: t.bg,
      body: AtmosphericBackground(
        skyTint: snap == null ? null : _skyTint(snap.data.current, snap.data.daily),
        child: SafeArea(
          child: Stack(
            children: <Widget>[
              if (snap != null)
                WeatherVideoBackground(
                  conditionCode: snap.data.current.weatherCode,
                  isDay: snap.data.current.isDay == 1,
                ),
              if (snap != null)
                Positioned.fill(
                  child: WeatherParticles(
                    effect: effectFor(snap.data.current.weatherCode, isDay: snap.data.current.isDay == 1),
                  ),
                ),
              Column(
                children: <Widget>[
                  _header(loc, locLoading),
                  if (loc?.current != null)
                    SevereWeatherBanner(lat: loc!.current!.lat, lon: loc.current!.lon),
                  if (_searchOpen) _searchBar(),
                  Expanded(
                    child: weatherLoading
                        ? _skeleton()
                        : snap == null
                            ? _welcome()
                            : _content(snap, settings, airAsync.valueOrNull, aiAsync.valueOrNull),
                  ),
                ],
              ),
              if (snap != null)
                Positioned(
                  right: 20,
                  bottom: 76,
                  child: const AiFab(),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _header(LocationState? loc, bool locLoading) {
    final AtmosTokens t = context.atmos;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
      child: Row(
        children: <Widget>[
          Expanded(
            child: GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                setState(() => _searchOpen = !_searchOpen);
              },
              child: Row(
                children: <Widget>[
                  if (locLoading)
                    SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2, color: t.primary),
                    )
                  else
                    Icon(LucideIcons.mapPin, size: 16, color: t.primary),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      locLoading
                          ? 'Syncing GPS…'
                          : loc?.current == null
                              ? 'Set location'
                              : '${loc!.current!.name}${loc.current!.country.isNotEmpty ? ', ${loc.current!.country}' : ''}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AtmosTypography.headline(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: t.primary,
                      ),
                    ),
                  ),
                  Icon(LucideIcons.chevronDown, size: 16, color: t.primary.withOpacity(0.7)),
                ],
              ),
            ),
          ),
          IconButton(
            icon: Icon(_searchOpen ? LucideIcons.x : LucideIcons.search, size: 18, color: t.textMuted),
            onPressed: () => setState(() => _searchOpen = !_searchOpen),
          ),
        ],
      ),
    );
  }

  Widget _searchBar() {
    final AtmosTokens t = context.atmos;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: t.glassFill.withOpacity(0.5),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: t.glassBorder.withOpacity(0.3), width: 0.5),
        ),
        child: Row(
          children: <Widget>[
            Icon(LucideIcons.search, size: 16, color: t.textMuted),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _search,
                autofocus: true,
                style: TextStyle(color: t.text, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Search city…',
                  hintStyle: TextStyle(color: t.textMuted),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 8),
                ),
                onSubmitted: (String q) async {
                  if (q.trim().isEmpty) return;
                  await ref.read(locationProvider.notifier).searchCity(q.trim());
                  if (mounted) {
                    setState(() {
                      _search.clear();
                      _searchOpen = false;
                    });
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _skeleton() {
    final AtmosTokens t = context.atmos;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(color: t.surfaceMid.withOpacity(0.6), shape: BoxShape.circle),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Container(width: 96, height: 36, color: t.surfaceMid.withOpacity(0.6)),
                  const SizedBox(height: 6),
                  Container(width: 80, height: 12, color: t.surfaceMid.withOpacity(0.4)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          for (int i = 0; i < 3; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                width: MediaQuery.of(context).size.width * (0.95 - i * 0.13),
                height: 32,
                color: t.surfaceMid.withOpacity(0.4 - i * 0.1),
              ),
            ),
        ],
      ),
    );
  }

  Widget _welcome() {
    final AtmosTokens t = context.atmos;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              width: 80,
              height: 80,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: <Color>[Color(0xFFFFF7CC), Color(0xFFFFA500)],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text('Welcome to Atmos',
                style: AtmosTypography.headline(fontSize: 22, fontWeight: FontWeight.w600, color: t.text)),
            const SizedBox(height: 8),
            Text(
              'Allow location access or tap to search a city.',
              textAlign: TextAlign.center,
              style: AtmosTypography.body(fontSize: 14, color: t.textMuted),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => ref.read(locationProvider.notifier).syncGps(),
              style: FilledButton.styleFrom(backgroundColor: t.primary, foregroundColor: Colors.white),
              icon: const Icon(LucideIcons.mapPin, size: 16),
              label: const Text('Use my location'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => setState(() => _searchOpen = true),
              style: OutlinedButton.styleFrom(
                foregroundColor: t.text,
                side: BorderSide(color: t.outline),
              ),
              icon: const Icon(LucideIcons.search, size: 16),
              label: const Text('Search a city'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _content(WeatherSnapshot snap, AtmosSettings settings, Map<String, dynamic>? air, dynamic aiContent) {
    final AtmosTokens t = context.atmos;
    final OmCurrent c = snap.data.current;
    final OmDaily d = snap.data.daily;
    final OmHourly h = snap.data.hourly;
    final int nowIdx = snap.data.nowHourIndex;
    final int aqi = (air?['list'] is List && (air!['list'] as List).isNotEmpty)
        ? (((air['list'] as List).first as Map<String, dynamic>)['main']
                ?['aqi'] as num?)
                ?.toInt() ??
            -1
        : -1;
    final ({String headline, String advice, String? hook}) display = aiContent != null
        ? (headline: aiContent.headline as String, advice: aiContent.advice as String, hook: aiContent.hook as String?)
        : _fallbackHeadline(c.temperature2m, c.weatherCode);

    final double rawTemp = c.temperature2m;
    final double feels = c.apparentTemperature;
    final double diff = feels - rawTemp;
    final Color feelsColor = diff >= 4
        ? AtmosColors.warmAccent
        : diff <= -4
            ? AtmosColors.coolAccent
            : t.textMuted;

    return Column(
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            children: <Widget>[
              MeteoIcon(conditionCode: c.weatherCode, isDay: c.isDay == 1, size: 88),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    AnimatedNumber(
                      value: settings.tempUnit == 'F' ? rawTemp * 9 / 5 + 32 : rawTemp,
                      format: (double v) => '${v.round()}°${settings.tempUnit}',
                      style: AtmosTypography.headline(
                        fontSize: 64,
                        fontWeight: FontWeight.w800,
                        color: t.text,
                        height: 1.0,
                      ),
                    ),
                    const SizedBox(height: 4),
                    RichText(
                      text: TextSpan(
                        style: AtmosTypography.label(fontSize: 11, color: t.textMuted),
                        children: <InlineSpan>[
                          const TextSpan(text: 'Feels like '),
                          TextSpan(
                            text: displayTemp(feels, settings.tempUnit),
                            style: TextStyle(color: feelsColor, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 6,
                      children: <Widget>[
                        Text(
                          'H:${displayTempShort(d.temperature2mMax.elementAtOrNull(0) ?? 0, settings.tempUnit)} '
                          'L:${displayTempShort(d.temperature2mMin.elementAtOrNull(0) ?? 0, settings.tempUnit)}',
                          style: AtmosTypography.label(fontSize: 10, color: t.textMuted),
                        ),
                        Text('·', style: TextStyle(color: t.textMuted.withOpacity(0.4))),
                        Text(
                          '${(h.precipitationProbability.elementAtOrNull(nowIdx) ?? 0).round()}% Rain',
                          style: AtmosTypography.label(fontSize: 10, color: t.textMuted),
                        ),
                        Text('·', style: TextStyle(color: t.textMuted.withOpacity(0.4))),
                        Text(
                          displayWind(c.windSpeed10m, settings.windUnit),
                          style: AtmosTypography.label(fontSize: 10, color: t.textMuted),
                        ),
                        if (aqi > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: aqiColor(aqi).withOpacity(0.15),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              'AQI ${aqiLabel(aqi)}',
                              style: AtmosTypography.label(
                                fontSize: 9,
                                color: aqiColor(aqi),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: ResponsiveHeadline(
              headline: display.headline,
              hook: display.hook,
              twoLineMode: settings.headlineTwoLine && display.hook != null,
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                display.advice,
                style: AtmosTypography.body(fontSize: 14, fontWeight: FontWeight.w500, color: t.textMuted, height: 1.45),
              ),
              const SizedBox(height: 12),
              Row(
                children: <Widget>[
                  GestureDetector(
                    onTap: () => context.push('/insight'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: t.surface,
                        borderRadius: BorderRadius.circular(40),
                        border: Border.all(color: t.primary.withOpacity(0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          Text(
                            'Daily Briefing',
                            style: AtmosTypography.label(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: t.primary,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(LucideIcons.arrowRight, size: 12, color: t.primary),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  TextButton.icon(
                    onPressed: () {
                      ref.read(weatherProvider.notifier).refresh();
                      ref.read(aiContentProvider.notifier).refresh(force: true);
                    },
                    icon: Icon(LucideIcons.refreshCw, size: 12, color: t.textMuted),
                    label: Text(
                      'Refresh',
                      style: AtmosTypography.label(fontSize: 10, color: t.textMuted, letterSpacing: 1.5),
                    ),
                    style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8)),
                  ),
                  TextButton.icon(
                    onPressed: () => context.push('/radar'),
                    icon: const Text('🛰️', style: TextStyle(fontSize: 12)),
                    label: Text(
                      'Radar',
                      style: AtmosTypography.label(fontSize: 10, color: t.textMuted, letterSpacing: 1.5),
                    ),
                  ),
                  const Spacer(),
                  TextButton.icon(
                    onPressed: () => _openTonePicker(),
                    icon: Icon(LucideIcons.sparkles, size: 12, color: t.primary),
                    label: Text(
                      'Tone',
                      style: AtmosTypography.label(fontSize: 10, color: t.primary, letterSpacing: 1.5),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: HourlyForecast(
            hourly: h,
            startIndex: nowIdx,
            count: 8,
            settings: settings,
          ),
        ),
        // AI outfit recommendation
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: OutfitCard(
            temp: c.temperature2m,
            feelsLike: c.apparentTemperature,
            conditionCode: c.weatherCode,
            windSpeed: c.windSpeed10m,
            humidity: c.relativeHumidity2m.toDouble(),
            pop: nowIdx < h.precipitationProbability.length
                ? h.precipitationProbability[nowIdx].toDouble()
                : 0,
          ),
        ),
        // Share weather chip
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Align(
            alignment: Alignment.centerRight,
            child: Builder(builder: (BuildContext ctx) {
              final LocationState? loc = ref.watch(locationProvider).valueOrNull;
              final String city = loc?.current?.name ?? '';
              return ShareWeatherButton(
                cityName: city,
                temp: c.temperature2m,
                feelsLike: c.apparentTemperature,
                description: Wmo.describe(c.weatherCode),
                tempMin: d.temperature2mMin.isNotEmpty ? d.temperature2mMin[0] : c.temperature2m,
                tempMax: d.temperature2mMax.isNotEmpty ? d.temperature2mMax[0] : c.temperature2m,
                unit: settings.tempUnit,
              );
            }),
          ),
        ),
      ],
    );
  }

  void _openTonePicker() {
    final AtmosSettings s = ref.read(settingsProvider);
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: context.atmos.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('Headline tone',
                  style: AtmosTypography.headline(
                      fontSize: 18, fontWeight: FontWeight.w600, color: ctx.atmos.text)),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: headlineTones.map((t) {
                  final bool active = s.headlineTone == t.value;
                  return GestureDetector(
                    onTap: () {
                      ref.read(settingsProvider.notifier).setHeadlineTone(t.value);
                      ref.read(aiContentProvider.notifier).refresh(force: true);
                      Navigator.of(ctx).pop();
                    },
                    child: Container(
                      width: (MediaQuery.of(ctx).size.width - 64) / 4,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: active ? ctx.atmos.primary.withOpacity(0.15) : ctx.atmos.surfaceMid,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: active ? ctx.atmos.primary : Colors.transparent,
                          width: 1,
                        ),
                      ),
                      child: Column(
                        children: <Widget>[
                          Text(t.emoji, style: const TextStyle(fontSize: 22)),
                          const SizedBox(height: 4),
                          Text(t.label,
                              style: AtmosTypography.label(
                                  fontSize: 11, color: ctx.atmos.text, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        );
      },
    );
  }
}

extension _ListSafe<T> on List<T> {
  T? elementAtOrNull(int i) => (i >= 0 && i < length) ? this[i] : null;
}
