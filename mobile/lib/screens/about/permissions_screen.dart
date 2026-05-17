import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

class PermissionsScreen extends ConsumerStatefulWidget {
  const PermissionsScreen({super.key});

  @override
  ConsumerState<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends ConsumerState<PermissionsScreen> {
  String _location = 'checking…';
  String _mic = 'checking…';
  String _notif = 'checking…';

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final LocationPermission loc = await Geolocator.checkPermission();
    final PermissionStatus mic = await Permission.microphone.status;
    final PermissionStatus notif = await Permission.notification.status;
    if (!mounted) return;
    setState(() {
      _location = _locStr(loc);
      _mic = _statusStr(mic);
      _notif = _statusStr(notif);
    });
  }

  String _statusStr(PermissionStatus s) {
    return switch (s) {
      PermissionStatus.granted => 'Granted',
      PermissionStatus.denied => 'Denied',
      PermissionStatus.permanentlyDenied => 'Permanently denied',
      PermissionStatus.restricted => 'Restricted',
      PermissionStatus.limited => 'Limited',
      PermissionStatus.provisional => 'Provisional',
    };
  }

  String _locStr(LocationPermission p) {
    return switch (p) {
      LocationPermission.always => 'Granted (always)',
      LocationPermission.whileInUse => 'Granted (while in use)',
      LocationPermission.denied => 'Denied',
      LocationPermission.deniedForever => 'Permanently denied',
      LocationPermission.unableToDetermine => 'Unknown',
    };
  }

  Color _color(String s, AtmosTokens t) {
    if (s.startsWith('Granted')) return const Color(0xFF22C55E);
    if (s.contains('denied') || s.contains('Denied')) return const Color(0xFFEF4444);
    return t.textMuted;
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Scaffold(
      backgroundColor: t.bg,
      appBar: AppBar(
        title: const Text('Permissions'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(LucideIcons.refreshCw),
            onPressed: _refresh,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: AtmosphericBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
            children: <Widget>[
              _row(t, LucideIcons.mapPin, 'Location',
                  'Used only to fetch your local weather. Never shared.', _location),
              _row(t, LucideIcons.mic, 'Microphone',
                  'Used only for voice input in chat. Off by default.', _mic),
              _row(t, LucideIcons.bell, 'Notifications',
                  'Used only for opt-in severe weather alerts.', _notif),
              const SizedBox(height: 16),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: t.surface,
                  foregroundColor: t.text,
                ),
                onPressed: openAppSettings,
                icon: const Icon(LucideIcons.settings, size: 16),
                label: const Text('Open Android app settings'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _row(AtmosTokens t, IconData icon, String title, String body, String status) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: t.outline.withOpacity(0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Icon(icon, size: 18, color: t.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(title,
                      style: AtmosTypography.body(
                          fontSize: 14, color: t.text, fontWeight: FontWeight.w700)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: _color(status, t).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(40),
                  ),
                  child: Text(status,
                      style: AtmosTypography.label(
                          fontSize: 11, color: _color(status, t), fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(body,
                style: AtmosTypography.label(fontSize: 12, color: t.textMuted, height: 1.45)),
          ],
        ),
      ),
    );
  }
}
