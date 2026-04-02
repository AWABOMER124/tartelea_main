import 'dart:ui';
import 'package:flutter/material.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final double? borderRadius;
  final EdgeInsetsGeometry? padding;
  final double? blur;
  final Color? color;
  final Border? border;
  final Gradient? gradient;

  const GlassCard({
    super.key,
    required this.child,
    this.borderRadius,
    this.padding,
    this.blur,
    this.color,
    this.border,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius ?? 24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur ?? 10, sigmaY: blur ?? 10),
        child: Container(
          padding: padding ?? const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(borderRadius ?? 24),
            border: border ?? Border.all(
              color: isDark 
                  ? Colors.white.withValues(alpha: 0.1) 
                  : Colors.black.withValues(alpha: 0.05),
              width: 1,
            ),
            gradient: gradient ?? LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                (color ?? (isDark ? Colors.white : Colors.black)).withValues(alpha: isDark ? 0.08 : 0.02),
                (color ?? (isDark ? Colors.white : Colors.black)).withValues(alpha: isDark ? 0.03 : 0.01),
              ],
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
