import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../theme/colors.dart';

class AiFab extends StatefulWidget {
  const AiFab({super.key});

  @override
  State<AiFab> createState() => _AiFabState();
}

class _AiFabState extends State<AiFab> with TickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2200),
  )..repeat(reverse: true);

  late final AnimationController _ping = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat();

  @override
  void dispose() {
    _pulse.dispose();
    _ping.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 80,
      height: 80,
      child: Stack(
        alignment: Alignment.center,
        children: <Widget>[
          AnimatedBuilder(
            animation: _pulse,
            builder: (BuildContext _, Widget? __) {
              return Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AtmosColors.heroGradient,
                ),
                foregroundDecoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.black.withOpacity(1 - (0.2 + _pulse.value * 0.05)),
                ),
              );
            },
          ),
          AnimatedBuilder(
            animation: _ping,
            builder: (BuildContext _, Widget? __) {
              final double v = Curves.easeOut.transform(_ping.value);
              return Container(
                width: 56 + v * 24,
                height: 56 + v * 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AtmosColors.heroGradientStart.withOpacity(0.3 * (1 - v)),
                    width: 2,
                  ),
                ),
              );
            },
          ),
          GestureDetector(
            onTap: () {
              HapticFeedback.mediumImpact();
              context.push('/chat');
            },
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AtmosColors.heroGradient,
                boxShadow: <BoxShadow>[
                  BoxShadow(
                    color: AtmosColors.heroGradientStart.withOpacity(0.6),
                    blurRadius: 28,
                  ),
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 4)),
                ],
              ),
              child: const Icon(LucideIcons.sparkles, color: Colors.white, size: 20),
            ),
          ),
        ],
      ),
    );
  }
}
