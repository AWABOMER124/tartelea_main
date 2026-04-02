import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/post_provider.dart';
import '../../core/theme/app_colors.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../widgets/common_app_bar.dart';
import '../providers/theme_provider.dart';
import 'package:google_fonts/google_fonts.dart';

class CommunityScreen extends ConsumerWidget {
  const CommunityScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postsAsync = ref.watch(postsProvider(null));
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CommonAppBar(titleText: 'مجتمعات الترتيل'),
      body: Stack(
        children: [
          // ─── Premium Background ──────────────────────────
          Container(
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
          ),
          
          postsAsync.when(
            data: (posts) => ListView.builder(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(20, 140, 20, 100),
              itemCount: posts.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 32),
                    child: _buildCreatePostBox(context, ref, isDark),
                  );
                }
                final post = posts[index - 1];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: _PostCard(post: post, isDark: isDark),
                );
              },
            ),
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
            error: (err, stack) => Center(
              child: Text(
                'عذراً، فشل تحميل المساحة: $err', 
                style: GoogleFonts.tajawal(color: Colors.red),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreatePostDialog(context, ref, isDark),
        backgroundColor: AppColors.accent,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        child: const Icon(Icons.add_comment_rounded, color: Colors.white, size: 28),
      ),
    );
  }

  Widget _buildCreatePostBox(BuildContext context, WidgetRef ref, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard.withAlpha(180) : Colors.white.withAlpha(180),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(isDark ? 80 : 25),
            blurRadius: 30,
            offset: const Offset(0, 12),
          ),
        ],
        border: Border.all(
          color: isDark ? Colors.white.withAlpha(51) : AppColors.secondary.withAlpha(127),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.accent.withAlpha(100), width: 2),
                ),
                child: CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.primary.withAlpha(51),
                  child: const Icon(Icons.person_rounded, color: AppColors.accent),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: InkWell(
                  onTap: () => _showCreatePostDialog(context, ref, isDark),
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withAlpha(15) : AppColors.secondary.withAlpha(40),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'بماذا تفكر؟ شاركنا قبساً من وعيك...',
                      style: GoogleFonts.tajawal(
                        color: isDark ? Colors.white.withAlpha(120) : AppColors.mutedForeground,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showCreatePostDialog(BuildContext context, WidgetRef ref, bool isDark) {
    final bodyController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : Colors.white,
          borderRadius: const BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
          boxShadow: [
            BoxShadow(color: Colors.black.withAlpha(100), blurRadius: 40),
          ],
        ),
        child: Column(
          children: [
            // Handle
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: isDark ? Colors.white24 : Colors.black12, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 12),
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   Text(
                    'بماذا تفكر؟', 
                    style: GoogleFonts.amiri(
                      fontSize: 24, 
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.accent : AppColors.primary,
                    ),
                  ),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('إلغاء', style: GoogleFonts.tajawal(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const Divider(),
            
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    TextField(
                      controller: bodyController,
                      maxLines: null,
                      autofocus: true,
                      style: GoogleFonts.tajawal(
                        fontSize: 18, 
                        height: 1.6,
                        color: isDark ? Colors.white.withAlpha(220) : AppColors.foreground,
                      ),
                      decoration: InputDecoration(
                        hintText: 'اكتب ما يفيض به وعيك هنا...',
                        hintStyle: GoogleFonts.tajawal(color: isDark ? Colors.white24 : AppColors.mutedForeground, fontSize: 16),
                        border: InputBorder.none,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                height: 60,
                child: ElevatedButton(
                  onPressed: () async {
                    if (bodyController.text.isNotEmpty) {
                      try {
                        // استخراج "عنوان تقني" من بداية النص للكواليس
                        final String techTitle = bodyController.text.length > 30 
                          ? '${bodyController.text.substring(0, 30)}...' 
                          : bodyController.text;

                        await ref.read(postRepositoryProvider).createPost(
                          title: techTitle,
                          body: bodyController.text,
                          category: 'عام',
                        );
                        if (context.mounted) Navigator.pop(context);
                        ref.invalidate(postsProvider);
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('عذراً: $e')));
                        }
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    elevation: 8,
                    shadowColor: AppColors.accent.withAlpha(100),
                  ),
                  child: Text(
                    'نشر المنشور', 
                    style: GoogleFonts.tajawal(fontWeight: FontWeight.w900, fontSize: 18)
                  ),
                ),
              ),
            ),
            SizedBox(height: MediaQuery.of(context).viewInsets.bottom),
          ],
        ),
      ),
    );
  }
}

