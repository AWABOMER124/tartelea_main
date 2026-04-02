import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../providers/theme_provider.dart';
import '../widgets/common_app_bar.dart';
import 'package:google_fonts/google_fonts.dart';

class MessagesScreen extends ConsumerWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CommonAppBar(titleText: 'خلوات الرسائل'),
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

          // ─── Content ───────────────────────────────────
          Column(
            children: [
              const SizedBox(height: 130),
              
              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withAlpha(15) : AppColors.secondary.withAlpha(60),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: isDark ? Colors.white.withAlpha(30) : AppColors.secondary.withAlpha(100)),
                      ),
                      child: TextField(
                        style: GoogleFonts.tajawal(color: isDark ? Colors.white : AppColors.primary),
                        decoration: InputDecoration(
                          icon: Icon(Icons.search_rounded, color: isDark ? Colors.white54 : AppColors.primary.withAlpha(120)),
                          hintText: 'ابحث في أرشيف الوعي...',
                          hintStyle: GoogleFonts.tajawal(color: isDark ? Colors.white38 : AppColors.mutedForeground),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Tabs (Spiritual Guides / Companions)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    _buildTab('الكل', true, isDark),
                    _buildTab('المرشدين', false, isDark),
                    _buildTab('الصحبة الصالحة', false, isDark),
                    _buildTab('المؤرشفة', false, isDark),
                  ],
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Inbox List
              Expanded(
                child: ListView.builder(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                  itemCount: mockChats.length,
                  itemBuilder: (context, index) {
                    final chat = mockChats[index];
                    return _ConversationCard(chat: chat, isDark: isDark);
                  },
                ),
              ),
            ],
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppColors.accent,
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        child: const Icon(Icons.edit_note_rounded, color: Colors.white, size: 30),
      ),
    );
  }

  Widget _buildTab(String label, bool isActive, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: isActive ? AppColors.accent : (isDark ? Colors.white.withAlpha(15) : AppColors.secondary.withAlpha(40)),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isActive ? AppColors.accent : Colors.transparent),
      ),
      child: Text(
        label,
        style: GoogleFonts.tajawal(
          color: isActive ? Colors.white : (isDark ? Colors.white70 : AppColors.primary),
          fontWeight: isActive ? FontWeight.w900 : FontWeight.w600,
          fontSize: 13,
        ),
      ),
    );
  }
}

class _ConversationCard extends StatelessWidget {
  final Map<String, dynamic> chat;
  final bool isDark;

  const _ConversationCard({required this.chat, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard.withAlpha(150) : Colors.white.withAlpha(180),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: chat['unread'] > 0 ? AppColors.accent.withAlpha(100) : (isDark ? Colors.white.withAlpha(25) : AppColors.secondary.withAlpha(100)),
          width: chat['unread'] > 0 ? 1.5 : 1,
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        onTap: () {},
        leading: Stack(
          children: [
            Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: chat['online'] ? Colors.greenAccent : Colors.transparent, width: 2),
              ),
              child: CircleAvatar(
                radius: 28,
                backgroundColor: isDark ? AppColors.primary.withAlpha(51) : AppColors.secondary.withAlpha(51),
                child: Text(
                  chat['avatar'], 
                  style: const TextStyle(fontSize: 24)
                ),
              ),
            ),
            if (chat['online'])
              Positioned(
                bottom: 4,
                right: 4,
                child: Container(
                  width: 12, height: 12,
                  decoration: BoxDecoration(
                    color: Colors.greenAccent,
                    shape: BoxShape.circle,
                    border: Border.all(color: isDark ? AppColors.darkCard : Colors.white, width: 2),
                  ),
                ),
              ),
          ],
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              chat['name'],
              style: GoogleFonts.amiri(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: isDark ? Colors.white : AppColors.primary,
              ),
            ),
            Text(
              chat['time'],
              style: GoogleFonts.tajawal(
                color: isDark ? Colors.white38 : AppColors.mutedForeground,
                fontSize: 11,
              ),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  chat['lastMessage'],
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.tajawal(
                    color: isDark ? Colors.white60 : AppColors.mutedForeground,
                    fontSize: 13,
                    fontWeight: chat['unread'] > 0 ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
              if (chat['unread'] > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.accent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    chat['unread'].toString(),
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

final List<Map<String, dynamic>> mockChats = [
  {
    'name': 'المرشد الروحي (أ. أحمد)',
    'avatar': '🕊️',
    'lastMessage': 'إن شاء الله سنلتقي في غدو الترتيل القادم لنتدارس حال القلب...',
    'time': '١٢:٤٠ م',
    'unread': 2,
    'online': true,
  },
  {
    'name': 'مجلس التدبر الجماعي',
    'avatar': '📖',
    'lastMessage': 'سارة: ما رأيكم في لطائف سورة يوسف التي تم ذكرها اليوم؟',
    'time': '٣:١٥ م',
    'unread': 0,
    'online': false,
  },
  {
    'name': 'د. مريم (دعم نفسي)',
    'avatar': '💎',
    'lastMessage': 'لا تقلقي، هي سحابة صيف ستمر بإذن الله، استمري في ورد السكينة.',
    'time': 'أمس',
    'unread': 1,
    'online': true,
  },
  {
    'name': 'فريق الدعم الفني',
    'avatar': '⚡',
    'lastMessage': 'تم تحديث حسابك إلى الباقة المتميزة، استمتع برحلتك.',
    'time': '٢٤ مارس',
    'unread': 0,
    'online': false,
  },
];
