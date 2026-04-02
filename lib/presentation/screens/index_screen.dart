import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/promo_banner.dart';
import '../widgets/common_app_bar.dart';

import 'package:tartelea_flutter/presentation/widgets/media/horizontal_content_card.dart';
import 'package:tartelea_flutter/presentation/providers/content_provider.dart';
import 'package:tartelea_flutter/presentation/providers/progress_provider.dart';
import 'package:tartelea_flutter/presentation/widgets/journey/spiritual_journey_tracker.dart';

class IndexScreen extends ConsumerWidget {
  const IndexScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider);
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final latestContentsAsync = ref.watch(contentsProvider(null));
    final journeyProgress = ref.watch(userProgressProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CommonAppBar(titleText: 'المدرسة الترتيلية'),
      body: Stack(
        children: [
          // ─── Premium Background Gradient ─────────────────────
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark 
                  ? [AppColors.darkBackground, AppColors.darkSurface, AppColors.darkBackground]
                  : [Colors.white, AppColors.secondary.withValues(alpha: 0.15), Colors.white],
                stops: const [0.0, 0.4, 1.0],
              ),
            ),
          ),
          
          // Subtle Decorative Flare
          Positioned(
            top: -50,
            right: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.accent.withValues(alpha: isDark ? 0.1 : 0.08),
                    Colors.transparent
                  ],
                ),
              ),
            ),
          ),

          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.only(bottom: 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 120),
                
                // ─── Welcome Header ────────────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: _buildLogoHeader(context, isDark),
                ),
                
                const SizedBox(height: 48),
                
                // ─── Journey Tracker (Active User) ─────────────────
                if (journeyProgress != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: SpiritualJourneyTracker(progress: journeyProgress, isDark: isDark),
                  ),
                
                const SizedBox(height: 64),
                
                // ─── Sanctuary Paths Section ───────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'مسارات التزكية',
                        style: GoogleFonts.amiri(
                          fontSize: 26, 
                          fontWeight: FontWeight.bold, 
                          color: isDark ? AppColors.accent : AppColors.primary
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(width: 40, height: 3, decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(2))),
                    ],
                  ),
                ),
                const SizedBox(height: 28),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _buildSanctuaryCards(context, isDark),
                ),
                
                const SizedBox(height: 64),
                
                // ─── Latest Knowledge Section ──────────────────────
                _buildLatestSection(context, latestContentsAsync, isDark),
                
                const SizedBox(height: 64),
                
                // ─── Explore Platform Section ──────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: _buildExplorePlatform(context, isDark),
                ),
                
                const SizedBox(height: 64),
                
                // ─── Curated Quote & Promo ─────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    children: [
                      const PromoBanner(),
                      const SizedBox(height: 56),
                      _buildQuoteBanner(context, isDark),
                      const SizedBox(height: 56),
                      if (user == null) _buildJoinPrompt(context, isDark),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoHeader(BuildContext context, bool isDark) {
    return Center(
      child: Column(
        children: [
          Hero(
            tag: 'app_logo',
            child: Container(
              height: 130,
              width: 130,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.2),
                    blurRadius: 40,
                    offset: const Offset(0, 15),
                  ),
                ],
                image: const DecorationImage(
                  image: AssetImage('assets/images/logo.jpg'),
                  fit: BoxFit.cover,
                ),
                border: Border.all(
                  color: AppColors.accent.withValues(alpha: 0.6),
                  width: 3,
                ),
              ),
            ),
          ),
          const SizedBox(height: 28),
          Text(
            'المدرسة الترتيلية',
            style: GoogleFonts.amiri(
              fontSize: 38,
              fontWeight: FontWeight.w900,
              color: isDark ? AppColors.accent : AppColors.primary,
              letterSpacing: -0.5,
              height: 1,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '« لا تستوحش طريق الوعي لقلة السالكين »',
            textAlign: TextAlign.center,
            style: GoogleFonts.tajawal(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white54 : AppColors.mutedForeground,
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLatestSection(BuildContext context, AsyncValue<List<dynamic>> latestContentsAsync, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'آخر الإضافات المعرفية',
                style: GoogleFonts.amiri(
                  fontSize: 24, 
                  fontWeight: FontWeight.bold, 
                  color: isDark ? AppColors.accent : AppColors.primary
                ),
              ),
              InkWell(
                onTap: () => context.go('/library'),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    'عرض المكتبة ➔', 
                    style: GoogleFonts.tajawal(
                      color: AppColors.accent, 
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    )
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 260,
          child: latestContentsAsync.when(
            data: (contents) => ListView.builder(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: contents.length > 5 ? 5 : contents.length,
              itemBuilder: (context, index) => HorizontalContentCard(content: contents[index], isDark: isDark),
            ),
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
            error: (err, stack) => Center(child: Text('لا يمكن تحميل المحتوى حالياً', style: GoogleFonts.tajawal())),
          ),
        ),
      ],
    );
  }

  Widget _buildSanctuaryCards(BuildContext context, bool isDark) {
    final items = [
      {'emoji': '🌱', 'title': 'اخلع', 'desc': 'تصفية الوعي', 'color': AppColors.spiritualGreen, 'category': 'takhliya'},
      {'emoji': '📖', 'title': 'تدبر', 'desc': 'فهم اللسان', 'color': AppColors.accent, 'category': 'tahliya'},
      {'emoji': '🌟', 'title': 'رتل', 'desc': 'ترقية الروح', 'color': AppColors.primary, 'category': 'tajalli'},
    ];

    return Row(
      children: items.map((item) {
        final itemColor = item['color'] as Color;
        return Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 8),
            child: InkWell(
              onTap: () => context.go('/library', extra: item['category']),
              borderRadius: BorderRadius.circular(28),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 12),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    )
                  ],
                  border: Border.all(
                    color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.secondary.withValues(alpha: 0.2),
                    width: 1,
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: itemColor.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Text(item['emoji'] as String, style: const TextStyle(fontSize: 28)),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      item['title'] as String,
                      style: GoogleFonts.amiri(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item['desc'] as String,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.tajawal(
                        fontSize: 12,
                        color: isDark ? Colors.white.withValues(alpha: 0.4) : AppColors.mutedForeground,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildQuoteBanner(BuildContext context, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.secondary.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.secondary.withValues(alpha: 0.5),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          const Icon(Icons.format_quote_rounded, color: AppColors.accent, size: 48),
          const SizedBox(height: 24),
          Text(
            '﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾',
            style: GoogleFonts.amiri(
              color: isDark ? Colors.white : AppColors.primary,
              fontSize: 32,
              fontWeight: FontWeight.bold,
              height: 1,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          Container(width: 60, height: 2, color: AppColors.accent.withValues(alpha: 0.3)),
          const SizedBox(height: 32),
          Text(
            'لا تستوحش طريق الوعي لقلة السالكين فيه، فإن الله مع الصابرين والمحسنين.',
            style: GoogleFonts.tajawal(
              fontSize: 15,
              fontStyle: FontStyle.italic,
              height: 1.8,
              color: isDark ? Colors.white70 : AppColors.primary.withAlpha(200),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildExplorePlatform(BuildContext context, bool isDark) {
    final navItems = [
      {'label': 'المكتبة الشاملة', 'icon': Icons.auto_stories_rounded, 'color': AppColors.primary, 'path': '/library'},
      {'label': 'مجتمعاتنا', 'icon': Icons.diversity_3_rounded, 'color': AppColors.spiritualGreen, 'path': '/community'},
      {'label': 'ورش العمل', 'icon': Icons.model_training_rounded, 'color': AppColors.accent, 'path': '/workshops'},
      {'label': 'خلوات صوتية', 'icon': Icons.graphic_eq_rounded, 'color': AppColors.accent, 'path': '/audio-rooms'},
      {'label': 'وعي سوداني', 'icon': Icons.loyalty_rounded, 'color': AppColors.sudanRed, 'path': '/sudan-awareness'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'استكشف عالمك',
          style: GoogleFonts.amiri(
            fontSize: 24, 
            fontWeight: FontWeight.bold, 
            color: isDark ? AppColors.accent : AppColors.primary
          ),
        ),
        const SizedBox(height: 28),
        Wrap(
          spacing: 12,
          runSpacing: 16,
          children: navItems.map((item) {
            final itemColor = item['color'] as Color;
            return InkWell(
              onTap: () => context.go(item['path'] as String),
              borderRadius: BorderRadius.circular(24),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: itemColor.withValues(alpha: 0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                  border: Border.all(
                    color: isDark ? Colors.white.withValues(alpha: 0.05) : itemColor.withValues(alpha: 0.1),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(item['icon'] as IconData, size: 18, color: itemColor),
                    const SizedBox(width: 12),
                    Text(
                      item['label'] as String,
                      style: GoogleFonts.tajawal(
                        fontSize: 14, 
                        fontWeight: FontWeight.w700, 
                        color: isDark ? Colors.white.withValues(alpha: 0.9) : AppColors.foreground,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildJoinPrompt(BuildContext context, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.primary, AppColors.darkBackground],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(40),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.4),
            blurRadius: 40,
            offset: const Offset(0, 20),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.auto_awesome_rounded, color: AppColors.accent, size: 48),
          ),
          const SizedBox(height: 28),
          Text(
            'ارتقِ بوعيك الآن',
            style: GoogleFonts.amiri(
              fontSize: 32, 
              fontWeight: FontWeight.w900, 
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'انضم إلى نخبة السالكين في رحلة تعلّم اللسان العربي المبين وهندسة الوعي النفسي.',
            style: GoogleFonts.tajawal(color: Colors.white70, fontSize: 16, height: 1.6),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          SizedBox(
            width: double.infinity,
            height: 64,
            child: ElevatedButton(
              onPressed: () => context.go('/auth'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                elevation: 12,
                shadowColor: AppColors.accent.withValues(alpha: 0.5),
              ),
              child: Text(
                'بدء الرحلة', 
                style: GoogleFonts.tajawal(fontWeight: FontWeight.w900, fontSize: 18)
              ),
            ),
          ),
        ],
      ),
    );
  }
}

