import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../api/models/open_meteo.dart';
import '../../state/settings_provider.dart';
import '../../state/weather_provider.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/glass.dart';
import '../../theme/typography.dart';
import '../../utils/formatters.dart';
import '../../utils/weather_codes.dart';
import '../../widgets/meteo_icon.dart';

class TechnicalScreen extends ConsumerStatefulWidget {
  const TechnicalScreen({super.key});
  @override
  ConsumerState<TechnicalScreen> createState() => _TechnicalScreenState();
}

class _TechnicalScreenState extends ConsumerState<TechnicalScreen> {
  int _hourCount = 24;

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final AtmosSettings settings = ref.watch(settingsProvider);
    final AsyncValue<WeatherSnapshot?> weatherAsync = ref.watch(weatherProvider);
    final AsyncValue<Map<String, dynamic>?> airAsync = ref.watch(airQualityProvider);
    final WeatherSnapshot? snap = weatherAsync.valueOrNull;

    return Scaffold(
      backgroundColor: t.bg,
      body: AtmosphericBackground(
        child: SafeArea(
          child: snap == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
                  children: <Widget>[
                    _topBar(snap),
                    const SizedBox(height: 12),
                    _currentSection(snap, settings),
                    const SizedBox(height: 12),
                    _hourlySection(snap, settings),
                    const SizedBox(height: 12),
                    if (airAsync.valueOrNull != null) _airSection(airAsync.value!),
                    if (airAsync.valueOrNull != null) const SizedBox(height: 12),
                    _atmosphereSection(snap, settings),
                    const SizedBox(height: 12),
                    _sunSection(snap, settings),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _topBar(WeatherSnapshot snap) {
    final AtmosTokens t = context.atmos;
    return Row(
      children: <Widget>[
        IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: t.text),
          onPressed: () => context.go('/'),
        ),
        Text('Conditions', style: AtmosTypography.headline(fontSize: 20, fontWeight: FontWeight.w700, color: t.text)),
        const SizedBox(width: 8),
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: AtmosColors.success, shape: BoxShape.circle, boxShadow: <BoxShadow>[
            BoxShadow(color: AtmosColors.success.withOpacity(0.6), blurRadius: 8),
          ]),
        ),
        const Spacer(),
        Text(snap.location.name,
            style: AtmosTypography.label(fontSize: 11, color: t.textMuted)),
      ],
    );
  }

  Widget _currentSection(WeatherSnapshot snap, AtmosSettings s) {
    final AtmosTokens t = context.atmos;
    final OmCurrent c = snap.data.current;
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          _sectionTitle('Current conditions', LucideIcons.sun),
          const SizedBox(height: 8),
          Row(
            children: <Widget>[
              MeteoIcon(conditionCode: c.weatherCode, isDay: c.isDay == 1, size: 56, animated: false),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(Wmo.describe(c.weatherCode),
                        style: AtmosTypography.headline(fontSize: 16, fontWeight: FontWeight.w600, color: t.text)),
                    Text(displayTemp(c.temperature2m, s.tempUnit),
                        style: AtmosTypography.headline(fontSize: 28, fontWeight: FontWeight.w700, color: t.text)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _metricsGrid(<({IconData icon, String label, String value, Color? color})>[
            (icon: LucideIcons.thermometer, label: 'Temp', value: displayTemp(c.temperature2m, s.tempUnit), color: null),
            (icon: LucideIcons.thermometer, label: 'Feels like', value: displayTemp(c.apparentTemperature, s.tempUnit), color: AtmosColors.warmAccent),
            (icon: LucideIcons.droplets, label: 'Humidity', value: '${c.relativeHumidity2m.round()}%', color: AtmosColors.coolAccent),
            (icon: LucideIcons.wind, label: 'Wind', value: displayWind(c.windSpeed10m, s.windUnit), color: null),
            (icon: LucideIcons.gauge, label: 'Pressure', value: '${c.pressureMsl.round()} hPa', color: null),
            (icon: LucideIcons.cloudRain, label: 'Precip', value: '${c.precipitation.toStringAsFixed(1)} mm', color: AtmosColors.coolAccent),
          ]),
        ],
      ),
    );
  }