class _PostCard extends ConsumerWidget {
  final dynamic post;
  final bool isDark;

  const _PostCard({required this.post, required this.isDark});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard.withAlpha(150) : Colors.white.withAlpha(180),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(
              color: isDark ? Colors.white.withAlpha(25) : AppColors.secondary.withAlpha(100),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.accent.withAlpha(80), width: 1.5),
                      ),
                      child: CircleAvatar(
                        radius: 18,
                        backgroundColor: isDark ? AppColors.primary.withAlpha(50) : AppColors.secondary.withAlpha(50),
                        child: Icon(Icons.person_rounded, color: isDark ? Colors.white : AppColors.primary, size: 20),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'سالك في رحاب الوعي',
                          style: GoogleFonts.tajawal(
                            fontWeight: FontWeight.w800, 
                            fontSize: 13, 
                            color: isDark ? Colors.white : AppColors.primary,
                          ),
                        ),
                        Text(
                          DateFormat('dd MMMM, yyyy', 'ar').format(post.createdAt),
                          style: GoogleFonts.tajawal(color: isDark ? Colors.white54 : AppColors.mutedForeground, fontSize: 9, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    const Spacer(),
                    _CategoryBadge(label: post.category, isDark: isDark),
                  ],
                ),
              ),

              // Content Area (No Title Bar)
              InkWell(
                onTap: () => context.go('/post/${post.id}'),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (post.body != null)
                        Text(
                          post.body!,
                          maxLines: 6,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.tajawal(
                            color: isDark ? Colors.white.withAlpha(220) : AppColors.foreground, 
                            height: 1.6,
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                ),
              ),

              // Footer Actions
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withAlpha(10) : AppColors.secondary.withAlpha(30),
                  borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
                ),
                child: Row(
                  children: [
                    _ActionButton(
                      icon: Icons.favorite_border_rounded, 
                      label: 'أعجبني', 
                      isDark: isDark,
                      activeColor: Colors.redAccent,
                      onTap: () async {
                        await ref.read(postRepositoryProvider).likePost(post.id);
                      }
                    ),
                    const SizedBox(width: 8),
                    _ActionButton(
                      icon: Icons.chat_bubble_outline_rounded, 
                      label: 'تعليق', 
                      isDark: isDark,
                      activeColor: AppColors.accent,
                      onTap: () {
                        context.go('/post/${post.id}');
                      }
                    ),
                    const Spacer(),
                    IconButton(
                      icon: Icon(Icons.ios_share_rounded, size: 16, color: isDark ? Colors.white38 : AppColors.primary.withAlpha(120)),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
            ],
          ),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? AppColors.accent.withAlpha(40) : AppColors.secondary.withAlpha(100),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.accent.withAlpha(isDark ? 80 : 40)),
      ),
      child: Text(
        label,
        style: GoogleFonts.tajawal(
          color: isDark ? AppColors.accent : AppColors.primary, 
          fontSize: 9, 
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
  final Color activeColor;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon, 
    required this.label, 
    required this.isDark, 
    required this.activeColor,
    required this.onTap
  });

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 16, color: isDark ? Colors.white70 : AppColors.primary),
      label: Text(
        label, 
        style: GoogleFonts.tajawal(
          color: isDark ? Colors.white70 : AppColors.primary, 
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
      style: TextButton.styleFrom(
        foregroundColor: activeColor,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }
}
