import 'package:flutter/material.dart';

import 'colors.dart';
import 'typography.dart';

class AtmosTheme {
  AtmosTheme._();

  static ThemeData dark() {
    const AtmosTokens t = AtmosTokens.dark;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: t.bg,
      colorScheme: const ColorScheme.dark(
        surface: AtmosColors.darkBg,
        onSurface: AtmosColors.darkText,
        primary: AtmosColors.darkPrimary,
        onPrimary: Color(0xFF2B009E),
        secondary: AtmosColors.darkSecondary,
        outline: AtmosColors.darkOutline,
      ),
      textTheme: AtmosTypography.textTheme(t.text),
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      iconTheme: const IconThemeData(color: AtmosColors.darkText),
    );
  }

  static ThemeData light() {
    const AtmosTokens t = AtmosTokens.light;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: t.bg,
      colorScheme: const ColorScheme.light(
        surface: AtmosColors.lightBg,
        onSurface: AtmosColors.lightText,
        primary: AtmosColors.lightPrimary,
        onPrimary: Colors.white,
        secondary: AtmosColors.lightSecondary,
        outline: AtmosColors.lightOutline,
      ),
      textTheme: AtmosTypography.textTheme(t.text),
      splashFactory: NoSplash.splashFactory,
      highlightColor: Colors.transparent,
      iconTheme: const IconThemeData(color: AtmosColors.lightText),
    );
  }
}
