import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../state/auth_provider.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

/// Account card for the Settings screen. Shows current user email + a
/// Sign-out button when signed in, or a Sign-in CTA when signed out.
/// Renders null when Supabase isn't configured (no env vars).
class AccountSection extends ConsumerWidget {
  const AccountSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AtmosTokens t = context.atmos;
    final bool ready = ref.watch(supabaseReadyProvider);
    if (!ready) return const SizedBox.shrink();

    // Watch auth changes so the card re-renders on sign-in / out.
    ref.watch(authStateProvider);
    final User? user = ref.watch(currentUserProvider);

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
              child: Text(
                'ACCOUNT',
                style: AtmosTypography.label(
                  fontSize: 11,
                  color: t.textMuted,
                  letterSpacing: 1.4,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              child: Row(
                children: <Widget>[
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: t.surfaceMid,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Icon(
                      LucideIcons.user,
                      size: 20,
                      color: t.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          user?.email ?? 'Not signed in',
                          style: AtmosTypography.body(
                              fontSize: 14, color: t.text),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user != null
                              ? 'Synced across your devices'
                              : 'Sign in to sync places + chat',
                          style: AtmosTypography.label(
                              fontSize: 11, color: t.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: SizedBox(
                width: double.infinity,
                child: user == null
                    ? FilledButton.icon(
                        style: FilledButton.styleFrom(
                          backgroundColor: t.primary,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () => context.push('/sign-in'),
                        icon: const Icon(LucideIcons.logIn, size: 16),
                        label: const Text('Sign in or sign up'),
                      )
                    : OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: t.text,
                          side: BorderSide(color: t.outline),
                        ),
                        onPressed: () async {
                          await Supabase.instance.client.auth.signOut();
                        },
                        icon: const Icon(LucideIcons.logOut, size: 16),
                        label: const Text('Sign out'),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
