import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../state/ai_content_provider.dart';
import '../../state/location_provider.dart';
import '../../state/weather_provider.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';
import '../../utils/weather_codes.dart';

class InsightScreen extends ConsumerWidget {
  const InsightScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AtmosTokens t = context.atmos;
    final AsyncValue<dynamic> aiAsync = ref.watch(aiContentProvider);
    final WeatherSnapshot? snap = ref.watch(weatherProvider).valueOrNull;
    final LocationState? loc = ref.watch(locationProvider).valueOrNull;

    return Scaffold(
      backgroundColor: t.bg,
      body: AtmosphericBackground(
        child: SafeArea(
          child: Column(
            children: <Widget>[
              Row(
                children: <Widget>[
                  IconButton(icon: Icon(LucideIcons.arrowLeft, color: t.text), onPressed: () => context.go('/')),
                  Text('Daily briefing',
                      style: AtmosTypography.headline(fontSize: 20, fontWeight: FontWeight.w700, color: t.text)),
                  const Spacer(),
                  if (loc?.current != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: t.surface,
                          borderRadius: BorderRadius.circular(40),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            Icon(LucideIcons.mapPin, size: 12, color: t.primary),
                            const SizedBox(width: 4),
                            Text(loc!.current!.name,
                                style: AtmosTypography.label(fontSize: 11, color: t.text)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
              Expanded(
                child: aiAsync.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : aiAsync.hasError || aiAsync.valueOrNull == null
                        ? Center(
                            child: Text('Couldn\'t fetch your briefing.',
                                style: AtmosTypography.body(color: t.textMuted)),
                          )
                        : _content(context, aiAsync.value, snap),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _content(BuildContext context, dynamic ai, WeatherSnapshot? snap) {
    final AtmosTokens t = context.atmos;
    final String emoji = snap == null
        ? '☀️'
        : Wmo.emoji(snap.data.current.weatherCode, isDay: snap.data.current.isDay == 1);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: <Widget>[
        Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: <Color>[t.surface, t.bg],
            ),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: t.primary.withOpacity(0.2)),
          ),
          child: Stack(
            children: <Widget>[
              Positioned(
                right: -10,
                bottom: -20,
                child: Opacity(
                  opacity: 0.3,
                  child: Text(emoji, style: const TextStyle(fontSize: 120)),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(children: <Widget>[
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: t.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 14),
                    ),
                    const SizedBox(width: 8),
                    Text("Here's the plan",
                        style: AtmosTypography.label(
                            fontSize: 11, color: t.primary, letterSpacing: 1.5, fontWeight: FontWeight.w700)),
                  ]),
                  const SizedBox(height: 16),
                  Text(ai.headline as String,
                      style: AtmosTypography.headline(
                          fontSize: 26, fontWeight: FontWeight.w700, color: t.text, height: 1.15)),
                  const SizedBox(height: 12),
                  Text(ai.proactiveInsight as String? ?? ai.advice as String,
                      style: AtmosTypography.body(fontSize: 15, color: t.textMuted, height: 1.55)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: <Widget>[
            Expanded(child: _smallCard(context, LucideIcons.shirt, 'Outfit check', ai.outfit as String? ?? '')),
            const SizedBox(width: 12),
            Expanded(child: _smallCard(context, LucideIcons.calendarClock, 'Activity timing', ai.activity as String? ?? '')),
          ],
        ),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: () => context.push('/chat'),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: t.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: t.primary.withOpacity(0.25)),
            ),
            child: Row(children: <Widget>[
              Icon(LucideIcons.messageCircle, color: t.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Text('Have more questions? Ask Atmos.',
                    style: AtmosTypography.body(fontSize: 14, color: t.text, fontWeight: FontWeight.w600)),
              ),
              Icon(LucideIcons.arrowRight, color: t.primary),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _smallCard(BuildContext context, IconData icon, String title, String body) {
    final AtmosTokens t = context.atmos;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: t.outline.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: t.surfaceMid, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 16, color: t.primary),
          ),
          const SizedBox(height: 8),
          Text(title,
              style: AtmosTypography.label(
                  fontSize: 11, color: t.textMuted, fontWeight: FontWeight.w700, letterSpacing: 1.2)),
          const SizedBox(height: 4),
          Text(body.isEmpty ? '—' : body,
              style: AtmosTypography.body(fontSize: 13, color: t.text, height: 1.45)),
        ],
      ),
    );
  }
}
