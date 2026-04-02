import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../providers/theme_provider.dart';

class CustomBottomNavBar extends ConsumerWidget {
  final int currentIndex;
  final Function(int) onTap;

  const CustomBottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.card,
        border: Border(
          top: BorderSide(color: isDark ? Colors.white.withAlpha(25) : AppColors.muted),
        ),
      ),
      child: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: onTap,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: isDark ? AppColors.accent : AppColors.primary,
        unselectedItemColor: isDark ? Colors.white.withAlpha(100) : AppColors.mutedForeground,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.library_books_outlined),
            activeIcon: Icon(Icons.library_books),
            label: 'المكتبة',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people_outline),
            activeIcon: Icon(Icons.people),
            label: 'المجتمع',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.mic_external_on_outlined),
            activeIcon: Icon(Icons.mic_external_on),
            label: 'الغرف الصوتية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'حسابي',
          ),
        ],
      ),
    );
  }
}
