import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../state/settings_provider.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

/// One-time onboarding bottom sheet. Pushed once when
/// `settings.onboardingComplete` is false. Asks the two questions
/// that don't already have a system dialog: the video-background
/// opt-in + a primer for the location permission.
class OnboardingSheet extends ConsumerStatefulWidget {
  const OnboardingSheet({super.key});

  @override
  ConsumerState<OnboardingSheet> createState() => _OnboardingSheetState();

  /// Convenience to show the sheet from a parent screen. Skips if the
  /// user has already onboarded.
  static Future<void> maybeShow(BuildContext context, WidgetRef ref) async {
    final AtmosSettings s = ref.read(settingsProvider);
    if (s.onboardingComplete) return;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (BuildContext ctx) => const OnboardingSheet(),
    );
  }
}

enum _Step { welcome, video, permission }

class _OnboardingSheetState extends ConsumerState<OnboardingSheet> {
  _Step _step = _Step.welcome;

  void _finish() {
    ref.read(settingsProvider.notifier).setOnboardingComplete(true);
    Navigator.of(context).maybePop();
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Container(
      margin: const EdgeInsets.only(top: 80),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        border: Border.all(color: t.outline.withOpacity(0.5)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Container(
              width: 40,
              height: 5,
              margin: const EdgeInsets.only(bottom: 24),
              decoration: BoxDecoration(
                color: t.textMuted.withOpacity(0.3),
                borderRadius: BorderRadius.circular(40),
              ),
            ),
            switch (_step) {
              _Step.welcome => _Welcome(onNext: () => setState(() => _step = _Step.video)),
              _Step.video => _Video(
                  onChoose: (String choice) {
                    ref.read(settingsProvider.notifier).setVideoBackground(choice);
                    setState(() => _step = _Step.permission);
                  },
                ),
              _Step.permission => _Permission(onDone: _finish),
            },
          ],
        ),
      ),
    );
  }
}

class _Welcome extends StatelessWidget {
  const _Welcome({required this.onNext});
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Column(
      children: <Widget>[
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(color: t.primary, borderRadius: BorderRadius.circular(20)),
          child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 32),
        ),
        const SizedBox(height: 16),
        Text('Welcome to Atmos',
            style: AtmosTypography.headline(
                fontSize: 26, fontWeight: FontWeight.w800, color: t.text)),
        const SizedBox(height: 8),
        Text(
          "Your AI weather companion. A couple of quick choices and you're in.",
          textAlign: TextAlign.center,
          style: AtmosTypography.body(fontSize: 14, color: t.textMuted),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
                backgroundColor: t.primary, foregroundColor: Colors.white),
            onPressed: onNext,
            icon: const Icon(LucideIcons.arrowRight, size: 16),
            label: const Text('Get started'),
          ),
        ),
      ],
    );
  }
}

class _Video extends StatelessWidget {
  const _Video({required this.onChoose});
  final void Function(String choice) onChoose;

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          children: <Widget>[
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(color: t.surfaceMid, borderRadius: BorderRadius.circular(14)),
              child: Icon(LucideIcons.cloudRain, color: t.primary, size: 26),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Animated weather background?',
                style: AtmosTypography.headline(
                    fontSize: 20, fontWeight: FontWeight.w700, color: t.text),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          "The home screen can play a short video that matches the weather — rain on leaves when it's raining, snow falling, etc. Looks great but uses more battery and data.",
          style: AtmosTypography.body(fontSize: 13, color: t.textMuted),
        ),
        const SizedBox(height: 20),
        Row(
          children: <Widget>[
            Expanded(
              child: FilledButton(
                style: FilledButton.styleFrom(
                    backgroundColor: t.primary, foregroundColor: Colors.white),
                onPressed: () => onChoose('on'),
                child: const Text('Yes, enable'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: t.text,
                  side: BorderSide(color: t.outline),
                ),
                onPressed: () => onChoose('off'),
                child: const Text('No, default'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Center(
          child: Text(
            'You can change this any time in Settings.',
            style: AtmosTypography.label(fontSize: 11, color: t.textMuted),
          ),
        ),
      ],
    );
  }
}

class _Permission extends StatelessWidget {
  const _Permission({required this.onDone});
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Row(
          children: <Widget>[
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(color: t.surfaceMid, borderRadius: BorderRadius.circular(14)),
              child: Icon(LucideIcons.mapPin, color: t.primary, size: 26),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Allow location?',
                style: AtmosTypography.headline(
                    fontSize: 20, fontWeight: FontWeight.w700, color: t.text),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          'Atmos uses your location only to show the forecast for where you are. We never share it. You can deny and search for a city by name instead.',
          style: AtmosTypography.body(fontSize: 13, color: t.textMuted),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: t.primary, foregroundColor: Colors.white),
            onPressed: onDone,
            child: const Text('Got it'),
          ),
        ),
        const SizedBox(height: 10),
        Center(
          child: Text(
            "Android will ask for the permission itself next.",
            style: AtmosTypography.label(fontSize: 11, color: t.textMuted),
          ),
        ),
      ],
    );
  }
}
