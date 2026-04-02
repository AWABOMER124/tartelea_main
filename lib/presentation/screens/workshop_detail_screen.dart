import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/workshop_provider.dart';
import '../../core/theme/app_colors.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../providers/theme_provider.dart';
import '../widgets/common_app_bar.dart';
import 'package:url_launcher/url_launcher.dart';

class WorkshopDetailScreen extends ConsumerWidget {
  final String id;

  const WorkshopDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workshopAsync = ref.watch(workshopsProvider).whenData(
      (list) => list.firstWhere((e) => e.id == id),
    );
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CommonAppBar(titleText: 'تفاصيل ورشة العمل'),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark 
              ? [AppColors.darkBackground, AppColors.darkSurface]
              : [Colors.white, AppColors.secondary.withAlpha(51)],
          ),
        ),
        child: workshopAsync.when(
          data: (workshop) => SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 120, 24, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  workshop.title,
                  style: TextStyle(
                    fontSize: 24, 
                    fontWeight: FontWeight.bold, 
                    color: isDark ? Colors.white : AppColors.primary,
                  ),
                ),
                const SizedBox(height: 16),
                _buildInfoRow(Icons.calendar_today, 'الموعد', 
                  workshop.scheduledAt != null ? DateFormat('MMM dd, yyyy - HH:mm').format(workshop.scheduledAt!) : 'غير محدد', isDark),
                const SizedBox(height: 8),
                _buildInfoRow(Icons.info_outline, 'الحالة', workshop.status, isDark),
                const SizedBox(height: 32),
                Text(
                  'عن ورشة العمل',
                  style: TextStyle(
                    fontSize: 18, 
                    fontWeight: FontWeight.bold, 
                    color: isDark ? Colors.white : AppColors.primary,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  workshop.description ?? 'لا يوجد وصف متاح.',
                  style: TextStyle(
                    fontSize: 16, 
                    height: 1.6, 
                    color: isDark ? Colors.white.withAlpha(204) : AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 40),
                if (workshop.status == 'live' && workshop.meetingUrl != null)
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () => launchUrl(Uri.parse(workshop.meetingUrl!)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        foregroundColor: AppColors.primary,
                      ),
                      child: const Text('انضم الآن (مباشر)'),
                    ),
                  ),
                if (workshop.status == 'completed')
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: OutlinedButton(
                      onPressed: () {
                        context.go('/recording', extra: {
                          'url': 'https://example.com/demo-video.mp4', 
                          'title': workshop.title,
                        });
                      },
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: isDark ? Colors.white24 : AppColors.secondary),
                        foregroundColor: isDark ? Colors.white : AppColors.primary,
                      ),
                      child: const Text('عرض التسجيل'),
                    ),
                  ),
              ],
            ),
          ),
          loading: () => Center(child: CircularProgressIndicator(color: isDark ? Colors.white : AppColors.primary)),
          error: (err, stack) => Center(child: Text('خطأ: $err', style: TextStyle(color: isDark ? Colors.white : AppColors.foreground))),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, bool isDark) {
    return Row(
      children: [
        Icon(icon, size: 18, color: isDark ? AppColors.secondary : AppColors.primary),
        const SizedBox(width: 8),
        Text('$label: ', style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppColors.primary)),
        Text(value, style: TextStyle(color: isDark ? Colors.white70 : AppColors.foreground)),
      ],
    );
  }
}
