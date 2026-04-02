import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/notification_provider.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/notification_model.dart';
import 'package:intl/intl.dart';
import '../providers/theme_provider.dart';
import '../widgets/common_app_bar.dart';
import 'package:google_fonts/google_fonts.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationProvider);
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CommonAppBar(titleText: 'منارة التنبيهات'),
      body: Stack(
        children: [
          // ─── Premium Background Gradients ────────────────
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark 
                  ? [AppColors.darkBackground, AppColors.darkSurface, AppColors.darkBackground]
                  : [Colors.white, AppColors.secondary.withAlpha(40), Colors.white],
                stops: const [0.0, 0.4, 1.0],
              ),
            ),
          ),
          
          notifications.isEmpty
            ? _buildEmptyState(isDark)
            : ListView.builder(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 140, 20, 100),
                itemCount: notifications.length,
                itemBuilder: (context, index) {
                  final n = notifications[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _NotificationCard(notification: n, isDark: isDark),
                  );
                },
              ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppColors.accent.withAlpha(isDark ? 30 : 20),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.notifications_none_rounded, 
              size: 80, 
              color: isDark ? AppColors.accent.withAlpha(150) : AppColors.primary.withAlpha(80),
            ),
          ),
          const SizedBox(height: 32),
          Text(
            'سكون الوعي ممتد...', 
            style: GoogleFonts.amiri(
              fontSize: 24, 
              fontWeight: FontWeight.bold,
              color: isDark ? AppColors.accent : AppColors.primary
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'لا توجد تنبيهات جديدة تنتظر انتباهك حالياً', 
            style: GoogleFonts.tajawal(
              color: isDark ? Colors.white54 : AppColors.mutedForeground,
              fontSize: 14
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends ConsumerWidget {
  final NotificationModel notification;
  final bool isDark;
  const _NotificationCard({required this.notification, required this.isDark});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: InkWell(
          onTap: () {
            ref.read(notificationProvider.notifier).markAsRead(notification.id);
          },
          borderRadius: BorderRadius.circular(24),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark 
                  ? (notification.isRead ? AppColors.darkCard.withAlpha(150) : AppColors.darkCard.withAlpha(220))
                  : (notification.isRead ? Colors.white.withAlpha(150) : AppColors.secondary.withAlpha(70)),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: notification.isRead 
                    ? (isDark ? Colors.white.withAlpha(25) : AppColors.secondary.withAlpha(80))
                    : AppColors.accent.withAlpha(150),
                width: notification.isRead ? 1 : 2,
              ),
              boxShadow: !notification.isRead ? [
                BoxShadow(
                  color: AppColors.accent.withAlpha(40),
                  blurRadius: 15,
                  spreadRadius: 2
                )
              ] : [],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon with Glow
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _getIconColor(notification.type).withAlpha(isDark ? 51 : 40),
                    shape: BoxShape.circle,
                    border: Border.all(color: _getIconColor(notification.type).withAlpha(100)),
                  ),
                  child: Icon(
                    _getIcon(notification.type), 
                    color: _getIconColor(notification.type), 
                    size: 22
                  ),
                ),
                const SizedBox(width: 16),
                
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              notification.title,
                              style: GoogleFonts.amiri(
                                fontWeight: FontWeight.bold,
                                color: isDark ? (notification.isRead ? Colors.white70 : Colors.white) : AppColors.primary,
                                fontSize: 17,
                                height: 1.1
                              ),
                            ),
                          ),
                          if (!notification.isRead)
                            Container(
                              width: 8, height: 8, 
                              decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle)
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        notification.body, 
                        style: GoogleFonts.tajawal(
                          color: isDark ? Colors.white.withAlpha(160) : AppColors.foreground, 
                          fontSize: 14,
                          height: 1.5,
                          fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(Icons.access_time_rounded, size: 12, color: isDark ? Colors.white24 : AppColors.mutedForeground),
                          const SizedBox(width: 6),
                          Text(
                            DateFormat('HH:mm - dd MMM', 'ar').format(notification.createdAt),
                            style: GoogleFonts.tajawal(
                              color: isDark ? Colors.white38 : AppColors.mutedForeground.withAlpha(180), 
                              fontSize: 11,
                              fontWeight: FontWeight.bold
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _getIcon(NotificationType type) {
    switch (type) {
      case NotificationType.room: return Icons.mic_rounded;
      case NotificationType.like: return Icons.favorite_rounded;
      case NotificationType.comment: return Icons.forum_rounded;
      default: return Icons.auto_awesome_rounded;
    }
  }

  Color _getIconColor(NotificationType type) {
    switch (type) {
      case NotificationType.room: return AppColors.accent;
      case NotificationType.like: return Colors.redAccent;
      case NotificationType.comment: return AppColors.spiritualGreen;
      default: return AppColors.secondary;
    }
  }
}
