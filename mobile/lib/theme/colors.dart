import 'package:flutter/material.dart';

/// Atmos "Celestial Curator" palette.
/// Mirrors `src/app/globals.css` CSS variables and `tailwind.config.ts`.
class AtmosColors {
  AtmosColors._();

  // Brand gradients
  static const Color heroGradientStart = Color(0xFF806EF8);
  static const Color heroGradientEnd = Color(0xFF5896FD);
  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: <Color>[heroGradientStart, heroGradientEnd],
  );

  static const LinearGradient cardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: <Color>[Color(0xFFA6C0FF), Color(0xFF5B96FD)],
  );

  // Dark mode
  static const Color darkBg = Color(0xFF10131C);
  static const Color darkSurface = Color(0xFF1C1F28);
  static const Color darkSurfaceMid = Color(0xFF272A33);
  static const Color darkText = Color(0xFFE0E2EE);
  static const Color darkTextMuted = Color(0xFFC9C4D6);
  static const Color darkPrimary = Color(0xFFC7BFFF);
  static const Color darkSecondary = Color(0xFFACC7FF);
  static const Color darkOutline = Color(0xFF474554);
  static const Color darkGlassFill = Color(0xFF272A33);
  static const Color darkGlassBorder = Color(0xFF474554);
  static const Color darkNavBg = Color(0xCC1E2230);
  static const Color darkNavBorder = Color(0x17FFFFFF);

  // Light mode
  static const Color lightBg = Color(0xFFF0F0F3);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightSurfaceMid = Color(0xFFF5F5F7);
  static const Color lightText = Color(0xFF10131C);
  static const Color lightTextMuted = Color(0xFF4A4D5E);
  static const Color lightPrimary = Color(0xFF5B47D1);
  static const Color lightSecondary = Color(0xFF2563EB);
  static const Color lightOutline = Color(0xFFD9D9E3);
  static const Color lightGlassFill = Color(0xFFFFFFFF);
  static const Color lightGlassBorder = Color(0xFF000000);
  static const Color lightNavBg = Color(0xD1F8F8FC);
  static const Color lightNavBorder = Color(0x1A000000);

  // Atmospheric glow seeds
  static const Color darkGlowTop = Color(0xBF4329B8);
  static const Color darkGlowBl = Color(0x1F5896FD);
  static const Color darkGlowBr = Color(0x14806EF8);

  static const Color lightGlowTop = Color(0x408264E6);
  static const Color lightGlowBl = Color(0x0F5896FD);
  static const Color lightGlowBr = Color(0x0A806EF8);

  // Semantic
  static const Color warmAccent = Color(0xFFF97316);
  static const Color coolAccent = Color(0xFF60A5FA);
  static const Color danger = Color(0xFFEF4444);
  static const Color success = Color(0xFF22C55E);
}

/// Token bundle that adapts to the current Brightness.
class AtmosTokens {
  const AtmosTokens({
    required this.bg,
    required this.surface,
    required this.surfaceMid,
    required this.text,
    required this.textMuted,
    required this.primary,
    required this.secondary,
    required this.outline,
    required this.glassFill,
    required this.glassBorder,
    required this.navBg,
    required this.navBorder,
    required this.glowTop,
    required this.glowBl,
    required this.glowBr,
    required this.gradientTextFrom,
    required this.gradientTextTo,
  });

  final Color bg;
  final Color surface;
  final Color surfaceMid;
  final Color text;
  final Color textMuted;
  final Color primary;
  final Color secondary;
  final Color outline;
  final Color glassFill;
  final Color glassBorder;
  final Color navBg;
  final Color navBorder;
  final Color glowTop;
  final Color glowBl;
  final Color glowBr;
  final Color gradientTextFrom;
  final Color gradientTextTo;

  static const AtmosTokens dark = AtmosTokens(
    bg: AtmosColors.darkBg,
    surface: AtmosColors.darkSurface,
    surfaceMid: AtmosColors.darkSurfaceMid,
    text: AtmosColors.darkText,
    textMuted: AtmosColors.darkTextMuted,
    primary: AtmosColors.darkPrimary,
    secondary: AtmosColors.darkSecondary,
    outline: AtmosColors.darkOutline,
    glassFill: AtmosColors.darkGlassFill,
    glassBorder: AtmosColors.darkGlassBorder,
    navBg: AtmosColors.darkNavBg,
    navBorder: AtmosColors.darkNavBorder,
    glowTop: AtmosColors.darkGlowTop,
    glowBl: AtmosColors.darkGlowBl,
    glowBr: AtmosColors.darkGlowBr,
    gradientTextFrom: AtmosColors.darkPrimary,
    gradientTextTo: AtmosColors.darkSecondary,
  );

  static const AtmosTokens light = AtmosTokens(
    bg: AtmosColors.lightBg,
    surface: AtmosColors.lightSurface,
    surfaceMid: AtmosColors.lightSurfaceMid,
    text: AtmosColors.lightText,
    textMuted: AtmosColors.lightTextMuted,
    primary: AtmosColors.lightPrimary,
    secondary: AtmosColors.lightSecondary,
    outline: AtmosColors.lightOutline,
    glassFill: AtmosColors.lightGlassFill,
    glassBorder: AtmosColors.lightGlassBorder,
    navBg: AtmosColors.lightNavBg,
    navBorder: AtmosColors.lightNavBorder,
    glowTop: AtmosColors.lightGlowTop,
    glowBl: AtmosColors.lightGlowBl,
    glowBr: AtmosColors.lightGlowBr,
    gradientTextFrom: AtmosColors.lightPrimary,
    gradientTextTo: AtmosColors.lightSecondary,
  );
}

extension AtmosBrightness on BuildContext {
  AtmosTokens get atmos => Theme.of(this).brightness == Brightness.dark
      ? AtmosTokens.dark
      : AtmosTokens.light;
}
