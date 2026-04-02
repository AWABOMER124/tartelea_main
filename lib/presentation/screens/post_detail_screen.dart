import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/post_provider.dart';
import 'package:intl/intl.dart';
import '../providers/theme_provider.dart';
import '../widgets/common_app_bar.dart';
import '../../core/theme/app_colors.dart';
import 'package:google_fonts/google_fonts.dart';

class PostDetailScreen extends ConsumerWidget {
  final String id;

  const PostDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postAsync = ref.watch(postsProvider(null)).whenData(
      (list) => list.firstWhere((e) => e.id == id),
    );
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CommonAppBar(titleText: 'رحاب المنشور'),
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDark 
              ? [AppColors.darkBackground, AppColors.darkSurface, AppColors.darkBackground]
              : [Colors.white, AppColors.secondary.withAlpha(51), Colors.white],
            stops: const [0.0, 0.4, 1.0],
          ),
        ),
        child: postAsync.when(
          data: (post) => SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 140, 20, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Post Body Container
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard.withAlpha(180) : Colors.white,
                    borderRadius: BorderRadius.circular(32),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(isDark ? 80 : 25),
                        blurRadius: 30,
                        offset: const Offset(0, 15),
                      ),
                    ],
                    border: Border.all(
                      color: isDark ? Colors.white.withAlpha(40) : AppColors.secondary.withAlpha(100),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(2),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.accent.withAlpha(100), width: 2),
                            ),
                            child: CircleAvatar(
                              radius: 24,
                              backgroundColor: isDark ? AppColors.primary.withAlpha(51) : AppColors.secondary.withAlpha(51),
                              child: Icon(Icons.person_rounded, color: isDark ? Colors.white : AppColors.primary, size: 28),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'سالك في رحاب الوعي', 
                                style: GoogleFonts.tajawal(
                                  fontWeight: FontWeight.w900, 
                                  fontSize: 16,
                                  color: isDark ? Colors.white : AppColors.primary,
                                ),
                              ),
                              Text(
                                DateFormat('dd MMMM, yyyy', 'ar').format(post.createdAt),
                                style: GoogleFonts.tajawal(
                                  color: isDark ? Colors.white54 : AppColors.mutedForeground, 
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          const Spacer(),
                          _CategoryBadge(label: post.category, isDark: isDark),
                        ],
                      ),
                      const SizedBox(height: 32),
                      Text(
                        post.title,
                        style: GoogleFonts.amiri(
                          fontSize: 28, 
                          fontWeight: FontWeight.bold, 
                          color: isDark ? AppColors.accent : AppColors.primary,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        post.body ?? '',
                        style: GoogleFonts.tajawal(
                          fontSize: 17, 
                          height: 1.8, 
                          color: isDark ? Colors.white.withAlpha(204) : AppColors.foreground,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 32),
                      const Divider(),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          _ActionButton(icon: Icons.favorite_border_rounded, label: 'أعجبني', isDark: isDark),
                          const SizedBox(width: 24),
                          _ActionButton(icon: Icons.ios_share_rounded, label: 'مشاركة القبس', isDark: isDark),
                        ],
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 48),
                
                // Comments Section Header
                Row(
                  children: [
                    Text(
                      'مجالس النقاش',
                      style: GoogleFonts.amiri(
                        fontSize: 24, 
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withAlpha(50),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'قريباً',
                        style: GoogleFonts.tajawal(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.accent),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Empty Comments Placeholder
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(40),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withAlpha(10) : AppColors.secondary.withAlpha(30),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(style: BorderStyle.none),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.forum_outlined, size: 48, color: isDark ? Colors.white24 : AppColors.primary.withAlpha(100)),
                      const SizedBox(height: 16),
                      Text(
                        'كن أول من يشارك قبس وعيه في هذا المجلس',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.tajawal(
                          color: isDark ? Colors.white38 : AppColors.mutedForeground,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
          error: (err, stack) => Center(child: Text('خطأ: $err', style: GoogleFonts.tajawal(color: Colors.red))),
        ),
      ),
    );
  }
}

class _CategoryBadge extends StatelessWidget {
  final String label;
  final bool isDark;
  const _CategoryBadge({required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.accent.withAlpha(40) : AppColors.secondary.withAlpha(100),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.accent.withAlpha(isDark ? 80 : 40)),
      ),
      child: Text(
        label,
        style: GoogleFonts.tajawal(
          color: isDark ? AppColors.accent : AppColors.primary, 
          fontSize: 11, 
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isDark;

  const _ActionButton({required this.icon, required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: isDark ? Colors.white70 : AppColors.primary),
        const SizedBox(width: 8),
        Text(
          label, 
          style: GoogleFonts.tajawal(
            color: isDark ? Colors.white70 : AppColors.primary, 
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}
