import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../utils/weather_codes.dart';

/// Lightweight CustomPainter-driven rain / snow / lightning effect.
class WeatherParticles extends StatefulWidget {
  const WeatherParticles({super.key, required this.effect, this.intensity = 0.6});
  final WeatherEffect effect;
  final double intensity;

  @override
  State<WeatherParticles> createState() => _WeatherParticlesState();
}

class _Particle {
  _Particle({required this.x, required this.y, required this.vx, required this.vy, required this.r});
  double x;
  double y;
  double vx;
  double vy;
  double r;
}

class _WeatherParticlesState extends State<WeatherParticles>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(seconds: 30))..repeat();
  final math.Random _rng = math.Random();
  final List<_Particle> _particles = <_Particle>[];
  Size _size = Size.zero;
  double _flashAlpha = 0;
  int _nextFlashMs = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _c.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _c.stop();
    } else if (state == AppLifecycleState.resumed) {
      _c.repeat();
    }
  }

  void _seed(Size size) {
    if (_size == size && _particles.isNotEmpty) return;
    _size = size;
    _particles.clear();
    final int n = (widget.effect == WeatherEffect.snow ? 40 : 80).clamp(0, 100);
    for (int i = 0; i < n; i++) {
      _particles.add(_makeParticle());
    }
  }

  _Particle _makeParticle() {
    final bool snow = widget.effect == WeatherEffect.snow;
    return _Particle(
      x: _rng.nextDouble() * _size.width,
      y: _rng.nextDouble() * _size.height,
      vx: snow ? (_rng.nextDouble() - 0.5) * 0.4 : -0.4,
      vy: snow ? 0.6 + _rng.nextDouble() * 0.8 : 6 + _rng.nextDouble() * 4,
      r: snow ? 1.8 + _rng.nextDouble() * 1.5 : 0.8 + _rng.nextDouble() * 0.6,
    );
  }

  void _tick() {
    for (final _Particle p in _particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > _size.height || p.x < 0 || p.x > _size.width) {
        p.x = _rng.nextDouble() * _size.width;
        p.y = -10;
      }
    }
    if (widget.effect == WeatherEffect.lightning) {
      final int now = DateTime.now().millisecondsSinceEpoch;
      if (now >= _nextFlashMs) {
        _flashAlpha = 0.35 + _rng.nextDouble() * 0.25;
        _nextFlashMs = now + 4000 + _rng.nextInt(6000);
      } else {
        _flashAlpha = (_flashAlpha - 0.08).clamp(0, 1);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.effect == WeatherEffect.none) return const SizedBox.shrink();
    return IgnorePointer(
      child: LayoutBuilder(
        builder: (BuildContext _, BoxConstraints c) {
          _seed(Size(c.maxWidth, c.maxHeight));
          return AnimatedBuilder(
            animation: _c,
            builder: (BuildContext _, Widget? __) {
              _tick();
              return CustomPaint(
                size: Size(c.maxWidth, c.maxHeight),
                painter: _ParticlePainter(
                  particles: _particles,
                  effect: widget.effect,
                  flashAlpha: _flashAlpha,
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _ParticlePainter extends CustomPainter {
  _ParticlePainter({required this.particles, required this.effect, required this.flashAlpha});
  final List<_Particle> particles;
  final WeatherEffect effect;
  final double flashAlpha;

  @override
  void paint(Canvas canvas, Size size) {
    if (flashAlpha > 0) {
      canvas.drawRect(
        Offset.zero & size,
        Paint()..color = Colors.white.withOpacity(flashAlpha * 0.6),
      );
    }
    final Paint paint = Paint();
    if (effect == WeatherEffect.snow) {
      paint.color = Colors.white.withOpacity(0.6);
      for (final _Particle p in particles) {
        canvas.drawCircle(Offset(p.x, p.y), p.r, paint);
      }
    } else {
      // Rain — short streaks
      paint
        ..color = const Color(0xCC60A5FA)
        ..strokeWidth = 1.0;
      for (final _Particle p in particles) {
        canvas.drawLine(Offset(p.x, p.y), Offset(p.x - 1, p.y - 6), paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlePainter old) => true;
}
