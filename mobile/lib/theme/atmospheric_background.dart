import 'package:flutter/material.dart';

import 'colors.dart';

/// Layered radial-gradient glow — replicates `.bg-atmospheric-glow` from globals.css.
class AtmosphericBackground extends StatelessWidget {
  const AtmosphericBackground({
    super.key,
    required this.child,
    this.skyTint,
  });

  final Widget child;
  final Color? skyTint;

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Stack(
      fit: StackFit.expand,
      children: <Widget>[
        Container(color: t.bg),
        IgnorePointer(
          child: Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0, -1.15),
                radius: 1.1,
                colors: <Color>[t.glowTop, Colors.transparent],
                stops: const <double>[0.0, 0.55],
              ),
            ),
          ),
        ),
        IgnorePointer(
          child: Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(-1.3, 0.55),
                radius: 0.8,
                colors: <Color>[t.glowBl, Colors.transparent],
                stops: const <double>[0.0, 0.4],
              ),
            ),
          ),
        ),
        IgnorePointer(
          child: Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(1.3, 0.35),
                radius: 0.8,
                colors: <Color>[t.glowBr, Colors.transparent],
                stops: const <double>[0.0, 0.4],
              ),
            ),
          ),
        ),
        if (skyTint != null)
          IgnorePointer(
            child: AnimatedContainer(
              duration: const Duration(seconds: 3),
              color: skyTint,
            ),
          ),
        child,
      ],
    );
  }
}
