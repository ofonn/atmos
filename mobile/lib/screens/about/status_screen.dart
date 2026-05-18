import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../state/api_providers.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

/// Native status / diagnostics screen — mirrors the web `/status`
/// page. Calls `/api/health` and `/api/health/sync` and renders the
/// result, including per-table row counts (proves cross-device
/// sync since the SAME numbers show up on the web equivalent for
/// the same signed-in user).
class StatusScreen extends ConsumerStatefulWidget {
  const StatusScreen({super.key});

  @override
  ConsumerState<StatusScreen> createState() => _StatusScreenState();
}

class _StatusScreenState extends ConsumerState<StatusScreen> {
  Map<String, dynamic>? _health;
  Map<String, dynamic>? _sync;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final Dio dio = ref.read(dioProvider);
    try {
      final Future<Response<dynamic>> health = dio.get<dynamic>('/api/health');
      final Future<Response<dynamic>> sync = dio.get<dynamic>('/api/health/sync');
      final List<Response<dynamic>> rs = await Future.wait(<Future<Response<dynamic>>>[health, sync]);
      if (!mounted) return;
      setState(() {
        _health = rs[0].data as Map<String, dynamic>?;
        _sync = rs[1].data as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Scaffold(
      backgroundColor: t.bg,
      appBar: AppBar(
        title: const Text('Status'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(LucideIcons.refreshCw),
            tooltip: 'Refresh',
            onPressed: _refresh,
          ),
        ],
      ),
      body: AtmosphericBackground(
        child: SafeArea(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                  children: <Widget>[
                    if (_error != null)
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(_error!,
                            style: AtmosTypography.body(fontSize: 13, color: t.text)),
                      ),
                    _section(t, 'API', <Widget>[
                      if (_health != null) ...<Widget>[
                        _row(t, 'Reachable', _health!['ok'] == true ? 'Yes' : 'No',
                            ok: _health!['ok'] == true),
                        _row(t, 'Region', '${_health!['region']}'),
                        _row(t, 'Commit', '${_health!['commit']}', mono: true),
                        _row(t, 'Time', '${_health!['time']}'),
                      ] else
                        _row(t, 'Reachable', 'No', ok: false),
                    ]),
                    const SizedBox(height: 12),
                    _section(t, 'Cross-device sync', <Widget>[
                      if (_sync != null) ...<Widget>[
                        _row(t, 'Signed in', _sync!['signedIn'] == true ? 'Yes' : 'No',
                            ok: _sync!['signedIn'] == true),
                        if (_sync!['user'] != null)
                          _row(t, 'Email', '${(_sync!['user'] as Map<String, dynamic>)['email']}'),
                        if (_sync!['counts'] != null) ...<Widget>[
                          const SizedBox(height: 6),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                            child: Text(
                              'Row counts visible to you (same on every device for this account):',
                              style: AtmosTypography.label(fontSize: 11, color: t.textMuted),
                            ),
                          ),
                          ...((_sync!['counts'] as Map<String, dynamic>).entries).map(
                            (MapEntry<String, dynamic> e) =>
                                _row(t, e.key, '${e.value}', mono: true),
                          ),
                        ],
                        if (_sync!['signedIn'] != true)
                          _row(t, 'Supabase',
                              _sync!['supabase'] == true ? 'configured' : 'NOT configured'),
                      ] else
                        _row(t, 'Diagnostic', 'unreachable', ok: false),
                    ]),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _section(AtmosTokens t, String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: t.outline.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(title.toUpperCase(),
              style: AtmosTypography.label(
                  fontSize: 11, color: t.textMuted, letterSpacing: 1.4, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          ...children,
        ],
      ),
    );
  }

  Widget _row(AtmosTokens t, String label, String value, {bool? ok, bool mono = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: <Widget>[
          if (ok == true)
            const Icon(LucideIcons.checkCircle2, size: 14, color: Color(0xFF22C55E)),
          if (ok == false)
            const Icon(LucideIcons.alertCircle, size: 14, color: Color(0xFFEF4444)),
          if (ok != null) const SizedBox(width: 6),
          Expanded(child: Text(label, style: AtmosTypography.body(fontSize: 13, color: t.text))),
          Text(value,
              style: mono
                  ? TextStyle(fontSize: 11, color: t.textMuted, fontFamily: 'monospace')
                  : AtmosTypography.label(fontSize: 11, color: t.textMuted)),
        ],
      ),
    );
  }
}
