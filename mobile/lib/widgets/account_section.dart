import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/dio_client.dart';
import '../state/api_providers.dart';
import '../state/auth_provider.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

class AccountSection extends ConsumerStatefulWidget {
  const AccountSection({super.key});

  @override
  ConsumerState<AccountSection> createState() => _AccountSectionState();
}

class _AccountSectionState extends ConsumerState<AccountSection> {
  String _tier = 'free';
  bool _portalLoading = false;
  String? _loadedForUserId;

  Future<void> _loadTier(String userId) async {
    if (_loadedForUserId == userId) return;
    _loadedForUserId = userId;
    try {
      final Map<String, dynamic>? row = await Supabase.instance.client
          .from('subscriptions')
          .select('tier, status, current_period_end')
          .eq('user_id', userId)
          .maybeSingle();
      if (row == null) return;
      final String tier = row['tier'] as String? ?? 'free';
      final String status = row['status'] as String? ?? 'active';
      final String? endIso = row['current_period_end'] as String?;
      final bool expired = endIso != null && DateTime.parse(endIso).isBefore(DateTime.now());
      if (mounted) {
        setState(() {
          _tier = (tier == 'pro' && status == 'active' && !expired) ? 'pro' : 'free';
        });
      }
    } catch (_) {}
  }

  Future<void> _openPortal() async {
    setState(() => _portalLoading = true);
    try {
      final Dio dio = ref.read(dioProvider);
      final Response<dynamic> res = await dio.post<dynamic>('/api/stripe/portal');
      final String? url = (res.data as Map<String, dynamic>)['url'] as String?;
      if (url != null) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _portalLoading = false);
    }
  }

  Future<void> _openUpgrade() async {
    final Uri url = Uri.parse('${ApiConfig.baseUrl}/pricing');
    await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final bool ready = ref.watch(supabaseReadyProvider);
    if (!ready) return const SizedBox.shrink();

    ref.watch(authStateProvider);
    final User? user = ref.watch(currentUserProvider);

    if (user != null) _loadTier(user.id);

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
                    child: Icon(LucideIcons.user, size: 20, color: t.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Row(
                          children: <Widget>[
                            Expanded(
                              child: Text(
                                user?.email ?? 'Not signed in',
                                style: AtmosTypography.body(fontSize: 14, color: t.text),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (user != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                margin: const EdgeInsets.only(left: 6),
                                decoration: BoxDecoration(
                                  color: _tier == 'pro' ? t.primary : t.surfaceMid,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  _tier.toUpperCase(),
                                  style: AtmosTypography.label(
                                    fontSize: 10,
                                    color: _tier == 'pro' ? Colors.white : t.textMuted,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.6,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user != null
                              ? (_tier == 'pro'
                                  ? 'Pro plan active'
                                  : 'Synced across your devices')
                              : 'Sign in to sync places + chat',
                          style: AtmosTypography.label(fontSize: 11, color: t.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (user == null)
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: t.primary,
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () => context.push('/sign-in'),
                    icon: const Icon(LucideIcons.logIn, size: 16),
                    label: const Text('Sign in or sign up'),
                  ),
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: Column(
                  children: <Widget>[
                    if (_tier == 'free')
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: t.primary,
                            foregroundColor: Colors.white,
                          ),
                          onPressed: _openUpgrade,
                          icon: const Icon(LucideIcons.sparkles, size: 16),
                          label: const Text('Upgrade to Pro'),
                        ),
                      )
                    else
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: t.text,
                            side: BorderSide(color: t.outline),
                          ),
                          onPressed: _portalLoading ? null : _openPortal,
                          icon: _portalLoading
                              ? const SizedBox(
                                  width: 14, height: 14,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : Icon(LucideIcons.creditCard, size: 16, color: t.primary),
                          label: const Text('Manage subscription'),
                        ),
                      ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
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
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
