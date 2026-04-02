import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class SpiritualJourneyTracker extends StatelessWidget {
  final int currentStation; // 0: Takhliya, 1: Tahliya, 2: Tajalli
  final double progress; // 0.0 to 1.0

  const SpiritualJourneyTracker({
    super.key,
    this.currentStation = 0,
    this.progress = 0.35,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'مسارك الروحي',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${(progress * 100).toInt()}% اكتمل',
                  style: TextStyle(
                    color: AppColors.accent,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Stack(
            children: [
              // Background line
              Positioned(
                top: 24,
                left: 30,
                right: 30,
                child: Container(
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              // Progress line
              Positioned(
                top: 24,
                left: 30,
                right: 30,
                child: FractionallySizedBox(
                  widthFactor: progress.clamp(0.0, 1.0),
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.accent, AppColors.accent.withValues(alpha: 0.5)],
                      ),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
              // Points
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStationPoint(context, 'التخلية', 'إفراغ القلب', currentStation >= 0, isDark),
                  _buildStationPoint(context, 'التحلية', 'تزيين الروح', currentStation >= 1, isDark),
                  _buildStationPoint(context, 'التجلي', 'نور الإشراق', currentStation >= 2, isDark),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStationPoint(BuildContext context, String title, String subtitle, bool isActive, bool isDark) {
    return Column(
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isActive ? AppColors.accent : (isDark ? AppColors.darkSurface : Colors.white),
            border: Border.all(
              color: isActive ? AppColors.accent : (isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.1)),
              width: 2,
            ),
            boxShadow: isActive ? [
              BoxShadow(
                color: AppColors.accent.withValues(alpha: 0.3),
                blurRadius: 10,
                spreadRadius: 2,
              )
            ] : [],
          ),
          child: Icon(
            isActive ? Icons.check : Icons.circle_outlined,
            color: isActive ? Colors.white : (isDark ? Colors.white.withValues(alpha: 0.3) : Colors.black.withValues(alpha: 0.1)),
            size: 20,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: isActive ? AppColors.accent : (isDark ? Colors.white.withValues(alpha: 0.5) : Colors.black.withValues(alpha: 0.4)),
            fontSize: 14,
          ),
        ),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 10,
            color: isDark ? Colors.white.withValues(alpha: 0.3) : Colors.black.withValues(alpha: 0.3),
          ),
        ),
      ],
    );
  }
}
