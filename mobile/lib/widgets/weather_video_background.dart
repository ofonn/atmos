import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';

import '../api/dio_client.dart';
import '../state/settings_provider.dart';

/// Renders a looping weather-adaptive video behind the home content
/// when the user opted in during onboarding (or via Settings →
/// Background → Weather video). Clips are fetched from the deployed
/// website's `/videos/<condition>.mp4` so we don't bundle them into
/// the APK (which would balloon the install size).
///
/// If a clip is missing the widget renders an empty SizedBox — the
/// underlying app background still shows.
class WeatherVideoBackground extends ConsumerStatefulWidget {
  const WeatherVideoBackground({
    super.key,
    required this.conditionCode,
    required this.isDay,
  });

  final int conditionCode;
  final bool isDay;

  @override
  ConsumerState<WeatherVideoBackground> createState() => _WeatherVideoBackgroundState();
}

class _WeatherVideoBackgroundState extends ConsumerState<WeatherVideoBackground>
    with WidgetsBindingObserver {
  VideoPlayerController? _controller;
  String? _currentUrl;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Pause when the app goes to background to save battery + data.
    if (_controller == null || !_controller!.value.isInitialized) return;
    if (state == AppLifecycleState.paused) _controller!.pause();
    if (state == AppLifecycleState.resumed) _controller!.play();
  }

  String? _urlFor(int code, bool isDay, String quality) {
    final String q = quality == 'low' ? '-low' : '';
    final String base = ApiConfig.baseUrl;
    String? name;
    if (code == 0) name = 'clear-${isDay ? 'day' : 'night'}';
    else if (code == 1 || code == 2) name = 'partly-cloudy-${isDay ? 'day' : 'night'}';
    else if (code == 3) name = 'cloudy';
    else if (code == 45 || code == 48) name = 'fog';
    else if (code >= 51 && code <= 57) name = 'drizzle';
    else if (code >= 61 && code <= 67) name = 'rain';
    else if (code >= 71 && code <= 77) name = 'snow';
    else if (code >= 80 && code <= 82) name = 'showers';
    else if (code == 85 || code == 86) name = 'snow-showers';
    else if (code >= 95 && code <= 99) name = 'thunder';
    if (name == null) return null;
    return '$base/videos/$name$q.mp4';
  }

  Future<void> _swap(String url) async {
    final VideoPlayerController next = VideoPlayerController.networkUrl(
      Uri.parse(url),
      videoPlayerOptions: VideoPlayerOptions(mixWithOthers: true),
    );
    try {
      await next.initialize();
    } catch (_) {
      next.dispose();
      return;
    }
    await next.setLooping(true);
    await next.setVolume(0);
    await next.play();
    if (!mounted) {
      next.dispose();
      return;
    }
    setState(() {
      _controller?.dispose();
      _controller = next;
      _currentUrl = url;
    });
  }

  @override
  Widget build(BuildContext context) {
    final AtmosSettings s = ref.watch(settingsProvider);
    if (s.videoBackground != 'on') return const SizedBox.shrink();

    final String? url = _urlFor(widget.conditionCode, widget.isDay, s.videoBackgroundQuality == 'low' ? 'low' : 'hd');
    if (url == null) return const SizedBox.shrink();
    if (url != _currentUrl) {
      // Fire-and-forget. setState happens inside _swap.
      _swap(url);
    }

    if (_controller == null || !_controller!.value.isInitialized) {
      return const SizedBox.shrink();
    }
    return Positioned.fill(
      child: Opacity(
        opacity: 0.55,
        child: FittedBox(
          fit: BoxFit.cover,
          child: SizedBox(
            width: _controller!.value.size.width,
            height: _controller!.value.size.height,
            child: VideoPlayer(_controller!),
          ),
        ),
      ),
    );
  }
}
