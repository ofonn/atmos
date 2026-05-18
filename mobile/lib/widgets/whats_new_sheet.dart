import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../state/storage.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

/// One-time "what's new in this release" bottom sheet. Mirrors web
/// `WhatsNew`. Bumping `_version` will make every user see it again
/// once. Stored per-device in SharedPreferences — no cloud-sync.
const String _version = '2026.05.17';
const List<({String emoji, String line})> _highlights =
    <({String emoji, String line})>[
  (emoji: '🎬', line: 'Optional weather-adaptive video backgrounds'),
  (emoji: '🧳', line: 'Trip planner with AI packing list'),
  (emoji: '👕', line: 'AI outfit advice on the home screen'),
  (emoji: '☁️', line: 'Cross-device sync with the web app'),
  (emoji: '🏠', line: 'Home / Work tags for quick weather switch'),
  (emoji: '✨', line: 'AI personality picker — emoji + verbosity'),
];

class WhatsNewSheet {
  WhatsNewSheet._();

  static String _keyFor(String v) => 'atmos_whatsnew_seen_$v';

  /// Call from the home screen's post-frame callback. Skips if already
  /// seen this version OR if onboarding is in progress.
  static Future<void> maybeShow(BuildContext context, WidgetRef ref) async {
    final SharedPreferences prefs = ref.read(sharedPrefsProvider);
    if (prefs.getBool(_keyFor(_version)) == true) return;

    // Defer slightly so the onboarding sheet (if showing) wins first
    // paint — the bottom-sheet stack would otherwise stack two modals.
    await Future<void>.delayed(const Duration(milliseconds: 1500));
    if (!context.mounted) return;

    // If something else is currently a top route, skip — the WhatsNew
    // is non-critical.
    final NavigatorState? nav = Navigator.maybeOf(context);
    if (nav == null) return;

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: false,
      builder: (BuildContext ctx) => const _WhatsNewBody(),
    );
    await prefs.setBool(_keyFor(_version), true);
  }
}

class _WhatsNewBody extends StatelessWidget {
  const _WhatsNewBody();

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Container(
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: t.outline.withOpacity(0.5)),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Center(
              child: Container(
                width: 40,
                height: 5,
                margin: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(
                  color: t.textMuted.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(40),
                ),
              ),
            ),
            Row(
              children: <Widget>[
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: t.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text("What's new in Atmos",
                      style: AtmosTypography.headline(
                          fontSize: 20, fontWeight: FontWeight.w700, color: t.text)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            for (final ({String emoji, String line}) h in _highlights)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: <Widget>[
                    Text(h.emoji, style: const TextStyle(fontSize: 16)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(h.line,
                          style: AtmosTypography.body(fontSize: 13, color: t.textMuted)),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                    backgroundColor: t.primary, foregroundColor: Colors.white),
                onPressed: () => Navigator.maybeOf(context)?.maybePop(),
                child: const Text('Got it'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
