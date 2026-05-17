import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../state/api_providers.dart';
import '../state/auth_provider.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

/// Permanently delete the signed-in user's account. Hidden when
/// Supabase isn't configured or no user is signed in. Requires the
/// user to type DELETE to confirm.
class DangerZone extends ConsumerStatefulWidget {
  const DangerZone({super.key});

  @override
  ConsumerState<DangerZone> createState() => _DangerZoneState();
}

class _DangerZoneState extends ConsumerState<DangerZone> {
  bool _confirming = false;
  bool _loading = false;
  String? _error;
  final TextEditingController _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _delete() async {
    if (_ctrl.text != 'DELETE') {
      setState(() => _error = 'Type DELETE to confirm.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final Dio dio = ref.read(dioProvider);
      await dio.post<dynamic>('/api/account/delete');
      await Supabase.instance.client.auth.signOut();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Account deleted.')),
        );
        Navigator.of(context).popUntil((Route<dynamic> r) => r.isFirst);
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final bool ready = ref.watch(supabaseReadyProvider);
    final User? user = ref.watch(currentUserProvider);
    if (!ready || user == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.6)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
              child: Text(
                'DANGER ZONE',
                style: AtmosTypography.label(
                  fontSize: 11,
                  color: const Color(0xFFEF4444),
                  letterSpacing: 1.4,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            if (!_confirming)
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                    side: BorderSide(color: t.outline.withOpacity(0.5)),
                  ),
                  onPressed: () => setState(() => _confirming = true),
                  icon: const Icon(LucideIcons.trash2, size: 16),
                  label: const Text('Delete my account'),
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    Text(
                      'Permanent. Saved cities, chat history, settings, and subscription are erased.',
                      style: AtmosTypography.label(fontSize: 12, color: t.textMuted),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _ctrl,
                      decoration: const InputDecoration(hintText: 'Type DELETE'),
                      onChanged: (_) => setState(() => _error = null),
                    ),
                    if (_error != null) ...<Widget>[
                      const SizedBox(height: 6),
                      Text(_error!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                    ],
                    const SizedBox(height: 10),
                    Row(
                      children: <Widget>[
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _loading
                                ? null
                                : () {
                                    setState(() {
                                      _confirming = false;
                                      _ctrl.clear();
                                      _error = null;
                                    });
                                  },
                            child: const Text('Cancel'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FilledButton.icon(
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFFEF4444),
                              foregroundColor: Colors.white,
                            ),
                            onPressed:
                                _loading || _ctrl.text != 'DELETE' ? null : _delete,
                            icon: _loading
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2, color: Colors.white),
                                  )
                                : const Icon(LucideIcons.trash2, size: 14),
                            label: const Text('Delete'),
                          ),
                        ),
                      ],
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
