import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// Slim banner that appears at the top whenever the device has no
/// reachable network. Auto-hides when connectivity returns. The
/// underlying `weatherProvider` already serves cached forecasts so the
/// app stays usable.
class OfflineBanner extends StatefulWidget {
  const OfflineBanner({super.key});

  @override
  State<OfflineBanner> createState() => _OfflineBannerState();
}

class _OfflineBannerState extends State<OfflineBanner> {
  StreamSubscription<List<ConnectivityResult>>? _sub;
  bool _offline = false;

  @override
  void initState() {
    super.initState();
    Connectivity().checkConnectivity().then((List<ConnectivityResult> r) {
      if (!mounted) return;
      setState(() => _offline = _isOffline(r));
    });
    _sub = Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> r) {
      if (!mounted) return;
      setState(() => _offline = _isOffline(r));
    });
  }

  bool _isOffline(List<ConnectivityResult> r) =>
      r.isEmpty || r.every((ConnectivityResult c) => c == ConnectivityResult.none);

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      child: !_offline
          ? const SizedBox.shrink()
          : Container(
              key: const ValueKey<String>('offline'),
              width: double.infinity,
              color: const Color(0xFFB45309),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Icon(LucideIcons.wifiOff, size: 14, color: Colors.white),
                  SizedBox(width: 8),
                  Text(
                    "You're offline — showing the last update.",
                    style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
    );
  }
}
