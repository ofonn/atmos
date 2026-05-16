import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Plus Jakarta Sans (headlines/body) + Inter (labels), matching the web app.
class AtmosTypography {
  AtmosTypography._();

  static TextStyle headline({
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.w700,
    Color? color,
    double? height,
    double letterSpacing = -0.02,
  }) {
    return GoogleFonts.plusJakartaSans(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      height: height,
      letterSpacing: letterSpacing * fontSize,
    );
  }

  static TextStyle body({
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.w400,
    Color? color,
    double? height,
  }) {
    return GoogleFonts.plusJakartaSans(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      height: height,
    );
  }

  static TextStyle label({
    double fontSize = 11,
    FontWeight fontWeight = FontWeight.w500,
    Color? color,
    double letterSpacing = 0.6,
  }) {
    return GoogleFonts.inter(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
      letterSpacing: letterSpacing,
    );
  }

  static TextTheme textTheme(Color text) {
    return TextTheme(
      displayLarge: headline(fontSize: 64, fontWeight: FontWeight.w800, color: text),
      displayMedium: headline(fontSize: 48, fontWeight: FontWeight.w800, color: text),
      displaySmall: headline(fontSize: 36, fontWeight: FontWeight.w700, color: text),
      headlineLarge: headline(fontSize: 28, fontWeight: FontWeight.w700, color: text),
      headlineMedium: headline(fontSize: 22, fontWeight: FontWeight.w600, color: text),
      headlineSmall: headline(fontSize: 18, fontWeight: FontWeight.w600, color: text),
      titleLarge: headline(fontSize: 17, fontWeight: FontWeight.w600, color: text),
      titleMedium: headline(fontSize: 15, fontWeight: FontWeight.w600, color: text),
      titleSmall: headline(fontSize: 13, fontWeight: FontWeight.w600, color: text),
      bodyLarge: body(fontSize: 16, color: text),
      bodyMedium: body(fontSize: 14, color: text),
      bodySmall: body(fontSize: 12, color: text),
      labelLarge: label(fontSize: 13, color: text),
      labelMedium: label(fontSize: 11, color: text),
      labelSmall: label(fontSize: 9, color: text),
    );
  }
}
