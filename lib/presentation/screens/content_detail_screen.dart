import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/content_provider.dart';
import '../../core/theme/app_colors.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/theme_provider.dart';
import '../widgets/common_app_bar.dart';
import '../widgets/media/video_player_widget.dart';
import '../widgets/media/audio_player_widget.dart';
import 'package:google_fonts/google_fonts.dart';

class ContentDetailScreen extends ConsumerWidget {
  final String id;
  
  const ContentDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final contentAsync = ref.watch(contentsProvider(null)).whenData(
      (list) => list.firstWhere((e) => e.id == id),
    );
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CommonAppBar(titleText: 'تفاصيل المحتوى'),
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
        child: contentAsync.when(
          data: (content) => SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(24, 140, 24, 60),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildMediaSection(content, isDark),
                const SizedBox(height: 32),
                
                // Title Area
                Text(
                  content.title,
                  style: GoogleFonts.amiri(
                    fontSize: 32, 
                    fontWeight: FontWeight.bold, 
                    color: isDark ? AppColors.accent : AppColors.primary,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 16),
                
                // Meta Tags
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.accent.withAlpha(isDark ? 51 : 30),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.accent.withAlpha(isDark ? 80 : 50)),
                      ),
                      child: Text(
                        _getCategoryName(content.category), 
                        style: GoogleFonts.tajawal(
                          color: isDark ? AppColors.accent : AppColors.primary, 
                          fontSize: 12, 
                          fontWeight: FontWeight.bold
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    if (content.duration != null)
                      Row(
                        children: [
                          Icon(Icons.access_time_rounded, size: 14, color: isDark ? Colors.white54 : AppColors.mutedForeground),
                          const SizedBox(width: 6),
                          Text(
                            content.duration!,
                            style: GoogleFonts.tajawal(
                              color: isDark ? Colors.white70 : AppColors.mutedForeground, 
                              fontSize: 12,
                              fontWeight: FontWeight.w600
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
                const SizedBox(height: 32),
                
                // Description Divider
                Container(width: 50, height: 2, color: AppColors.accent.withAlpha(100)),
                const SizedBox(height: 24),
                
                // Long Form Description
                Text(
                  content.description ?? 'لا يوجد وصف متاح لهذا المحتوى.',
                  style: GoogleFonts.tajawal(
                    fontSize: 16, 
                    height: 1.8, 
                    color: isDark ? Colors.white.withAlpha(180) : AppColors.foreground,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 48),
                
                // External Link (if any)
                if (content.url != null)
                  Container(
                    width: double.infinity,
                    height: 60,
                    decoration: BoxDecoration(
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withAlpha(30),
                          blurRadius: 20,
                          offset: const Offset(0, 8)
                        )
                      ]
                    ),
                    child: ElevatedButton.icon(
                      onPressed: () => launchUrl(Uri.parse(content.url!)),
                      icon: const Icon(Icons.open_in_new_rounded),
                      label: Text(
                        'عرض الروابط الخارجية للمحتوى',
                        style: GoogleFonts.tajawal(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark ? AppColors.darkCard : AppColors.primary,
                        foregroundColor: isDark ? AppColors.accent : Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                        elevation: 0,
                      ),
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

  String _getCategoryName(String code) {
    switch (code) {
      case 'takhliya': return 'تصفية الوعي';
      case 'tahliya': return 'فهم اللسان';
      case 'tajalli': return 'ترقية الروح';
      case 'psychology': return 'تأهيل نفسي';
      default: return code;
    }
  }

  Widget _buildMediaSection(dynamic content, bool isDark) {
    if (content.mediaUrl == null) {
      if (content.thumbnailUrl != null) {
        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(50),
                blurRadius: 25,
                offset: const Offset(0, 10),
              )
            ]
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(28),
            child: Image.network(content.thumbnailUrl!, width: double.infinity, height: 220, fit: BoxFit.cover),
          ),
        );
      }
      return const SizedBox.shrink();
    }

    if (content.type == 'video') {
      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(80),
              blurRadius: 30,
              offset: const Offset(0, 15),
            )
          ]
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: VideoPlayerWidget(videoUrl: content.mediaUrl!, thumbnailUrl: content.thumbnailUrl),
        ),
      );
    } else if (content.type == 'audio') {
      return AudioPlayerWidget(
        audioUrl: content.mediaUrl!,
        title: content.title,
        thumbnailUrl: content.thumbnailUrl,
      );
    }

    return const SizedBox.shrink();
  }
}
