import 'package:flutter/material.dart';

/// Wrap a Text in a linear gradient. Equivalent to:
/// `background: linear-gradient(135deg, from, to);
///  -webkit-background-clip: text; -webkit-text-fill-color: transparent;`
class GradientText extends StatelessWidget {
  const GradientText(
    this.text, {
    super.key,
    required this.style,
    this.gradient,
    this.textAlign,
    this.maxLines,
  });

  final String text;
  final TextStyle style;
  final LinearGradient? gradient;
  final TextAlign? textAlign;
  final int? maxLines;

  @override
  Widget build(BuildContext context) {
    final LinearGradient g = gradient ??
        const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[Color(0xFFC7BFFF), Color(0xFFACC7FF)],
        );
    return ShaderMask(
      blendMode: BlendMode.srcIn,
      shaderCallback: (Rect bounds) => g.createShader(bounds),
      child: Text(
        text,
        style: style.copyWith(color: Colors.white),
        textAlign: textAlign,
        maxLines: maxLines,
      ),
    );
  }
}
