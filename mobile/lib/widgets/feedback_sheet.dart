import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../state/api_providers.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

enum FeedbackCategory { bug, feature, ai, other }

extension on FeedbackCategory {
  String get label => switch (this) {
        FeedbackCategory.bug => 'Bug',
        FeedbackCategory.feature => 'Feature',
        FeedbackCategory.ai => 'AI quality',
        FeedbackCategory.other => 'Other',
      };
  String get value => switch (this) {
        FeedbackCategory.bug => 'bug',
        FeedbackCategory.feature => 'feature',
        FeedbackCategory.ai => 'ai',
        FeedbackCategory.other => 'other',
      };
}

class FeedbackSheet extends ConsumerStatefulWidget {
  const FeedbackSheet({super.key, this.initialCategory = FeedbackCategory.other});

  final FeedbackCategory initialCategory;

  static Future<void> show(BuildContext context, {FeedbackCategory? initial}) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext ctx) =>
          FeedbackSheet(initialCategory: initial ?? FeedbackCategory.other),
    );
  }

  @override
  ConsumerState<FeedbackSheet> createState() => _FeedbackSheetState();
}

class _FeedbackSheetState extends ConsumerState<FeedbackSheet> {
  late FeedbackCategory _cat = widget.initialCategory;
  final TextEditingController _ctrl = TextEditingController();
  bool _loading = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_ctrl.text.trim().isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final Dio dio = ref.read(dioProvider);
      await dio.post<dynamic>(
        '/api/feedback',
        data: <String, dynamic>{
          'category': _cat.value,
          'message': _ctrl.text.trim(),
          'source': 'android',
        },
      );
      if (!mounted) return;
      setState(() => _sent = true);
      Future<void>.delayed(const Duration(milliseconds: 1400), () {
        if (mounted) Navigator.of(context).maybePop();
      });
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        margin: const EdgeInsets.only(top: 80),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border.all(color: t.outline.withOpacity(0.5)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Container(
                width: 40,
                height: 5,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: t.textMuted.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(40),
                ),
              ),
              Text("Tell us what's on your mind",
                  style: AtmosTypography.headline(
                      fontSize: 20, fontWeight: FontWeight.w700, color: t.text)),
              const SizedBox(height: 6),
              Text('We read everything. Bugs, ideas, AI quirks.',
                  style: AtmosTypography.label(fontSize: 12, color: t.textMuted)),
              const SizedBox(height: 16),
              Row(
                children: FeedbackCategory.values.map((FeedbackCategory c) {
                  final bool active = _cat == c;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: GestureDetector(
                        onTap: () => setState(() => _cat = c),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: active ? t.primary : t.surfaceMid,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            c.label,
                            textAlign: TextAlign.center,
                            style: AtmosTypography.label(
                              fontSize: 11,
                              color: active ? Colors.white : t.textMuted,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _ctrl,
                maxLines: 5,
                maxLength: 4000,
                decoration: const InputDecoration(
                  hintText: 'What happened, or what would you like?',
                ),
              ),
              if (_error != null) ...<Widget>[
                const SizedBox(height: 4),
                Text(_error!,
                    style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
              ],
              const SizedBox(height: 4),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                    backgroundColor: t.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14)),
                onPressed: _loading ? null : _send,
                icon: _loading
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Icon(_sent ? LucideIcons.check : LucideIcons.send, size: 16),
                label: Text(_loading ? 'Sending…' : _sent ? 'Sent — thank you' : 'Send'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
