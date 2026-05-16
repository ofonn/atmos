import 'package:flutter/material.dart';

import '../theme/colors.dart';
import '../theme/typography.dart';
import 'gradient_text.dart';

/// Replicates the container-query-driven headline on the home page.
/// Last word of the headline (or the entire payoff line) renders as gradient text.
class ResponsiveHeadline extends StatelessWidget {
  const ResponsiveHeadline({
    super.key,
    required this.headline,
    this.hook,
    this.twoLineMode = false,
  });

  final String headline;
  final String? hook;
  final bool twoLineMode;

  double _fontSizeFor(String text, double width, double height) {
    final int words = text.trim().split(RegExp(r'\s+')).where((String w) => w.isNotEmpty).length;
    double sizeByWidth;
    if (words <= 3) {
      sizeByWidth = width * 0.18;
    } else if (words <= 5) {
      sizeByWidth = width * 0.14;
    } else if (words <= 8) {
      sizeByWidth = width * 0.11;
    } else {
      sizeByWidth = width * 0.09;
    }
    final double sizeByHeight = height * 0.30;
    return sizeByWidth.clamp(26, 128).toDouble().clamp(0, sizeByHeight);
  }

  ({String plain, String gradient}) _split(String text) {
    final String clean = text.replaceAll(RegExp(r'[.!?,;]+$'), '');
    final List<String> words =
        clean.split(' ').where((String w) => w.isNotEmpty).toList();
    if (words.isEmpty) return (plain: '', gradient: '');
    final String last = words.removeLast();
    return (plain: words.join(' '), gradient: '$last.');
  }

  List<String> _buildLines(String plain, String gradient) {
    final List<String> words = plain.split(' ').where((String w) => w.isNotEmpty).toList();
    final int total = words.length + (gradient.isEmpty ? 0 : 1);
    if (total <= 3) {
      return <String>[
        ...words,
        if (gradient.isNotEmpty) gradient,
      ];
    }
    final List<String> lines = <String>[];
    for (int i = 0; i < words.length; i += 2) {
      lines.add(words.skip(i).take(2).join(' '));
    }
    if (gradient.isNotEmpty) {
      final String last = lines.isNotEmpty ? lines.last : '';
      if (last.isNotEmpty && !last.contains(' ')) {
        lines[lines.length - 1] = '$last $gradient';
      } else {
        lines.add(gradient);
      }
    }
    return lines.where((String l) => l.trim().isNotEmpty).toList();
  }

  @override
  Widget build(BuildContext context) {
    final AtmosTokens t = context.atmos;
    return LayoutBuilder(
      builder: (BuildContext _, BoxConstraints c) {
        final String displayText = twoLineMode && hook != null
            ? '${hook!} $headline'
            : headline;
        final double fontSize = _fontSizeFor(displayText, c.maxWidth, c.maxHeight);
        final LinearGradient grad = LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[t.gradientTextFrom, t.gradientTextTo],
        );

        // Two-line mode: hook (plain) + headline (entire payoff in gradient)
        if (twoLineMode && hook != null && hook!.trim().isNotEmpty) {
          final List<String> hookLines = _buildLines(hook!, '');
          final List<String> payoffLines = _buildLines('', headline);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              ...hookLines.map((String l) => Text(
                    l,
                    style: AtmosTypography.headline(
                      fontSize: fontSize,
                      fontWeight: FontWeight.w800,
                      color: t.text,
                      height: 1.05,
                    ),
                  )),
              ...payoffLines.map((String l) => GradientText(
                    l,
                    gradient: grad,
                    style: AtmosTypography.headline(
                      fontSize: fontSize,
                      fontWeight: FontWeight.w800,
                      height: 1.05,
                    ),
                  )),
            ],
          );
        }

        // Single-line mode: last word renders as gradient
        final ({String plain, String gradient}) parts = _split(headline);
        final List<String> lines = _buildLines(parts.plain, parts.gradient);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            for (int i = 0; i < lines.length; i++)
              if (i == lines.length - 1)
                GradientText(
                  lines[i],
                  gradient: grad,
                  style: AtmosTypography.headline(
                    fontSize: fontSize,
                    fontWeight: FontWeight.w800,
                    height: 1.05,
                  ),
                )
              else
                Text(
                  lines[i],
                  style: AtmosTypography.headline(
                    fontSize: fontSize,
                    fontWeight: FontWeight.w800,
                    color: t.text,
                    height: 1.05,
                  ),
                ),
          ],
        );
      },
    );
  }
}
