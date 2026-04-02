import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../providers/theme_provider.dart';
import '../widgets/common_app_bar.dart';
import 'package:google_fonts/google_fonts.dart';

class LearningPortfolioScreen extends ConsumerStatefulWidget {
  const LearningPortfolioScreen({super.key});

  @override
  ConsumerState<LearningPortfolioScreen> createState() => _LearningPortfolioScreenState();
}

class _LearningPortfolioScreenState extends ConsumerState<LearningPortfolioScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CommonAppBar(
        titleText: 'حقيبة الإنجاز',
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accent,
          indicatorWeight: 3,
          labelStyle: GoogleFonts.tajawal(fontWeight: FontWeight.bold, fontSize: 14),
          unselectedLabelStyle: GoogleFonts.tajawal(fontSize: 14),
          tabs: const [
            Tab(text: 'سجل السلوك'),
            Tab(text: 'شهادات الوعي'),
          ],
        ),
      ),
      body: Stack(
        children: [
          // ─── Background ────────────────────────────────
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark 
                  ? [AppColors.darkBackground, AppColors.darkSurface, AppColors.darkBackground]
                  : [Colors.white, AppColors.secondary.withAlpha(40), Colors.white],
              ),
            ),
          ),

          TabBarView(
            controller: _tabController,
            children: [
              _buildHistoryTab(isDark),
              _buildCertificatesTab(isDark),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryTab(bool isDark) {
    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 160, 20, 100),
      itemCount: mockHistory.length,
      itemBuilder: (context, index) {
        final item = mockHistory[index];
        return _HistoryCard(item: item, isDark: isDark);
      },
    );
  }

  Widget _buildCertificatesTab(bool isDark) {
    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 160, 20, 100),
      itemCount: mockCertificates.length,
      itemBuilder: (context, index) {
        final cert = mockCertificates[index];
        return _CertificateCard(cert: cert, isDark: isDark);
      },
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final bool isDark;

  const _HistoryCard({required this.item, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard.withAlpha(150) : Colors.white.withAlpha(200),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? Colors.white.withAlpha(15) : AppColors.secondary.withAlpha(80)),
      ),
      child: Column(
        children: [
          ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.accent.withAlpha(30),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(item['icon'], color: AppColors.accent, size: 28),
            ),
            title: Text(
              item['title'],
              style: GoogleFonts.amiri(
                fontSize: 18, 
                fontWeight: FontWeight.bold, 
                color: isDark ? Colors.white : AppColors.primary
              ),
            ),
            subtitle: Text(
              item['date'],
              style: GoogleFonts.tajawal(color: isDark ? Colors.white38 : AppColors.mutedForeground, fontSize: 12),
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.greenAccent.withAlpha(40),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                'مكتمل',
                style: GoogleFonts.tajawal(color: Colors.greenAccent, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: 1.0,
                      backgroundColor: isDark ? Colors.white10 : Colors.black12,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accent),
                      minHeight: 4,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '١٠٠٪',
                  style: GoogleFonts.tajawal(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.accent),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CertificateCard extends StatelessWidget {
  final Map<String, dynamic> cert;
  final bool isDark;

  const _CertificateCard({required this.cert, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 32),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.accent.withAlpha(isDark ? 50 : 30),
            blurRadius: 30,
            offset: const Offset(0, 12),
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: Container(
            height: 220,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark 
                  ? [AppColors.darkCard, AppColors.darkSurface]
                  : [Colors.white, const Color(0xFFFFF8E1)],
              ),
              border: Border.all(color: AppColors.accent.withAlpha(150), width: 2),
            ),
            child: Stack(
              children: [
                // Pattern Overlay
                Positioned.fill(
                  child: Opacity(
                    opacity: 0.05,
                    child: Image.network(
                      'https://www.transparenttextures.com/patterns/arabic-pattern.png',
                      repeat: ImageRepeat.repeat,
                    ),
                  ),
                ),
                
                // Content
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Icon(Icons.workspace_premium_rounded, color: AppColors.accent, size: 40),
                          Text(
                            'مدرسة الترتيل',
                            style: GoogleFonts.amiri(
                              color: AppColors.accent, 
                              fontWeight: FontWeight.bold, 
                              fontSize: 16
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'شهادة إتمام مسار الوعي',
                        style: GoogleFonts.amiri(
                          fontSize: 22, 
                          fontWeight: FontWeight.bold, 
                          color: isDark ? Colors.white : AppColors.primary
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        cert['title'],
                        style: GoogleFonts.tajawal(
                          fontSize: 14, 
                          color: AppColors.accent,
                          fontWeight: FontWeight.w900
                        ),
                      ),
                      const Spacer(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('تاريخ المنح', style: GoogleFonts.tajawal(fontSize: 10, color: Colors.grey)),
                              Text(cert['date'], style: GoogleFonts.tajawal(fontSize: 12, fontWeight: FontWeight.bold, color: isDark ? Colors.white70 : AppColors.primary)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.accent)
                            ),
                            child: const Icon(Icons.qr_code_2_rounded, size: 24, color: AppColors.accent),
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
}

final List<Map<String, dynamic>> mockHistory = [
  {
    'title': 'مقدمة في اللسان العربي المبين',
    'date': '١٢ مارس ٢٠٢٤',
    'icon': Icons.menu_book_rounded,
  },
  {
    'title': 'تدبر سورة الفاتحة بالترتيل',
    'date': '٥ مارس ٢٠٢٤',
    'icon': Icons.auto_awesome_rounded,
  },
  {
    'title': 'ورشة خلوة السكينة النفسية',
    'date': '٢٠ فبراير ٢٠٢٤',
    'icon': Icons.spa_rounded,
  },
];

final List<Map<String, dynamic>> mockCertificates = [
  {
    'title': 'مسار تخلية الوعي الشامل',
    'date': '١٥ مارس ٢٠٢٤',
  },
  {
    'title': 'أساسيات التدبر اللساني',
    'date': '١ فبراير ٢٠٢٤',
  },
];
