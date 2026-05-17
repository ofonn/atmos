import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/colors.dart';
import '../utils/weather_codes.dart';

/// "3D" weather icon — emoji on a soft halo. Equivalent to the MeteoIcon
/// component on the web (kept lightweight here to avoid bundling SVG assets).
class MeteoIcon extends StatelessWidget {
  const MeteoIcon({
    super.key,
    required this.conditionCode,
    required this.isDay,
    this.size = 96,
    this.animated = true,
  });

  final int conditionCode;
  final bool isDay;
  final double size;
  final bool animated;

  @override
  Widget build(BuildContext context) {
    final List<Color> g = Wmo.iconGradient(conditionCode, isDark: Theme.of(context).brightness == Brightness.dark);
    final Widget halo = Container(
      width: size * 1.45,
      height: size * 1.45,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(colors: <Color>[g.first.withOpacity(0.45), Colors.transparent]),
      ),
    );
    final Widget core = SizedBox(
      width: size,
      height: size,
      child: Center(
        child: Text(
          Wmo.emoji(conditionCode, isDay: isDay),
          style: TextStyle(
            fontSize: size * 0.78,
            shadows: <Shadow>[
              Shadow(blurRadius: size * 0.22, color: g.first.withOpacity(0.5)),
            ],
          ),
        ),
      ),
    );

    if (!animated) {
      return SizedBox(
        width: size * 1.45,
        height: size * 1.45,
        child: Stack(alignment: Alignment.center, children: <Widget>[halo, core]),
      );
    }

    return SizedBox(
      width: size * 1.45,
      height: size * 1.45,
      child: Stack(alignment: Alignment.center, children: <Widget>[
        _Pulse(child: halo),
        _Bob(child: core),
      ]),
    );
  }
}

class _Pulse extends StatefulWidget {
  const _Pulse({required this.child});
  final Widget child;
  @override
  State<_Pulse> createState() => _PulseState();
}

class _PulseState extends State<_Pulse> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 4500),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (BuildContext _, Widget? child) {
        final double t = Curves.easeInOut.transform(_c.value);
        return Transform.scale(scale: 1 + t * 0.25, child: Opacity(opacity: 0.25 + t * 0.2, child: child));
      },
      child: widget.child,
    );
  }
}

class _Bob extends StatefulWidget {
  const _Bob({required this.child});
  final Widget child;
  @override
  State<_Bob> createState() => _BobState();
}

class _BobState extends State<_Bob> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 4000),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (BuildContext _, Widget? child) {
        final double t = Curves.easeInOut.transform(_c.value);
        return Transform.translate(offset: Offset(0, -7 * math.sin(t * math.pi)), child: child);
      },
      child: widget.child,
    );
  }
}

/// Compact emoji icon (no halo) for hourly/daily lists.
class WeatherEmoji extends StatelessWidget {
  const WeatherEmoji({super.key, required this.code, required this.isDay, this.size = 22});
  final int code;
  final bool isDay;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Text(
      Wmo.emoji(code, isDay: isDay),
      style: TextStyle(fontSize: size, color: AtmosColors.darkText),
    );
  }
}
