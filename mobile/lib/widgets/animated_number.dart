import 'package:flutter/material.dart';

class AnimatedNumber extends StatefulWidget {
  const AnimatedNumber({
    super.key,
    required this.value,
    required this.format,
    this.duration = const Duration(milliseconds: 600),
    this.style,
    this.textAlign,
  });

  final double value;
  final String Function(double) format;
  final Duration duration;
  final TextStyle? style;
  final TextAlign? textAlign;

  @override
  State<AnimatedNumber> createState() => _AnimatedNumberState();
}

class _AnimatedNumberState extends State<AnimatedNumber> {
  late double _from = widget.value;
  late double _to = widget.value;

  @override
  void didUpdateWidget(covariant AnimatedNumber oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _from = oldWidget.value;
      _to = widget.value;
    }
  }

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: _from, end: _to),
      duration: widget.duration,
      curve: Curves.easeOutCubic,
      builder: (BuildContext _, double v, Widget? __) => Text(
        widget.format(v),
        style: widget.style,
        textAlign: widget.textAlign,
      ),
    );
  }
}
