import 'dart:ui';

import 'package:flutter/material.dart';

import 'colors.dart';

/// Glass-morphism card — `bg-rgba(...) backdrop-filter:blur(24px)` from globals.css.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.borderRadius = 20,
    this.padding = const EdgeInsets.all(16),
    this.fillOpacity = 0.4,
    this.borderOpacity = 0.25,
    this.blur = 24,
  });

  final Widget child;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final double fillOpacity;
  final double borderOpacity;
  final double blur;

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: t.glassFill.withOpacity(fillOpacity),
            border: Border.all(
              color: t.glassBorder.withOpacity(borderOpacity),
              width: 0.5,
            ),
            borderRadius: BorderRadius.circular(borderRadius),
          ),
          child: child,
        ),
      ),
    );
  }
}

/// Solid surface card matching `var(--surface)` — for non-blur cards.
class SurfaceCard extends StatelessWidget {
  const SurfaceCard({
    super.key,
    required this.child,
    this.borderRadius = 20,
    this.padding = const EdgeInsets.all(16),
    this.borderColor,
  });

  final Widget child;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final Color? borderColor;

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: t.surface,
        border: Border.all(
          color: borderColor ?? t.outline.withOpacity(0.4),
          width: 0.5,
        ),
        borderRadius: BorderRadius.circular(borderRadius),
      ),
      child: child,
    );
  }
}
