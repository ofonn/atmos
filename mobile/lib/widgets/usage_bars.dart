import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../state/api_providers.dart';
import '../state/auth_provider.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

const Map<String, String> _label = <String, String>{
  'chat': 'Chat',
  'headline': 'Headlines',
  'insight': 'Insights',
  'outfit': 'Outfit AI',
  'activity': 'Activity AI',
  'trip': 'Trip plans',
};

class UsageBars extends ConsumerStatefulWidget {
  const UsageBars({super.key});

  @override
  ConsumerState<UsageBars> createState() => _UsageBarsState();
}

class _UsageBarsState extends ConsumerState<UsageBars> {
  Map<String, dynamic>? _data;
  String? _loadedFor;

  Future<void> _load(String userId) async {
    if (_loadedFor == userId) return;
    _loadedFor = userId;
    try {
      final Dio dio = ref.read(dioProvider);
      final Response<dynamic> res = await dio.get<dynamic>('/api/me');
      if (mounted) setState(() => _data = res.data as Map<String, dynamic>);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final bool ready = ref.watch(supabaseReadyProvider);
    if (!ready) return const SizedBox.shrink();
    ref.watch(authStateProvider);
    final user = ref.watch(currentUserProvider);
    if (user == null) return const SizedBox.shrink();
    _load(user.id);
    if (_data == null) return const SizedBox.shrink();

    final Map<String, dynamic> limits = (_data!['limits'] as Map<String, dynamic>?) ?? <String, dynamic>{};
    final Map<String, dynamic> usage = (_data!['usageToday'] as Map<String, dynamic>?) ?? <String, dynamic>{};
    final List<MapEntry<String, dynamic>> entries =
        limits.entries.where((MapEntry<String, dynamic> e) => (e.value as num).isFinite).toList();
    if (entries.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: t.outline.withOpacity(0.5)),
        ),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Text("TODAY'S USAGE",
                    style: AtmosTypography.label(
                        fontSize: 11, color: t.textMuted, letterSpacing: 1.4, fontWeight: FontWeight.w700)),
                const Spacer(),
                Icon(LucideIcons.activity, size: 14, color: t.primary),
              ],
            ),
            const SizedBox(height: 12),
            ...entries.map((MapEntry<String, dynamic> e) {
              final int limit = (e.value as num).toInt();
              final int used = (usage[e.key] as num?)?.toInt() ?? 0;
              final double pct = limit == 0 ? 0 : (used / limit).clamp(0.0, 1.0);
              final Color color = pct >= 0.8
                  ? const Color(0xFFEF4444)
                  : pct >= 0.5
                      ? const Color(0xFFF97316)
                      : t.primary;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Text(_label[e.key] ?? e.key,
                            style: AtmosTypography.body(fontSize: 12, color: t.text)),
                        const Spacer(),
                        Text('$used / $limit',
                            style: AtmosTypography.label(fontSize: 11, color: t.textMuted)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(2),
                      child: LinearProgressIndicator(
                        value: pct,
                        minHeight: 4,
                        backgroundColor: t.surfaceMid,
                        color: color,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
