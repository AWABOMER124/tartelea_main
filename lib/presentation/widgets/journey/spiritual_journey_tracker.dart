import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/progress_model.dart';
import 'package:google_fonts/google_fonts.dart';

class SpiritualJourneyTracker extends StatelessWidget {
  final ProgressModel progress;
  final bool isDark;

  const SpiritualJourneyTracker({
    super.key,
    required this.progress,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
            blurRadius: 30,
            offset: const Offset(0, 12),
          ),
        ],
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.08) : AppColors.secondary.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'مستوى مقامك الروحي',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.mutedForeground,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    progress.currentRank,
                    style: GoogleFonts.amiri(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppColors.accent,
                      height: 1,
                    ),
                  ),
                ],
              ),
              _buildStreakBadge(),
            ],
          ),
          const SizedBox(height: 32),
          _buildStationRow(context),
          const SizedBox(height: 24),
          _buildOverallProgress(context),
        ],
      ),
    );
  }

  Widget _buildStationRow(BuildContext context) {
    return Stack(
      children: [
        Positioned(
          top: 18,
          left: 40,
          right: 40,
          child: Container(
            height: 2,
            color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.secondary.withValues(alpha: 0.2),
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildStationPoint('تخلية', progress.takhliyaProgress >= 1.0, 0),
            _buildStationPoint('تحلية', progress.tahliyaProgress >= 1.0, 1),
            _buildStationPoint('تجلي', progress.tajalliProgress >= 1.0, 2),
          ],
        ),
      ],
    );
  }

  Widget _buildStationPoint(String label, bool isComplete, int index) {
    final bool isActive = (index == 0 && progress.takhliyaProgress > 0) ||
                         (index == 1 && progress.tahliyaProgress > 0) ||
                         (index == 2 && progress.tajalliProgress > 0);
    
    return Column(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isComplete ? AppColors.accent : (isActive ? AppColors.accent.withValues(alpha: 0.2) : (isDark ? AppColors.darkSurface : Colors.white)),
            border: Border.all(
              color: isComplete ? AppColors.accent : (isActive ? AppColors.accent : (isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.secondary)),
              width: 2,
            ),
          ),
          child: Center(
            child: isComplete 
              ? const Icon(Icons.check, color: Colors.white, size: 18)
              : Text(
                  '${index + 1}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: isActive ? AppColors.accent : (isDark ? Colors.white.withValues(alpha: 0.3) : AppColors.mutedForeground),
                  ),
                ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            color: isActive ? (isDark ? Colors.white : AppColors.primary) : (isDark ? Colors.white.withValues(alpha: 0.3) : AppColors.mutedForeground),
          ),
        ),
      ],
    );
  }

  Widget _buildOverallProgress(BuildContext context) {
    final double totalProgress = (progress.takhliyaProgress + progress.tahliyaProgress + progress.tajalliProgress) / 3;
    
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'التقدم الإجمالي',
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.mutedForeground,
              ),
            ),
            Text(
              '${(totalProgress * 100).toInt()}%',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppColors.accent,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            value: totalProgress,
            minHeight: 6,
            backgroundColor: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.secondary.withValues(alpha: 0.2),
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accent),
          ),
        ),
      ],
    );
  }

  Widget _buildStreakBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.local_fire_department_rounded, color: AppColors.accent, size: 20),
          const SizedBox(width: 6),
          Text(
            '${progress.spiritualDaysStreak} أيام',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