  Widget _hourlySection(WeatherSnapshot snap, AtmosSettings s) {
    final AtmosTokens t = context.atmos;
    final OmHourly h = snap.data.hourly;
    final int start = snap.data.nowHourIndex;
    final int end = (start + _hourCount).clamp(0, h.time.length);
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              _sectionTitle('Hourly forecast', LucideIcons.clock),
              const Spacer(),
              SegmentedButton<int>(
                showSelectedIcon: false,
                style: ButtonStyle(
                  visualDensity: VisualDensity.compact,
                  textStyle: WidgetStateProperty.all(AtmosTypography.label(fontSize: 11, color: t.text)),
                ),
                segments: const <ButtonSegment<int>>[
                  ButtonSegment<int>(value: 24, label: Text('24h')),
                  ButtonSegment<int>(value: 48, label: Text('48h')),
                ],
                selected: <int>{_hourCount},
                onSelectionChanged: (Set<int> v) => setState(() => _hourCount = v.first),
              ),
            ],
          ),
          const SizedBox(height: 8),
          for (int i = start; i < end; i++) _hourRow(h, i, s),
        ],
      ),
    );
  }

  Widget _hourRow(OmHourly h, int i, AtmosSettings s) {
    final AtmosTokens t = context.atmos;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: <Widget>[
          SizedBox(
            width: 60,
            child: Text(
              fmtHourShort(h.time[i], format: s.timeFormat),
              style: AtmosTypography.label(fontSize: 12, color: t.textMuted),
            ),
          ),
          WeatherEmoji(
            code: h.weatherCode.elementAtOrNull(i) ?? 0,
            isDay: (h.isDay.elementAtOrNull(i) ?? 1) == 1,
            size: 18,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              Wmo.describe(h.weatherCode.elementAtOrNull(i) ?? 0),
              style: AtmosTypography.body(fontSize: 13, color: t.text),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Text('${(h.precipitationProbability.elementAtOrNull(i) ?? 0).round()}%',
              style: AtmosTypography.label(fontSize: 12, color: AtmosColors.coolAccent)),
          const SizedBox(width: 12),
          SizedBox(
            width: 48,
            child: Text(
              displayTempShort(h.temperature2m.elementAtOrNull(i) ?? 0, s.tempUnit),
              textAlign: TextAlign.right,
              style: AtmosTypography.headline(fontSize: 14, fontWeight: FontWeight.w600, color: t.text),
            ),
          ),
        ],
      ),
    );
  }

  Widget _airSection(Map<String, dynamic> air) {
    final Map<String, dynamic>? listFirst =
        (air['list'] is List && (air['list'] as List).isNotEmpty)
            ? (air['list'] as List).first as Map<String, dynamic>
            : null;
    final int aqi = (listFirst?['main']?['aqi'] as num?)?.toInt() ?? -1;
    final Map<String, dynamic>? comp = listFirst?['components'] as Map<String, dynamic>?;
    if (aqi < 0) return const SizedBox.shrink();
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              _sectionTitle('Air quality', LucideIcons.alertTriangle),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: aqiColor(aqi).withOpacity(0.18),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('AQI ${aqiLabel(aqi)}',
                    style: AtmosTypography.label(
                        fontSize: 11, fontWeight: FontWeight.w700, color: aqiColor(aqi))),
              ),
            ],
          ),
          if (comp != null) ...<Widget>[
            const SizedBox(height: 10),
            _metricsGrid(<({IconData icon, String label, String value, Color? color})>[
              (icon: LucideIcons.cloud, label: 'PM2.5', value: '${(comp['pm2_5'] as num?)?.toStringAsFixed(1) ?? '–'} µg', color: null),
              (icon: LucideIcons.cloud, label: 'PM10', value: '${(comp['pm10'] as num?)?.toStringAsFixed(1) ?? '–'} µg', color: null),
              (icon: LucideIcons.flame, label: 'NO₂', value: '${(comp['no2'] as num?)?.toStringAsFixed(1) ?? '–'}', color: null),
              (icon: LucideIcons.sun, label: 'O₃', value: '${(comp['o3'] as num?)?.toStringAsFixed(1) ?? '–'}', color: null),
            ]),
          ],
        ],
      ),
    );
  }

  Widget _atmosphereSection(WeatherSnapshot snap, AtmosSettings s) {
    final OmCurrent c = snap.data.current;
    final OmHourly h = snap.data.hourly;
    final int i = snap.data.nowHourIndex;
    final double dew = h.dewPoint2m.elementAtOrNull(i) ?? 0;
    final double vis = (h.visibility.elementAtOrNull(i) ?? 0) / 1000.0;
    final double uv = h.uvIndex.elementAtOrNull(i) ?? 0;
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          _sectionTitle('Atmosphere', LucideIcons.gauge),
          const SizedBox(height: 10),
          _metricsGrid(<({IconData icon, String label, String value, Color? color})>[
            (icon: LucideIcons.droplets, label: 'Dew point', value: displayTemp(dew, s.tempUnit), color: AtmosColors.coolAccent),
            (icon: LucideIcons.eye, label: 'Visibility', value: '${vis.toStringAsFixed(1)} km', color: null),
            (icon: LucideIcons.sun, label: 'UV', value: '${uv.toStringAsFixed(1)} (${uviLabel(uv)})', color: uviColor(uv)),
            (icon: LucideIcons.gauge, label: 'Pressure', value: '${c.pressureMsl.round()} hPa', color: null),
            (icon: LucideIcons.wind, label: 'Gusts', value: displayWind(c.windGusts10m, s.windUnit), color: null),
            (icon: LucideIcons.compass, label: 'Direction', value: '${windDir16(c.windDirection10m)} ${c.windDirection10m.round()}°', color: null),
          ]),
        ],
      ),
    );
  }

  Widget _sunSection(WeatherSnapshot snap, AtmosSettings s) {
    final AtmosTokens t = context.atmos;
    final OmDaily d = snap.data.daily;
    final String sunrise = d.sunrise.isNotEmpty ? fmtISOTime(d.sunrise.first, format: s.timeFormat) : '–';
    final String sunset = d.sunset.isNotEmpty ? fmtISOTime(d.sunset.first, format: s.timeFormat) : '–';
    final String day = d.daylightDuration.isNotEmpty ? secsToHm(d.daylightDuration.first) : '–';
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          _sectionTitle('Sun', LucideIcons.sun),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: <Widget>[
              _sunCol(LucideIcons.sunrise, 'Sunrise', sunrise, AtmosColors.warmAccent),
              _sunCol(LucideIcons.sunset, 'Sunset', sunset, AtmosColors.heroGradientStart),
              _sunCol(LucideIcons.timer, 'Daylight', day, t.primary),
            ],
          ),
        ],
      ),
    );
  }

  Widget _sunCol(IconData icon, String label, String value, Color color) {
    final AtmosTokens t = context.atmos;
    return Column(
      children: <Widget>[
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 6),
        Text(label, style: AtmosTypography.label(fontSize: 10, color: t.textMuted)),
        Text(value, style: AtmosTypography.headline(fontSize: 14, fontWeight: FontWeight.w600, color: t.text)),
      ],
    );
  }

  Widget _sectionTitle(String title, IconData icon) {
    final AtmosTokens t = context.atmos;
    return Row(
      children: <Widget>[
        Icon(icon, size: 18, color: t.primary),
        const SizedBox(width: 8),
        Text(title,
            style: AtmosTypography.headline(fontSize: 16, fontWeight: FontWeight.w600, color: t.text)),
      ],
    );
  }

  Widget _metricsGrid(List<({IconData icon, String label, String value, Color? color})> metrics) {
    final AtmosTokens t = context.atmos;
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 2.6,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      children: metrics.map((m) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: t.surfaceMid,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: <Widget>[
              Icon(m.icon, size: 18, color: m.color ?? t.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: <Widget>[
                    Text(m.label, style: AtmosTypography.label(fontSize: 10, color: t.textMuted)),
                    Text(m.value,
                        style: AtmosTypography.headline(
                            fontSize: 14, fontWeight: FontWeight.w600, color: t.text),
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

extension _ListSafe<T> on List<T> {
  T? elementAtOrNull(int i) => (i >= 0 && i < length) ? this[i] : null;
}
