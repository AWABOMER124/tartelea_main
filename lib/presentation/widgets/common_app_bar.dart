import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/theme_provider.dart';
import '../providers/notification_provider.dart';
import '../../core/theme/app_colors.dart';

class CommonAppBar extends ConsumerWidget implements PreferredSizeWidget {
  final String? titleText;
  final List<Widget>? actions;
  final bool showHomeLink;
  final bool transparent;
  final PreferredSizeWidget? bottom;

  const CommonAppBar({
    super.key,
    this.titleText,
    this.actions,
    this.showHomeLink = true,
    this.transparent = true,
    this.bottom,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final isDark = themeMode == ThemeMode.dark;
    final unreadCount = ref.watch(unreadNotificationsCountProvider);

    final titleColor = isDark ? Colors.white : AppColors.primary;
    final iconColor = isDark ? Colors.white : AppColors.primary;

    return AppBar(
      backgroundColor: transparent ? Colors.transparent : null,
      elevation: 0,
      centerTitle: true,
      leadingWidth: 100,
      leading: Padding(
        padding: const EdgeInsets.only(right: 8),
        child: Row(
          children: [
            IconButton(
              icon: Icon(
                isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                color: iconColor,
              ),
              onPressed: () => ref.read(themeProvider.notifier).toggleTheme(),
              tooltip: 'الوضع الليلي',
            ),
            IconButton(
              icon: Icon(Icons.info_outline, color: iconColor),
              onPressed: () => context.push('/about'),
              tooltip: 'عن المدرسة',
            ),
          ],
        ),
      ),
      title: InkWell(
        onTap: showHomeLink ? () => context.go('/') : null,
        borderRadius: BorderRadius.circular(8),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                image: const DecorationImage(
                  image: AssetImage('assets/images/logo.jpg'),
                  fit: BoxFit.cover,
                ),
                border: Border.all(
                  color: AppColors.accent.withValues(alpha: 0.5),
                  width: 1,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              titleText ?? 'المدرسة الترتيلية',
              style: GoogleFonts.amiri(
                color: titleColor,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
          ],
        ),
      ),
      iconTheme: IconThemeData(color: iconColor),
      actions: [
        if (actions != null) ...actions!,
        Stack(
          children: [
            IconButton(
              icon: Icon(Icons.notifications_none_outlined, color: iconColor, size: 28),
              onPressed: () => context.push('/notifications'),
            ),
            if (unreadCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: AppColors.secondary, shape: BoxShape.circle),
                  constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                  child: Text(
                    unreadCount > 9 ? '+9' : unreadCount.toString(),
                    style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(width: 8),
      ],
      bottom: bottom,
    );
  }

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight + (bottom?.preferredSize.height ?? 0));
}
