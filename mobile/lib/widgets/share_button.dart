import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';

import '../theme/colors.dart';
import '../theme/typography.dart';

/// Tap → opens the system share sheet (WhatsApp, SMS, Messages, etc.)
/// with a short text snippet of the current weather.
class ShareWeatherButton extends StatelessWidget {
  const ShareWeatherButton({
    super.key,
    required this.cityName,
    required this.temp,
    required this.feelsLike,
    required this.description,
    required this.tempMin,
    required this.tempMax,
    required this.unit,
  });

  final String cityName;
  final double temp;
  final double feelsLike;
  final String description;
  final double tempMin;
  final double tempMax;
  final String unit;

  String get _text =>
      'Atmos — $cityName\n'
      '${temp.round()}°$unit · $description\n'
      'Feels like ${feelsLike.round()}°$unit · '
      'High ${tempMax.round()}° / Low ${tempMin.round()}°';

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return ElevatedButton.icon(
      style: ElevatedButton.styleFrom(
        backgroundColor: t.surface,
        foregroundColor: t.text,
        side: BorderSide(color: t.outline.withOpacity(0.5)),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(40)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      ),
      onPressed: () {
        Share.share(_text, subject: 'Weather right now');
      },
      icon: const Icon(LucideIcons.share2, size: 14),
      label: Text('Share', style: AtmosTypography.label(fontSize: 12, color: t.text)),
    );
  }
}
