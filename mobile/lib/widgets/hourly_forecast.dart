import 'package:flutter/material.dart';

import '../api/models/open_meteo.dart';
import '../state/settings_provider.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';
import '../utils/formatters.dart';
import 'meteo_icon.dart';

class HourlyForecast extends StatelessWidget {
  const HourlyForecast({
    super.key,
    required this.hourly,
    required this.startIndex,
    required this.count,
    required this.settings,
  });

  final OmHourly hourly;
  final int startIndex;
  final int count;
  final AtmosSettings settings;

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final int end = (startIndex + count).clamp(0, hourly.time.length);
    return SizedBox(
      height: 110,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 4),
        itemCount: end - startIndex,
        separatorBuilder: (BuildContext _, int __) => const SizedBox(width: 8),
        itemBuilder: (BuildContext context, int i) {
          final int idx = startIndex + i;
          final bool isNow = i == 0;
          final int code = hourly.weatherCode.elementAtOrNull(idx) ?? 0;
          final bool isDay = (hourly.isDay.elementAtOrNull(idx) ?? 1) == 1;
          final double temp = hourly.temperature2m.elementAtOrNull(idx) ?? 0;
          final double pop = hourly.precipitationProbability.elementAtOrNull(idx) ?? 0;
          return Container(
            width: 64,
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              gradient: isNow ? AtmosColors.heroGradient : null,
              color: isNow ? null : t.surface,
              border: isNow
                  ? null
                  : Border.all(color: t.outline.withOpacity(0.5), width: 0.5),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Text(
                  isNow ? 'Now' : fmtHourShort(hourly.time[idx], format: settings.timeFormat),
                  style: AtmosTypography.label(
                    fontSize: 10,
                    color: isNow ? Colors.white : t.textMuted,
                  ),
                ),
                WeatherEmoji(code: code, isDay: isDay, size: 24),
                Text(
                  displayTempShort(temp, settings.tempUnit),
                  style: AtmosTypography.headline(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: isNow ? Colors.white : t.text,
                  ),
                ),
                Text(
                  '${pop.round()}%',
                  style: AtmosTypography.label(
                    fontSize: 9,
                    color: isNow
                        ? Colors.white.withOpacity(0.85)
                        : AtmosColors.coolAccent,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

extension _ListSafe<T> on List<T> {
  T? elementAtOrNull(int i) => (i >= 0 && i < length) ? this[i] : null;
}
