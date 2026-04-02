import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/content_provider.dart';
import '../../core/theme/app_colors.dart';
import '../widgets/common_app_bar.dart';
import '../providers/theme_provider.dart';
import '../widgets/media/content_card.dart';

class LibraryScreen extends ConsumerStatefulWidget {
  final String? initialSidebarCategory;
  const LibraryScreen({super.key, this.initialSidebarCategory});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _selectedSidebarCategory;
  
  final List<Map<String, String?>> _mediaTabs = [
    {'label': 'مرئي', 'value': 'video'},
    {'label': 'صوتي', 'value': 'audio'},
    {'label': 'مقالات', 'value': 'article'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _mediaTabs.length, vsync: this);
    _selectedSidebarCategory = widget.initialSidebarCategory;
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return DefaultTabController(
      length: _mediaTabs.length,
      child: Scaffold(
        extendBodyBehindAppBar: true,
        appBar: CommonAppBar(
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(60),
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : AppColors.secondary.withAlpha(80),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isDark ? Colors.white.withAlpha(10) : AppColors.secondary),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: AppColors.accent,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: AppColors.accent.withAlpha(50), blurRadius: 10, offset: const Offset(0, 4))
                  ],
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: Colors.white,
                dividerColor: Colors.transparent,
                unselectedLabelColor: isDark ? Colors.white60 : AppColors.mutedForeground,
                labelStyle: GoogleFonts.tajawal(fontWeight: FontWeight.bold, fontSize: 13),
                unselectedLabelStyle: GoogleFonts.tajawal(fontWeight: FontWeight.w600, fontSize: 13),
                tabs: _mediaTabs.map((tab) => Tab(text: tab['label'])).toList(),
                onTap: (index) => setState(() {}),
              ),
            ),
          ),
        ),
        drawer: _buildSidebar(isDark),
        body: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: isDark 
                ? [AppColors.darkBackground, AppColors.darkSurface]
                : [Colors.white, AppColors.secondary.withAlpha(51)],
            ),
          ),
          child: Column(
            children: [
              const SizedBox(height: 140), // Balanced for New TabBar
              Expanded(child: _buildContentList(isDark)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSidebar(bool isDark) {
    final categories = [
      {'label': 'الكل', 'value': null, 'icon': Icons.all_inclusive_rounded},
      {'label': 'اخلع (تصفية)', 'value': 'takhliya', 'icon': Icons.remove_circle_outline_rounded},
      {'label': 'تدبر (تخلية)', 'value': 'tahliya', 'icon': Icons.menu_book_rounded},
      {'label': 'رتل (ترقية)', 'value': 'tajalli', 'icon': Icons.auto_awesome_rounded},
      {'label': 'تأهيل نفسي', 'value': 'psychology', 'icon': Icons.psychology_rounded},
    ];

    return Drawer(
      backgroundColor: Colors.transparent,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface.withAlpha(200) : Colors.white.withAlpha(220),
            border: Border(left: BorderSide(color: isDark ? Colors.white10 : AppColors.secondary)),
          ),
          child: Column(
            children: [
              DrawerHeader(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primary.withAlpha(200)],
                    begin: Alignment.topRight,
                    end: Alignment.bottomLeft,
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(30),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.library_books_rounded, color: AppColors.accent, size: 36),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'تصنيفات المكتبة',
                        style: GoogleFonts.amiri(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  itemCount: categories.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final cat = categories[index];
                    final isSelected = _selectedSidebarCategory == cat['value'];
                    return ListTile(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      leading: Icon(
                        cat['icon'] as IconData,
                        color: isSelected ? AppColors.accent : (isDark ? Colors.white54 : AppColors.primary.withAlpha(150)),
                      ),
                      title: Text(
                        cat['label'] as String,
                        style: GoogleFonts.tajawal(
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          color: isSelected ? AppColors.accent : (isDark ? Colors.white : AppColors.foreground),
                        ),
                      ),
                      selected: isSelected,
                      selectedTileColor: isDark ? Colors.white.withAlpha(15) : AppColors.primary.withAlpha(20),
                      onTap: () {
                        setState(() {
                          _selectedSidebarCategory = cat['value'] as String?;
                        });
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContentList(bool isDark) {
    final mediaType = _mediaTabs[_tabController.index]['value'];
    final contentsAsync = ref.watch(contentsProvider(_selectedSidebarCategory));

    return Column(
      children: [
        if (_selectedSidebarCategory != null)
          _buildActiveFilterChip(isDark),
        Expanded(
          child: contentsAsync.when(
            data: (contents) {
              final filteredContents = contents.where((c) => c.type == mediaType).toList();
              
              if (filteredContents.isEmpty) {
                return _buildEmptyState(isDark);
              }

              return ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100), // Bottom padding for FAB if any
                physics: const BouncingScrollPhysics(),
                itemCount: filteredContents.length,
                itemBuilder: (context, index) {
                  return ContentCard(content: filteredContents[index], isDark: isDark);
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator(color: AppColors.accent)),
            error: (err, stack) => Center(child: Text('خطأ: $err')),
          ),
        ),
      ],
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
              color: isDark ? AppColors.darkCard : AppColors.secondary.withAlpha(50),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.auto_awesome_mosaic_rounded, 
              size: 64, 
              color: AppColors.accent.withAlpha(100),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'لا يوجد محتوى في هذا القسم حالياً',
            style: GoogleFonts.amiri(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white70 : AppColors.primary.withAlpha(200),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'كُن أول السالكين في انتظار فيض المعرفة قريباً',
            textAlign: TextAlign.center,
            style: GoogleFonts.tajawal(
              fontSize: 13,
              color: isDark ? Colors.white30 : AppColors.mutedForeground.withAlpha(150),
            ),
          ),
        ],
      ),
    );
  }

  String _getCategoryName(String code) {
    switch (code) {
      case 'takhliya': return 'تصفية الوعي';
      case 'tahliya': return 'فهم اللسان';
      case 'tajalli': return 'ترقية الروح';
      case 'psychology': return 'تأهيل نفسي';
      default: return code;
    }
  }

  Widget _buildActiveFilterChip(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      alignment: Alignment.centerRight,
      child: FilterChip(
        label: Text('مسار: ${_getCategoryName(_selectedSidebarCategory!)}', style: GoogleFonts.tajawal(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
        onSelected: (_) => setState(() => _selectedSidebarCategory = null),
        deleteIcon: const Icon(Icons.close_rounded, size: 14, color: Colors.white),
        onDeleted: () => setState(() => _selectedSidebarCategory = null),
        backgroundColor: AppColors.primary,
        selectedColor: AppColors.primary,
        checkmarkColor: Colors.white,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

