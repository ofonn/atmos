import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../api/dio_client.dart';
import '../../state/location_provider.dart';
import '../../state/settings_provider.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';
import '../../widgets/account_section.dart';
import '../../widgets/danger_zone.dart';
import '../../widgets/feedback_sheet.dart';
import '../../widgets/usage_bars.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AtmosTokens t = context.atmos;
    final AtmosSettings s = ref.watch(settingsProvider);
    final SettingsNotifier n = ref.read(settingsProvider.notifier);
    final LocationState? loc = ref.watch(locationProvider).valueOrNull;

    return Scaffold(
      backgroundColor: t.bg,
      body: AtmosphericBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
            children: <Widget>[
              Row(
                children: <Widget>[
                  IconButton(icon: Icon(LucideIcons.arrowLeft, color: t.text), onPressed: () => context.go('/')),
                  Text('Settings', style: AtmosTypography.headline(fontSize: 22, fontWeight: FontWeight.w700, color: t.text)),
                ],
              ),
              const SizedBox(height: 8),
              const AccountSection(),
              const UsageBars(),
              _section(context, 'Appearance', <Widget>[
                _row(context, LucideIcons.sun, 'Theme', _segmented<ThemeMode>(
                  context,
                  current: s.themeMode,
                  options: const <(ThemeMode, String)>[
                    (ThemeMode.light, 'Light'),
                    (ThemeMode.dark, 'Dark'),
                    (ThemeMode.system, 'System'),
                  ],
                  onChange: n.setThemeMode,
                )),
              ]),
              _section(context, 'Units', <Widget>[
                _row(context, LucideIcons.thermometer, 'Temperature', _segmented<String>(
                  context,
                  current: s.tempUnit,
                  options: const <(String, String)>[('C', '°C'), ('F', '°F')],
                  onChange: n.setTempUnit,
                )),
                _row(context, LucideIcons.wind, 'Wind speed', _segmented<String>(
                  context,
                  current: s.windUnit,
                  options: const <(String, String)>[('kmh', 'km/h'), ('mph', 'mph')],
                  onChange: n.setWindUnit,
                )),
                _row(context, LucideIcons.clock, 'Time format', _segmented<String>(
                  context,
                  current: s.timeFormat,
                  options: const <(String, String)>[('24h', '24h'), ('12h', '12h')],
                  onChange: n.setTimeFormat,
                )),
              ]),
              _section(context, 'Headline', <Widget>[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: headlineTones.map((({String emoji, String label, String value}) tone) {
                      final bool active = s.headlineTone == tone.value;
                      return GestureDetector(
                        onTap: () => n.setHeadlineTone(tone.value),
                        child: Container(
                          width: (MediaQuery.of(context).size.width - 56) / 4,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: active ? t.primary.withOpacity(0.15) : t.surfaceMid,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: active ? t.primary : Colors.transparent),
                          ),
                          child: Column(
                            children: <Widget>[
                              Text(tone.emoji, style: const TextStyle(fontSize: 20)),
                              const SizedBox(height: 4),
                              Text(tone.label,
                                  style: AtmosTypography.label(
                                      fontSize: 10, color: t.text, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                _toggle(context, 'Two-line hook + punchline', s.headlineTwoLine, n.setHeadlineTwoLine),
                _toggle(context, 'Local flavour', s.headlineLocationFlavor, n.setHeadlineLocationFlavor),
                _toggle(context, 'Time-aware tone', s.headlineTimeAware, n.setHeadlineTimeAware),
              ]),
              _section(context, 'Location', <Widget>[
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Row(
                    children: <Widget>[
                      Icon(LucideIcons.mapPin, color: t.primary, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          loc?.current == null
                              ? 'No location set'
                              : '${loc!.current!.name}${loc.current!.country.isNotEmpty ? ", ${loc.current!.country}" : ""}',
                          style: AtmosTypography.body(fontSize: 14, color: t.text),
                        ),
                      ),
                    ],
                  ),
                ),
                _linkRow(context, LucideIcons.menu, 'Manage saved places', () => context.push('/locations')),
                _linkRow(context, LucideIcons.search, 'Search for a city', () => context.push('/locations')),
                _linkRow(context, LucideIcons.mapPin, 'Use current location',
                    () => ref.read(locationProvider.notifier).syncGps()),
              ]),
              _section(context, 'Background', <Widget>[
                _row(context, LucideIcons.video, 'Weather video', _segmented<String>(
                  context,
                  current: s.videoBackground == 'unset' ? 'off' : s.videoBackground,
                  options: const <(String, String)>[
                    ('off', 'Off'),
                    ('on', 'On'),
                  ],
                  onChange: n.setVideoBackground,
                )),
                if (s.videoBackground == 'on')
                  _row(context, LucideIcons.video, 'Video quality', _segmented<String>(
                    context,
                    current: s.videoBackgroundQuality,
                    options: const <(String, String)>[
                      ('auto', 'Auto'),
                      ('low', 'Low'),
                      ('hd', 'HD'),
                    ],
                    onChange: n.setVideoBackgroundQuality,
                  )),
              ]),
              _section(context, 'AI personality', <Widget>[
                _row(context, LucideIcons.sparkles, 'Emoji use', _segmented<String>(
                  context,
                  current: s.aiEmojiUse,
                  options: const <(String, String)>[
                    ('none', 'None'),
                    ('light', 'Light'),
                    ('heavy', 'Heavy'),
                  ],
                  onChange: n.setAiEmojiUse,
                )),
                _row(context, LucideIcons.sparkles, 'Verbosity', _segmented<String>(
                  context,
                  current: s.aiVerbosity,
                  options: const <(String, String)>[
                    ('short', 'Short'),
                    ('medium', 'Med'),
                    ('long', 'Long'),
                  ],
                  onChange: n.setAiVerbosity,
                )),
                _linkRow(context, LucideIcons.user, 'Edit profile', () => context.push('/profile')),
              ]),
              _section(context, 'Privacy', <Widget>[
                _linkRow(context, LucideIcons.fileText, 'Privacy policy', () async {
                  await launchUrl(
                    Uri.parse('${ApiConfig.baseUrl}/privacy'),
                    mode: LaunchMode.externalApplication,
                  );
                }),
                _linkRow(context, LucideIcons.shield, 'Security', () => context.push('/security')),
                _linkRow(context, LucideIcons.key, 'Permissions', () => context.push('/permissions')),
                _linkRow(context, LucideIcons.activity, 'Status & diagnostics', () => context.push('/status')),
                _linkRow(context, LucideIcons.refreshCw, 'Replay onboarding', () {
                  n.setOnboardingComplete(false);
                  context.go('/');
                }),
                _linkRow(context, LucideIcons.rotateCcw, 'Reset settings', () {
                  showDialog<void>(
                    context: context,
                    builder: (BuildContext ctx) => AlertDialog(
                      title: const Text('Reset settings?'),
                      content: const Text(
                        'Your saved cities, chat history, and account stay. '
                        "Only theme / units / AI personality go back to defaults.",
                      ),
                      actions: <Widget>[
                        TextButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            child: const Text('Cancel')),
                        TextButton(
                          onPressed: () {
                            n.resetToDefaults();
                            Navigator.of(ctx).pop();
                          },
                          child: const Text('Reset'),
                        ),
                      ],
                    ),
                  );
                }),
              ]),
              const DangerZone(),
              _section(context, 'Feedback', <Widget>[
                _linkRow(context, LucideIcons.star, 'Rate Atmos', () async {
                  await launchUrl(
                    Uri.parse('https://github.com/ofonn/atmos'),
                    mode: LaunchMode.externalApplication,
                  );
                }),
                _linkRow(context, LucideIcons.messageSquareWarning, 'Report issue', () {
                  FeedbackSheet.show(context, initial: FeedbackCategory.bug);
                }),
                _linkRow(context, LucideIcons.sparkles, 'Send AI feedback', () {
                  FeedbackSheet.show(context, initial: FeedbackCategory.ai);
                }),
              ]),
              _section(context, 'About', <Widget>[
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text('Atmos',
                          style: AtmosTypography.headline(
                              fontSize: 16, fontWeight: FontWeight.w700, color: t.text)),
                      const SizedBox(height: 2),
                      Text('Version 1.0.0',
                          style: AtmosTypography.label(fontSize: 11, color: t.textMuted)),
                      const SizedBox(height: 8),
                      Text('Data by Open-Meteo · OpenStreetMap · Google Gemini',
                          style: AtmosTypography.label(fontSize: 11, color: t.textMuted)),
                    ],
                  ),
                ),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _section(BuildContext context, String title, List<Widget> children) {
    final AtmosTokens t = context.atmos;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: t.outline.withOpacity(0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
              child: Text(title.toUpperCase(),
                  style: AtmosTypography.label(
                      fontSize: 11, color: t.textMuted, letterSpacing: 1.4, fontWeight: FontWeight.w700)),
            ),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _row(BuildContext context, IconData icon, String label, Widget trailing) {
    final AtmosTokens t = context.atmos;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Row(
        children: <Widget>[
          Icon(icon, size: 18, color: t.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(label,
                style: AtmosTypography.body(fontSize: 14, color: t.text)),
          ),
          trailing,
        ],
      ),
    );
  }

  Widget _toggle(BuildContext context, String label, bool value, void Function(bool) onChange) {
    final AtmosTokens t = context.atmos;
    return SwitchListTile.adaptive(
      title: Text(label, style: AtmosTypography.body(fontSize: 14, color: t.text)),
      value: value,
      onChanged: onChange,
      activeColor: t.primary,
    );
  }

  Widget _linkRow(BuildContext context, IconData icon, String label, VoidCallback onTap) {
    final AtmosTokens t = context.atmos;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        child: Row(
          children: <Widget>[
            Icon(icon, size: 18, color: t.text),
            const SizedBox(width: 10),
            Expanded(child: Text(label, style: AtmosTypography.body(fontSize: 14, color: t.text))),
            Icon(LucideIcons.chevronRight, size: 18, color: t.textMuted),
          ],
        ),
      ),
    );
  }

  Widget _segmented<T>(
    BuildContext context, {
    required T current,
    required List<(T, String)> options,
    required void Function(T) onChange,
  }) {
    final AtmosTokens t = context.atmos;
    return Container(
      decoration: BoxDecoration(
        color: t.surfaceMid,
        borderRadius: BorderRadius.circular(40),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: options.map(((T, String) opt) {
          final bool active = opt.$1 == current;
          return GestureDetector(
            onTap: () => onChange(opt.$1),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: active ? t.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(40),
              ),
              child: Text(
                opt.$2,
                style: AtmosTypography.label(
                    fontSize: 11,
                    color: active ? Colors.white : t.text,
                    fontWeight: FontWeight.w700),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
