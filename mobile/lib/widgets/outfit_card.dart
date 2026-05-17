import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../state/api_providers.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

class OutfitCard extends ConsumerStatefulWidget {
  const OutfitCard({
    super.key,
    required this.temp,
    required this.feelsLike,
    required this.conditionCode,
    required this.windSpeed,
    required this.humidity,
    this.pop,
  });

  final double temp;
  final double feelsLike;
  final int conditionCode;
  final double windSpeed;
  final double humidity;
  final double? pop;

  @override
  ConsumerState<OutfitCard> createState() => _OutfitCardState();
}

class _OutfitCardState extends ConsumerState<OutfitCard> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;

  int get _cacheKey =>
      widget.temp.round() * 1000 + widget.conditionCode;

  int? _lastKey;

  @override
  void didUpdateWidget(covariant OutfitCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_lastKey != _cacheKey) _fetch();
  }

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    _lastKey = _cacheKey;
    setState(() {
      _loading = true;
      _error = null;
    });
    final Dio dio = ref.read(dioProvider);
    try {
      final Response<dynamic> res = await dio.post<dynamic>(
        '/api/outfit',
        data: <String, dynamic>{
          'temp': widget.temp,
          'feelsLike': widget.feelsLike,
          'conditionCode': widget.conditionCode,
          'windSpeed': widget.windSpeed,
          'humidity': widget.humidity,
          'pop': widget.pop ?? 0,
        },
      );
      if (!mounted) return;
      setState(() {
        _data = res.data as Map<String, dynamic>;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
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
              Icon(LucideIcons.shirt, size: 18, color: t.primary),
              const SizedBox(width: 8),
              Text('What to wear',
                  style: AtmosTypography.body(
                      fontSize: 14, color: t.text, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 12),
          if (_loading)
            Row(children: <Widget>[
              SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(strokeWidth: 2, color: t.primary),
              ),
              const SizedBox(width: 8),
              Text('Thinking…',
                  style: AtmosTypography.label(fontSize: 12, color: t.textMuted)),
            ])
          else if (_error != null || _data == null)
            Text("Couldn't generate a recommendation.",
                style: AtmosTypography.label(fontSize: 12, color: t.textMuted))
          else ...<Widget>[
            Text(_data!['tldr'] as String? ?? '',
                style: AtmosTypography.headline(
                    fontSize: 16, color: t.text, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ((_data!['items'] as List<dynamic>?) ?? <dynamic>[])
                  .map((dynamic e) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: t.surfaceMid,
                          borderRadius: BorderRadius.circular(40),
                        ),
                        child: Text(e.toString(),
                            style: AtmosTypography.label(fontSize: 12, color: t.text)),
                      ))
                  .toList(),
            ),
            if (_data!['tip'] != null) ...<Widget>[
              const SizedBox(height: 12),
              Divider(color: t.outline.withOpacity(0.5), height: 1),
              const SizedBox(height: 12),
              Text(_data!['tip'] as String,
                  style: AtmosTypography.label(fontSize: 12, color: t.textMuted)),
            ],
          ],
        ],
      ),
    );
  }
}
