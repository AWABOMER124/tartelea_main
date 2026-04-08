import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class SystemConfigErrorScreen extends StatelessWidget {
  final String message;

  const SystemConfigErrorScreen({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 64),
                const SizedBox(height: 16),
                Text(
                  'إعدادات التطبيق غير مكتملة',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppColors.primary,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'يرجى تمرير متغيرات التشغيل المطلوبة عبر --dart-define قبل تشغيل التطبيق.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: isDark ? Colors.white70 : AppColors.mutedForeground,
                  ),
                ),
                const SizedBox(height: 16),
                SelectableText(
                  message,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: isDark ? Colors.white54 : Colors.black54,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
