import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';

import '../../api/dio_client.dart';
import '../../state/api_providers.dart';
import '../../theme/atmospheric_background.dart';
import '../../theme/colors.dart';
import '../../theme/typography.dart';

class TripScreen extends ConsumerStatefulWidget {
  const TripScreen({super.key});

  @override
  ConsumerState<TripScreen> createState() => _TripScreenState();
}

class _TripScreenState extends ConsumerState<TripScreen> {
  final TextEditingController _destCtrl = TextEditingController();
  DateTime? _startDate;
  DateTime? _endDate;
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _destCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool start) async {
    final DateTime now = DateTime.now();
    final DateTime initial = start
        ? (_startDate ?? now.add(const Duration(days: 1)))
        : (_endDate ?? (_startDate ?? now).add(const Duration(days: 2)));
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: now,
      lastDate: now.add(const Duration(days: 15)),
    );
    if (picked != null) {
      setState(() {
        if (start) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _plan() async {
    setState(() {
      _error = null;
      _result = null;
    });
    if (_destCtrl.text.trim().isEmpty || _startDate == null || _endDate == null) {
      setState(() => _error = 'All fields required.');
      return;
    }
    if (_endDate!.isBefore(_startDate!)) {
      setState(() => _error = 'End date must be after start date.');
      return;
    }
    setState(() => _loading = true);
    final Dio dio = ref.read(dioProvider);
    try {
      // 1. Geocode
      final Response<dynamic> geoRes = await dio.get<dynamic>(
        '/api/geocode',
        queryParameters: <String, dynamic>{'q': _destCtrl.text.trim()},
      );
      final List<dynamic> geoData = geoRes.data as List<dynamic>;
      if (geoData.isEmpty) throw Exception('City not found');
      final Map<String, dynamic> place = geoData[0] as Map<String, dynamic>;
      final double lat = (place['lat'] as num).toDouble();
      final double lon = (place['lon'] as num).toDouble();
      final String placeLabel = '${place['name']}${place['country'] != null ? ', ${place['country']}' : ''}';

      // 2. Forecast
      final Response<dynamic> wxRes = await dio.get<dynamic>(
        '/api/openmeteo',
        queryParameters: <String, dynamic>{'lat': lat, 'lon': lon},
      );
      final Map<String, dynamic> wx = wxRes.data as Map<String, dynamic>;
      final Map<String, dynamic> daily = (wx['daily'] ?? wx) as Map<String, dynamic>;
      final List<dynamic> times = daily['time'] as List<dynamic>;
      final List<dynamic> tMin = daily['temperature_2m_min'] as List<dynamic>;
      final List<dynamic> tMax = daily['temperature_2m_max'] as List<dynamic>;
      final List<dynamic> codes = daily['weather_code'] as List<dynamic>;
      final List<dynamic> pops =
          (daily['precipitation_probability_max'] ?? List<int>.filled(times.length, 0)) as List<dynamic>;

      final String fmtStart = DateFormat('yyyy-MM-dd').format(_startDate!);
      final String fmtEnd = DateFormat('yyyy-MM-dd').format(_endDate!);

      final List<Map<String, dynamic>> filteredDaily = <Map<String, dynamic>>[];
      for (int i = 0; i < times.length; i++) {
        final String d = times[i] as String;
        if (d.compareTo(fmtStart) >= 0 && d.compareTo(fmtEnd) <= 0) {
          final num? mn = tMin[i] as num?;
          final num? mx = tMax[i] as num?;
          final num? cd = codes[i] as num?;
          final num? p = i < pops.length ? pops[i] as num? : null;
          filteredDaily.add(<String, dynamic>{
            'date': d,
            'tempMin': mn?.toDouble() ?? 0.0,
            'tempMax': mx?.toDouble() ?? 0.0,
            'conditionCode': cd?.toInt() ?? 0,
            'description': _wmoDesc(cd?.toInt() ?? 0),
            'pop': p?.toInt() ?? 0,
          });
        }
      }
      if (filteredDaily.isEmpty) {
        throw Exception('No forecast data for those dates (max 16 days out).');
      }

      // 3. AI packing list
      final Response<dynamic> tripRes = await dio.post<dynamic>(
        '/api/trip',
        data: <String, dynamic>{
          'destination': placeLabel,
          'startDate': fmtStart,
          'endDate': fmtEnd,
          'daily': filteredDaily,
        },
      );
      final Map<String, dynamic> trip = tripRes.data as Map<String, dynamic>;
      setState(() {
        _result = <String, dynamic>{
          'destinationLabel': placeLabel,
          'summary': trip['summary'],
          'packing': trip['packing'] ?? <dynamic>[],
          'watchouts': trip['watchouts'] ?? <dynamic>[],
        };
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /// Pretty-prints the result for sharing via WhatsApp / Messages / etc.
  void _shareItinerary() {
    final Map<String, dynamic>? r = _result;
    if (r == null) return;
    final List<String> packing = (r['packing'] as List<dynamic>).cast<String>();
    final List<String> watchouts = (r['watchouts'] as List<dynamic>).cast<String>();
    final StringBuffer s = StringBuffer();
    s.writeln('Trip to ${r['destinationLabel']}');
    if (_startDate != null && _endDate != null) {
      final DateFormat df = DateFormat('MMM d');
      s.writeln('${df.format(_startDate!)} → ${df.format(_endDate!)}');
    }
    if (r['summary'] != null) {
      s.writeln();
      s.writeln(r['summary'] as String);
    }
    if (watchouts.isNotEmpty) {
      s.writeln();
      s.writeln('Watch out for:');
      for (final String w in watchouts) {
        s.writeln('• $w');
      }
    }
    if (packing.isNotEmpty) {
      s.writeln();
      s.writeln('Packing list:');
      for (int i = 0; i < packing.length; i++) {
        s.writeln('${i + 1}. ${packing[i]}');
      }
    }
    s.writeln();
    s.writeln('— planned with Atmos');
    Share.share(s.toString(), subject: 'Trip to ${r['destinationLabel']}');
  }

  String _wmoDesc(int code) {
    if (code == 0) return 'Clear';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Showers';
    if (code <= 99) return 'Thunderstorms';
    return 'Mixed';
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    final DateFormat df = DateFormat('MMM d');
    return Scaffold(
      backgroundColor: t.bg,
      body: AtmosphericBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 96),
            children: <Widget>[
              Row(
                children: <Widget>[
                  IconButton(icon: Icon(LucideIcons.arrowLeft, color: t.text), onPressed: () => context.go('/')),
                  Text('Trip Planner',
                      style: AtmosTypography.headline(
                          fontSize: 22, fontWeight: FontWeight.w700, color: t.text)),
                ],
              ),
              const SizedBox(height: 16),
              _input(t, LucideIcons.mapPin, 'Where are you going?', _destCtrl),
              const SizedBox(height: 12),
              Row(
                children: <Widget>[
                  Expanded(
                    child: _dateButton(t, 'Start', _startDate, df, () => _pickDate(true)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _dateButton(t, 'End', _endDate, df, () => _pickDate(false)),
                  ),
                ],
              ),
              if (_error != null) ...<Widget>[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.redAccent)),
              ],
              const SizedBox(height: 16),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: t.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: _loading ? null : _plan,
                icon: _loading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(LucideIcons.plane, size: 16),
                label: const Text('Plan trip'),
              ),
              if (_result != null) ...<Widget>[
                const SizedBox(height: 24),
                _summary(t, _result!['destinationLabel'] as String, _result!['summary'] as String? ?? ''),
                if ((_result!['watchouts'] as List<dynamic>).isNotEmpty) ...<Widget>[
                  const SizedBox(height: 12),
                  _watchouts(t, (_result!['watchouts'] as List<dynamic>).cast<String>()),
                ],
                const SizedBox(height: 12),
                _packing(t, (_result!['packing'] as List<dynamic>).cast<String>()),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: t.text,
                    side: BorderSide(color: t.outline),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: _shareItinerary,
                  icon: const Icon(LucideIcons.share2, size: 14),
                  label: const Text('Share itinerary'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _input(AtmosTokens t, IconData icon, String hint, TextEditingController ctrl) {
    return Container(
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: t.outline.withOpacity(0.5)),
      ),
      child: Row(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Icon(icon, size: 18, color: t.primary),
          ),
          Expanded(
            child: TextField(
              controller: ctrl,
              decoration: InputDecoration(
                hintText: hint,
                border: InputBorder.none,
                hintStyle: AtmosTypography.body(fontSize: 14, color: t.textMuted),
              ),
              style: AtmosTypography.body(fontSize: 15, color: t.text),
            ),
          ),
        ],
      ),
    );
  }

  Widget _dateButton(AtmosTokens t, String label, DateTime? date, DateFormat df, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: t.outline.withOpacity(0.5)),
        ),
        child: Row(
          children: <Widget>[
            Icon(LucideIcons.calendar, size: 18, color: t.primary),
            const SizedBox(width: 10),
            Text(date != null ? df.format(date) : label,
                style: AtmosTypography.body(
                    fontSize: 14, color: date != null ? t.text : t.textMuted)),
          ],
        ),
      ),
    );
  }

  Widget _summary(AtmosTokens t, String dest, String summary) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: t.outline.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(dest.toUpperCase(),
              style: AtmosTypography.label(
                  fontSize: 11, color: t.textMuted, letterSpacing: 1.2, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(summary, style: AtmosTypography.body(fontSize: 15, color: t.text)),
        ],
      ),
    );
  }

  Widget _watchouts(AtmosTokens t, List<String> items) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.amber.withOpacity(0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              const Icon(LucideIcons.alertTriangle, size: 16, color: Colors.amber),
              const SizedBox(width: 8),
              Text('Watch out for',
                  style: AtmosTypography.body(
                      fontSize: 14, color: t.text, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          ...items.map((String w) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Text('• $w',
                    style: AtmosTypography.label(fontSize: 12, color: t.textMuted)),
              )),
        ],
      ),
    );
  }

  Widget _packing(AtmosTokens t, List<String> items) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: t.outline.withOpacity(0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Row(
            children: <Widget>[
              Icon(LucideIcons.briefcase, size: 18, color: t.primary),
              const SizedBox(width: 8),
              Text('Packing list',
                  style: AtmosTypography.body(
                      fontSize: 14, color: t.text, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 12),
          ...List<Widget>.generate(items.length, (int i) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: <Widget>[
                  Container(
                    width: 22,
                    height: 22,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: t.surfaceMid,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Text('${i + 1}',
                        style: AtmosTypography.label(
                            fontSize: 10, color: t.primary, fontWeight: FontWeight.w700)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Text(items[i], style: AtmosTypography.body(fontSize: 14, color: t.text))),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
