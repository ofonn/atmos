import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_cancellable_tile_provider/flutter_map_cancellable_tile_provider.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../state/location_provider.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

class RadarScreen extends ConsumerStatefulWidget {
  const RadarScreen({super.key});
  @override
  ConsumerState<RadarScreen> createState() => _RadarScreenState();
}

class _RadarScreenState extends ConsumerState<RadarScreen> {
  List<Map<String, dynamic>> _frames = <Map<String, dynamic>>[];
  String _host = 'https://tilecache.rainviewer.com';
  int _frameIdx = 0;
  bool _playing = false;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadFrames();
  }

  Future<void> _loadFrames() async {
    try {
      final Response<dynamic> r = await Dio().get<dynamic>(
        'https://api.rainviewer.com/public/weather-maps.json',
      );
      final Map<String, dynamic> data = r.data as Map<String, dynamic>;
      final Map<String, dynamic> radar = (data['radar'] as Map<String, dynamic>?) ?? const <String, dynamic>{};
      final List<dynamic> past = (radar['past'] as List<dynamic>?) ?? const <dynamic>[];
      final List<dynamic> nowcast = (radar['nowcast'] as List<dynamic>?) ?? const <dynamic>[];
      setState(() {
        _host = data['host']?.toString() ?? _host;
        _frames = <Map<String, dynamic>>[...past, ...nowcast]
            .cast<Map<String, dynamic>>();
        _frameIdx = past.isNotEmpty ? past.length - 1 : 0;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  void _togglePlay() {
    setState(() => _playing = !_playing);
    if (_playing) _tick();
  }

  Future<void> _tick() async {
    while (mounted && _playing) {
      await Future<void>.delayed(const Duration(milliseconds: 700));
      if (!mounted) break;
      setState(() => _frameIdx = (_frameIdx + 1) % _frames.length);
    }
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final LocationState? loc = ref.watch(locationProvider).valueOrNull;
    final LatLng centre = loc?.current != null
        ? LatLng(loc!.current!.lat, loc.current!.lon)
        : const LatLng(40.7128, -74.0060);
    final String? path = _frames.isNotEmpty
        ? _frames[_frameIdx]['path']?.toString()
        : null;

    return Scaffold(
      backgroundColor: t.bg,
      body: AtmosphericBackground(
        child: SafeArea(
          child: Column(
            children: <Widget>[
              Row(
                children: <Widget>[
                  IconButton(icon: Icon(LucideIcons.arrowLeft, color: t.text), onPressed: () => context.go('/')),
                  Text('Live radar',
                      style: AtmosTypography.headline(fontSize: 20, fontWeight: FontWeight.w700, color: t.text)),
                  const Spacer(),
                  IconButton(
                    icon: Icon(LucideIcons.refreshCw, color: t.text),
                    onPressed: _loadFrames,
                  ),
                ],
              ),
              Expanded(
                child: Stack(
                  children: <Widget>[
                    FlutterMap(
                      options: MapOptions(
                        initialCenter: centre,
                        initialZoom: 7,
                        backgroundColor: t.bg,
                      ),
                      children: <Widget>[
                        TileLayer(
                          urlTemplate: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                          subdomains: const <String>['a', 'b', 'c'],
                          tileProvider: CancellableNetworkTileProvider(),
                          userAgentPackageName: 'com.atmos.weather',
                        ),
                        if (path != null)
                          TileLayer(
                            urlTemplate: '$_host$path/256/{z}/{x}/{y}/2/1_1.png',
                            tileProvider: CancellableNetworkTileProvider(),
                            userAgentPackageName: 'com.atmos.weather',
                          ),
                        if (loc?.current != null)
                          MarkerLayer(
                            markers: <Marker>[
                              Marker(
                                point: centre,
                                width: 22,
                                height: 22,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: AtmosColors.darkPrimary,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 2),
                                  ),
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                    if (_loading)
                      Container(
                        color: Colors.black.withOpacity(0.4),
                        alignment: Alignment.center,
                        child: const CircularProgressIndicator(),
                      ),
                  ],
                ),
              ),
              if (_frames.isNotEmpty)
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  color: t.bg.withOpacity(0.6),
                  child: Row(
                    children: <Widget>[
                      GestureDetector(
                        onTap: _togglePlay,
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: AtmosColors.heroGradient,
                          ),
                          child: Icon(
                            _playing ? LucideIcons.pause : LucideIcons.play,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Slider(
                          value: _frameIdx.toDouble(),
                          min: 0,
                          max: (_frames.length - 1).toDouble(),
                          activeColor: t.primary,
                          onChanged: (double v) => setState(() => _frameIdx = v.toInt()),
                        ),
                      ),
                      Text(
                        _frames.isNotEmpty
                            ? _fmt(_frames[_frameIdx]['time'] as int? ?? 0)
                            : '--:--',
                        style: AtmosTypography.label(fontSize: 11, color: t.text),
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

  String _fmt(int unix) {
    if (unix == 0) return '--:--';
    final DateTime d = DateTime.fromMillisecondsSinceEpoch(unix * 1000);
    return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }
}
