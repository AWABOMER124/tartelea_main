// lib/features/audio_rooms/presentation/widgets/control_button.dart
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

class ControlButton extends StatelessWidget {
  final IconData icon;
  final bool isActive;
  final bool isDark;
  final VoidCallback onTap;

  const ControlButton({
    super.key,
    required this.icon, 
    required this.isActive, 
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(30),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isActive 
            ? AppColors.spiritualGreen 
            : (isDark ? Colors.white.withAlpha(20) : AppColors.secondary.withAlpha(127)),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: isActive ? Colors.white : AppColors.primary, size: 24),
      ),
    );
  }
}
