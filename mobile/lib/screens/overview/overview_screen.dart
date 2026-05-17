import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../api/models/open_meteo.dart';
import '../../state/ai_content_provider.dart';
import '../../state/settings_provider.dart';
import '../../state/weather_provider.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/glass.dart';
import '../../theme/typography.dart';
import '../../utils/formatters.dart';
import '../../utils/weather_codes.dart';
import '../../widgets/meteo_icon.dart';

class OverviewScreen extends ConsumerWidget {
  const OverviewScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AtmosTokens t = context.atmos;
    final AtmosSettings settings = ref.watch(settingsProvider);
    final AsyncValue<WeatherSnapshot?> async = ref.watch(weatherProvider);
    final WeatherSnapshot? snap = async.valueOrNull;
    final AsyncValue<dynamic> aiAsync = ref.watch(aiContentProvider);

    return Scaffold(
      backgroundColor: t.bg,
      body: AtmosphericBackground(
        child: SafeArea(
          child: snap == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
                  children: <Widget>[
                    _topBar(context, snap),
                    const SizedBox(height: 12),
                    _featuredCard(context, snap.data.daily, settings),
                    const SizedBox(height: 12),
                    _weekSummary(context, aiAsync.valueOrNull),
                    const SizedBox(height: 12),
                    _planCta(context),
                    const SizedBox(height: 16),
                    Text('Next 7 days',
                        style: AtmosTypography.headline(
                            fontSize: 16, fontWeight: FontWeight.w700, color: t.text)),
                    const SizedBox(height: 8),
                    for (int i = 0; i < snap.data.daily.time.length && i < 7; i++)
                      _dayRow(context, snap.data.daily, i, settings),
                    const SizedBox(height: 20),
                    Text('16-day outlook',
                        style: AtmosTypography.headline(
                            fontSize: 16, fontWeight: FontWeight.w700, color: t.text)),
                    const SizedBox(height: 8),
                    for (int i = 7; i < snap.data.daily.time.length; i++)
                      _dayRow(context, snap.data.daily, i, settings),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _topBar(BuildContext context, WeatherSnapshot snap) {
    final AtmosTokens t = context.atmos;
    return Row(
      children: <Widget>[
        IconButton(icon: Icon(LucideIcons.arrowLeft, color: t.text), onPressed: () => context.go('/')),
        Text('Outlook', style: AtmosTypography.headline(fontSize: 20, fontWeight: FontWeight.w700, color: t.text)),
        const Spacer(),
        Text(snap.location.name, style: AtmosTypography.label(fontSize: 11, color: t.textMuted)),
      ],
    );
  }

  Widget _featuredCard(BuildContext context, OmDaily d, AtmosSettings s) {
    final AtmosTokens t = context.atmos;
    if (d.time.length < 2) return const SizedBox.shrink();
    final int idx = 1; // tomorrow
    final int code = d.weatherCode.elementAtOrNull(idx) ?? 0;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[t.surface, t.surface.withOpacity(0.6)],
        ),
        border: Border.all(color: t.primary.withOpacity(0.2)),
      ),
      child: Stack(
        children: <Widget>[
          Positioned(
            right: -10,
            top: -10,
            child: Opacity(opacity: 0.3, child: Text(Wmo.emoji(code), style: const TextStyle(fontSize: 90))),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text('Tomorrow',
                  style: AtmosTypography.label(
                      fontSize: 11, color: t.primary, fontWeight: FontWeight.w700, letterSpacing: 1.4)),
              const SizedBox(height: 4),
              Text(fmtFullDate(d.time[idx]),
                  style: AtmosTypography.headline(fontSize: 22, fontWeight: FontWeight.w700, color: t.text)),
              const SizedBox(height: 6),
              Text(Wmo.describe(code),
                  style: AtmosTypography.body(fontSize: 14, color: t.textMuted)),
              const SizedBox(height: 14),
              Row(
                children: <Widget>[
                  Text(
                    '${displayTempShort(d.temperature2mMax.elementAtOrNull(idx) ?? 0, s.tempUnit)} / '
                    '${displayTempShort(d.temperature2mMin.elementAtOrNull(idx) ?? 0, s.tempUnit)}',
                    style: AtmosTypography.headline(fontSize: 28, fontWeight: FontWeight.w800, color: t.text),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '${(d.precipitationProbabilityMax.elementAtOrNull(idx) ?? 0).round()}% rain',
                    style: AtmosTypography.label(fontSize: 11, color: AtmosColors.coolAccent),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _weekSummary(BuildContext context, dynamic ai) {
    if (ai == null) return const SizedBox.shrink();
    final String summary = ai.weekSummary as String? ?? '';
    if (summary.isEmpty) return const SizedBox.shrink();
    final AtmosTokens t = context.atmos;
    return SurfaceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(children: <Widget>[
            Icon(LucideIcons.sparkles, size: 16, color: t.primary),
            const SizedBox(width: 6),
            Text('AI week summary',
                style: AtmosTypography.label(fontSize: 11, color: t.primary, letterSpacing: 1.4)),
          ]),
          const SizedBox(height: 8),
          Text(summary,
              style: AtmosTypography.body(fontSize: 14, color: t.text, height: 1.5)),
        ],
      ),
    );
  }

  Widget _planCta(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return GestureDetector(
      onTap: () => context.push('/chat'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: t.primary.withOpacity(0.25)),
        ),
        child: Row(
          children: <Widget>[
            Icon(LucideIcons.calendarClock, color: t.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text('Plan your week',
                      style: AtmosTypography.headline(fontSize: 14, fontWeight: FontWeight.w700, color: t.text)),
                  Text('Tap to ask Atmos when to do what',
                      style: AtmosTypography.body(fontSize: 12, color: t.textMuted)),
                ],
              ),
            ),
            Icon(LucideIcons.arrowRight, color: t.primary),
          ],
        ),
      ),
    );
  }

  Widget _dayRow(BuildContext context, OmDaily d, int i, AtmosSettings s) {
    final AtmosTokens t = context.atmos;
    final int code = d.weatherCode.elementAtOrNull(i) ?? 0;
    final double min = d.temperature2mMin.elementAtOrNull(i) ?? 0;
    final double max = d.temperature2mMax.elementAtOrNull(i) ?? 0;
    final double pop = d.precipitationProbabilityMax.elementAtOrNull(i) ?? 0;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: <Widget>[
          SizedBox(
            width: 56,
            child: Text(i == 0 ? 'Today' : fmtDayShort(d.time[i]),
                style: AtmosTypography.label(fontSize: 12, color: t.text)),
          ),
          WeatherEmoji(code: code, isDay: true, size: 22),
          const SizedBox(width: 8),
          Text('${pop.round()}%',
              style: AtmosTypography.label(fontSize: 11, color: AtmosColors.coolAccent)),
          const SizedBox(width: 12),
          Expanded(
            child: Stack(
              alignment: Alignment.center,
              children: <Widget>[
                Container(
                  height: 6,
                  decoration: BoxDecoration(
                    color: t.surfaceMid,
                    borderRadius: BorderRadius.circular(40),
                  ),
                ),
                LayoutBuilder(
                  builder: (BuildContext _, BoxConstraints c) {
                    final double minBound = -10, maxBound = 40;
                    final double left = ((min - minBound) / (maxBound - minBound)).clamp(0.0, 1.0);
                    final double right = ((max - minBound) / (maxBound - minBound)).clamp(0.0, 1.0);
                    return Padding(
                      padding: EdgeInsets.only(
                        left: left * c.maxWidth,
                        right: (1 - right) * c.maxWidth,
                      ),
                      child: Container(
                        height: 6,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: <Color>[AtmosColors.coolAccent, AtmosColors.warmAccent],
                          ),
                          borderRadius: BorderRadius.circular(40),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 76,
            child: Text(
              '${displayTempShort(min, s.tempUnit)} / ${displayTempShort(max, s.tempUnit)}',
              textAlign: TextAlign.right,
              style: AtmosTypography.headline(fontSize: 12, fontWeight: FontWeight.w600, color: t.text),
            ),
          ),
        ],
      ),
    );
  }
}

extension _ListSafe<T> on List<T> {
  T? elementAtOrNull(int i) => (i >= 0 && i < length) ? this[i] : null;
}
