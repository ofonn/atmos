import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../state/api_providers.dart';
import '../state/storage.dart';

/// Live severe-weather banner driven by `/api/warnings`. Dismissable
/// per-event for 12 hours (key hashed from title+description).
class SevereWeatherBanner extends ConsumerStatefulWidget {
  const SevereWeatherBanner({
    super.key,
    required this.lat,
    required this.lon,
  });

  final double lat;
  final double lon;

  @override
  ConsumerState<SevereWeatherBanner> createState() => _SevereWeatherBannerState();
}

class _SevereWeatherBannerState extends ConsumerState<SevereWeatherBanner> {
  Map<String, dynamic>? _warning;
  bool _dismissed = false;

  static const Duration _rememberDismiss = Duration(hours: 12);
  static const String _prefix = 'atmos_severe_dismissed_';

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  @override
  void didUpdateWidget(covariant SevereWeatherBanner old) {
    super.didUpdateWidget(old);
    if (old.lat != widget.lat || old.lon != widget.lon) _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _warning = null;
      _dismissed = false;
    });
    final Dio dio = ref.read(dioProvider);
    try {
      final Response<dynamic> res = await dio.get<dynamic>(
        '/api/warnings',
        queryParameters: <String, dynamic>{'lat': widget.lat, 'lon': widget.lon},
      );
      final Map<String, dynamic> data = res.data as Map<String, dynamic>;
      final List<dynamic> warnings = (data['warnings'] as List<dynamic>?) ?? <dynamic>[];
      if (warnings.isEmpty) return;
      final Map<String, dynamic> first = warnings.first as Map<String, dynamic>;
      final String id = _hash('${first['title']}:${first['description']}');
      final SharedPreferences prefs = ref.read(sharedPrefsProvider);
      final int? dismissedAt = prefs.getInt('$_prefix$id');
      if (dismissedAt != null &&
          DateTime.now().millisecondsSinceEpoch - dismissedAt <
              _rememberDismiss.inMilliseconds) {
        return;
      }
      if (!mounted) return;
      setState(() => _warning = first);
    } catch (_) {
      // Silent — no banner is the right fallback
    }
  }

  String _hash(String s) {
    int h = 0;
    for (final int c in s.codeUnits) {
      h = (h << 5) - h + c;
      h &= 0xffffffff;
    }
    return h.abs().toRadixString(36);
  }

  void _dismiss() {
    if (_warning == null) return;
    final String id = _hash('${_warning!['title']}:${_warning!['description']}');
    final SharedPreferences prefs = ref.read(sharedPrefsProvider);
    prefs.setInt('$_prefix$id', DateTime.now().millisecondsSinceEpoch);
    setState(() => _dismissed = true);
  }

  @override
  Widget build(BuildContext context) {
    if (_warning == null || _dismissed) return const SizedBox.shrink();
    final bool severe = _warning!['severity'] == 'severe';
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: severe
              ? const <Color>[Color(0xFFEF4444), Color(0xFFB91C1C)]
              : const <Color>[Color(0xFFF59E0B), Color(0xFFB45309)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(LucideIcons.alertTriangle, size: 16, color: Colors.white),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  _warning!['title'] as String,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (_warning!['description'] != null) ...<Widget>[
                  const SizedBox(height: 2),
                  Text(
                    _warning!['description'] as String,
                    style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12, height: 1.4),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            iconSize: 18,
            color: Colors.white,
            visualDensity: VisualDensity.compact,
            onPressed: _dismiss,
            icon: const Icon(LucideIcons.x),
          ),
        ],
      ),
    );
  }
}
