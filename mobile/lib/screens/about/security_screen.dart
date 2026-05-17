import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

/// Static "How Atmos protects you" page. Linked from Settings → About.
class SecurityScreen extends StatelessWidget {
  const SecurityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Scaffold(
      backgroundColor: t.bg,
      appBar: AppBar(title: const Text('Security')),
      body: AtmosphericBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
            children: <Widget>[
              _bullet(t, LucideIcons.shield,
                  'Play Integrity',
                  "Each API call from this app carries a one-time Google-signed token proving the APK is genuine and the device hasn't been tampered with."),
              _bullet(t, LucideIcons.lock,
                  'Row-Level Security',
                  'Every database table enforces auth.uid() = user_id. The server cannot accidentally return another user’s data.'),
              _bullet(t, LucideIcons.cookie,
                  'Cookie-less analytics',
                  "We don't track you across sites. No third-party trackers, no ad SDKs."),
              _bullet(t, LucideIcons.cloudOff,
                  'Local-first',
                  "Settings + saved cities live in shared_preferences. Cloud sync only happens when you sign in, and never to anyone else."),
              _bullet(t, LucideIcons.creditCard,
                  'Payments via Stripe',
                  "We never see your card. Stripe holds the credentials and only tells us your subscription status."),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: t.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: t.outline.withOpacity(0.5)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text('Found a security issue?',
                        style: AtmosTypography.body(
                            fontSize: 14, color: t.text, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(
                      'Email security@atmos.example.com or open a private GitHub security advisory.',
                      style: AtmosTypography.label(fontSize: 12, color: t.textMuted),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _bullet(AtmosTokens t, IconData icon, String title, String body) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: t.outline.withOpacity(0.5)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Icon(icon, size: 20, color: t.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(title,
                      style: AtmosTypography.body(
                          fontSize: 14, color: t.text, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(body,
                      style: AtmosTypography.label(fontSize: 12, color: t.textMuted, height: 1.45)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
