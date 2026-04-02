// lib/features/audio_rooms/presentation/widgets/floating_emoji.dart
import 'dart:math' as math;
import 'package:flutter/material.dart';

class FloatingEmoji extends StatefulWidget {
  final String emoji;
  final VoidCallback onComplete;
  
  const FloatingEmoji({super.key, required this.emoji, required this.onComplete});

  @override
  State<FloatingEmoji> createState() => _FloatingEmojiState();
}

class _FloatingEmojiState extends State<FloatingEmoji> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _yPosition;
  late Animation<double> _opacity;
  late double _startX;

  @override
  void initState() {
    super.initState();
    _startX = 50.0 + math.Random().nextDouble() * 100.0;
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 3));
    _yPosition = Tween<double>(begin: 0, end: -400).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _opacity = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 20),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.0), weight: 50),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 30),
    ]).animate(_controller);

    _controller.forward().then((_) => widget.onComplete());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Positioned(
          bottom: 100 + (-_yPosition.value),
          right: _startX + (math.sin(_controller.value * 10) * 20),
          child: Opacity(
            opacity: _opacity.value,
            child: Text(widget.emoji, style: const TextStyle(fontSize: 24)),
          ),
        );
      },
    );
  }
}
