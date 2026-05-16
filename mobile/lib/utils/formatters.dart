import 'package:intl/intl.dart';

double cToF(double c) => c * 9 / 5 + 32;
double kmhToMph(double k) => k * 0.621371;

String displayTemp(double c, String unit) {
  if (unit == 'F') return '${cToF(c).round()}°F';
  return '${c.round()}°C';
}

String displayTempShort(double c, String unit) {
  if (unit == 'F') return '${cToF(c).round()}°';
  return '${c.round()}°';
}

String displayWind(double kmh, String unit) {
  if (unit == 'mph') return '${kmhToMph(kmh).round()} mph';
  return '${kmh.round()} km/h';
}

String fmtISOTime(String iso, {String format = '24h'}) {
  if (iso.length < 16) return iso;
  final String hm = iso.substring(11, 16);
  if (format == '24h') return hm;
  final List<String> parts = hm.split(':');
  final int h = int.tryParse(parts[0]) ?? 0;
  final String suffix = h >= 12 ? 'PM' : 'AM';
  final int h12 = h % 12 == 0 ? 12 : h % 12;
  return '$h12:${parts[1]} $suffix';
}

String fmtISODateShort(String iso) {
  try {
    final DateTime d = DateTime.parse(iso.contains('T') ? iso : '${iso}T12:00:00Z');
    return DateFormat('EEE, MMM d').format(d);
  } catch (_) {
    return iso;
  }
}

String fmtHourShort(String iso, {String format = '24h'}) {
  if (iso.length < 13) return iso;
  final int h = int.tryParse(iso.substring(11, 13)) ?? 0;
  if (format == '24h') return '${h.toString().padLeft(2, '0')}:00';
  final int h12 = h % 12 == 0 ? 12 : h % 12;
  return '$h12 ${h >= 12 ? 'PM' : 'AM'}';
}

String fmtDayShort(String iso) {
  try {
    final DateTime d = DateTime.parse(iso.contains('T') ? iso : '${iso}T12:00:00Z');
    return DateFormat('EEE').format(d);
  } catch (_) {
    return iso;
  }
}

String fmtFullDate(String iso) {
  try {
    final DateTime d = DateTime.parse(iso.contains('T') ? iso : '${iso}T12:00:00Z');
    return DateFormat('EEEE, MMM d').format(d);
  } catch (_) {
    return iso;
  }
}

String secsToHm(num seconds) {
  final int s = seconds.toInt();
  final int h = s ~/ 3600;
  final int m = (s % 3600) ~/ 60;
  return '${h}h ${m}m';
}
