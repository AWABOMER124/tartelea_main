import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/profile_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../../core/theme/app_colors.dart';
import 'package:go_router/go_router.dart';
import 'auth_screen.dart';
import '../widgets/common_app_bar.dart';
import 'package:google_fonts/google_fonts.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider);
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    if (user == null) {
      return const AuthScreen();
    }

    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CommonAppBar(
        actions: [
          IconButton(
            icon: Icon(
              Icons.settings_suggest_rounded,
              color: isDark ? AppColors.accent : AppColors.primary,
            ),
            onPressed: () {},
          ),
        ],
      ),
      body: Stack(
        children: [
          // ─── Premium Background Gradient ────────────────
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark
                    ? [
                        AppColors.darkBackground,
                        AppColors.darkSurface,
                        AppColors.darkBackground,
                      ]
                    : [
                        Colors.white,
                        AppColors.secondary.withAlpha(40),
                        Colors.white,
                      ],
                stops: const [0.0, 0.4, 1.0],
              ),
            ),
          ),

          profileAsync.when(
            data: (profile) {
              if (profile == null) {
                return Center(
                  child: Text(
                    'لم يتم العثور على الملف الشخصي',
                    style: GoogleFonts.tajawal(
                      color: isDark ? Colors.white : AppColors.foreground,
                    ),
                  ),
                );
              }
              return SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(0, 0, 0, 100),
                child: Column(
                  children: [
                    _buildPremiumHeader(profile, isDark),
                    const SizedBox(height: 16),
                    _buildSpiritualStats(isDark),
                    const SizedBox(height: 32),
                    _buildPremiumMenu(context, ref, isDark),
                  ],
                ),
              );
            },
            loading: () => const Center(
              child: CircularProgressIndicator(color: AppColors.accent),
            ),
            error: (err, stack) => Center(
              child: Text(
                'خطأ: $err',
                style: GoogleFonts.tajawal(color: Colors.red),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumHeader(dynamic profile, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 140, 24, 40),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withAlpha(8)
            : AppColors.secondary.withAlpha(30),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(48),
          bottomRight: Radius.circular(48),
        ),
        border: Border.all(
          color: isDark
              ? Colors.white.withAlpha(15)
              : AppColors.secondary.withAlpha(50),
        ),
      ),
      child: Column(
        children: [
          // Avatar with Glow
          Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 130,
                height: 130,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.accent.withAlpha(isDark ? 80 : 40),
                      blurRadius: 40,
                      spreadRadius: 5,
                    ),
                  ],
                  border: Border.all(
                    color: AppColors.accent.withAlpha(150),
                    width: 2,
                  ),
                ),
              ),
              CircleAvatar(
                radius: 54,
                backgroundColor: isDark ? AppColors.darkCard : Colors.white,
                backgroundImage: profile.avatarUrl != null
                    ? NetworkImage(profile.avatarUrl!)
                    : null,
                child: profile.avatarUrl == null
                    ? Icon(
                        Icons.person_rounded,
                        size: 60,
                        color: isDark ? Colors.white24 : AppColors.secondary,
                      )
                    : null,
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: AppColors.accent,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: Colors.black26, blurRadius: 10),
                    ],
                  ),
                  child: const Icon(
                    Icons.auto_awesome_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Name & Spiritual Rank
          Text(
            profile.fullName ?? 'سالك في رحاب الترتيل',
            style: GoogleFonts.amiri(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppColors.primary,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.accent.withAlpha(40),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.accent.withAlpha(100)),
            ),
            child: Text(
              'مقام السكينة - مستوى ٣',
              style: GoogleFonts.tajawal(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: isDark ? AppColors.accent : AppColors.primary,
              ),
            ),
          ),
          if (profile.bio != null) ...[
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                profile.bio!,
                textAlign: TextAlign.center,
                style: GoogleFonts.tajawal(
                  color: isDark ? Colors.white70 : AppColors.mutedForeground,
                  height: 1.5,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSpiritualStats(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatsCard(
            label: 'المسارات',
            value: '٣',
            icon: Icons.auto_stories_rounded,
            isDark: isDark,
          ),
          _StatsCard(
            label: 'القبسات',
            value: '١٢',
            icon: Icons.forum_rounded,
            isDark: isDark,
          ),
          _StatsCard(
            label: 'البراعة',
            value: '٤٥٠',
            icon: Icons.stars_rounded,
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumMenu(BuildContext context, WidgetRef ref, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          _PremiumMenuItem(
            icon: Icons.bookmark_border_rounded,
            label: 'أرشيف المفضلات',
            isDark: isDark,
            onTap: () {},
          ),
          _PremiumMenuItem(
            icon: Icons.history_edu_rounded,
            label: 'سجل السلوك الروحي',
            isDark: isDark,
            onTap: () => context.push('/portfolio'),
          ),
          _PremiumMenuItem(
            icon: Icons.receipt_long_rounded,
            label: 'الاشتراكات والمنح',
            isDark: isDark,
            onTap: () => context.push('/portfolio'),
          ),
          _PremiumMenuItem(
            icon: Icons.auto_awesome_rounded,
            label: 'خزانة الذكاء (AI)',
            isDark: isDark,
            onTap: () => context.push('/assistant'),
            accent: AppColors.accent,
          ),
          _PremiumMenuItem(
            icon: Icons.info_outline_rounded,
            label: 'عن مدرسة الترتيل',
            isDark: isDark,
            onTap: () => context.push('/about'),
          ),
          _PremiumMenuItem(
            icon: Icons.headset_mic_rounded,
            label: 'مجلس الدعم الفني',
            isDark: isDark,
            onTap: () {},
          ),
          const SizedBox(height: 32),
          _PremiumMenuItem(
            icon: Icons.logout_rounded,
            label: 'الخروج من الحساب',
            isDark: isDark,
            isDestructive: true,
            onTap: () => ref.read(authRepositoryProvider).signOut(),
          ),
        ],
      ),
    );
  }
}

class _StatsCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final bool isDark;
  const _StatsCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withAlpha(12) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: isDark
            ? []
            : [
                BoxShadow(
                  color: Colors.black.withAlpha(15),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
        border: Border.all(
          color: isDark
              ? Colors.white.withAlpha(20)
              : AppColors.secondary.withAlpha(80),
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.accent.withAlpha(30),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.accent, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.tajawal(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : AppColors.primary,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.tajawal(
              fontSize: 10,
              color: isDark ? Colors.white54 : AppColors.mutedForeground,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _PremiumMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? accent;
  final bool isDark;
  final bool isDestructive;

  const _PremiumMenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    required this.isDark,
    this.accent,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final color = isDestructive
        ? Colors.redAccent
        : (accent ??
              (isDark ? Colors.white.withAlpha(180) : AppColors.primary));

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withAlpha(8) : Colors.white.withAlpha(120),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withAlpha(15)
              : AppColors.secondary.withAlpha(50),
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withAlpha(20),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(
          label,
          style: GoogleFonts.tajawal(
            color: color,
            fontWeight: FontWeight.bold,
            fontSize: 15,
          ),
        ),
        trailing: Icon(
          Icons.chevron_left_rounded,
          size: 20,
          color: isDark ? Colors.white24 : AppColors.muted,
        ),
        onTap: onTap,
      ),
    );
  }
}
