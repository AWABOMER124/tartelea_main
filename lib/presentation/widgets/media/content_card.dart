import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:tartelea_flutter/data/models/content_model.dart';
import 'package:tartelea_flutter/core/theme/app_colors.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';

class ContentCard extends StatefulWidget {
  final ContentModel content;
  final bool isDark;

  const ContentCard({
    super.key,
    required this.content,
    required this.isDark,
  });

  @override
  State<ContentCard> createState() => _ContentCardState();
}

class _ContentCardState extends State<ContentCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _isPressed ? 0.98 : 1.0,
      duration: const Duration(milliseconds: 100),
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        decoration: BoxDecoration(
          color: widget.isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(32),
          boxShadow: [
            BoxShadow(
              color: widget.isDark 
                  ? Colors.black.withAlpha(100) 
                  : AppColors.primary.withAlpha(20),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
          border: Border.all(
            color: widget.isDark 
                ? Colors.white.withAlpha(15) 
                : AppColors.secondary.withAlpha(120),
            width: 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: InkWell(
            onHighlightChanged: (val) => setState(() => _isPressed = val),
            onTap: () => context.go('/content/${widget.content.id}'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Thumbnail Section with Glass Overlay
                Stack(
                  children: [
                    AspectRatio(
                      aspectRatio: 16 / 9,
                      child: widget.content.thumbnailUrl != null
                          ? Image.network(
                              widget.content.thumbnailUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
                            )
                          : _buildPlaceholder(),
                    ),
                    // Elegant Gradient Overlay
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withAlpha(160),
                            ],
                            stops: const [0.5, 1.0],
                          ),
                        ),
                      ),
                    ),
                    // Premium Category Badge
                    Positioned(
                      top: 16,
                      right: 16,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.accent.withAlpha(180),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.white.withAlpha(50)),
                            ),
                            child: Text(
                              _getCategoryLabel(widget.content.category),
                              style: GoogleFonts.tajawal(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    // Meta Info (Duration & Icon)
                    Positioned(
                      bottom: 12,
                      left: 12,
                      right: 12,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          if (widget.content.duration != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.black.withAlpha(120),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.white.withAlpha(30)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.access_time_filled_rounded, color: AppColors.accent, size: 12),
                                  const SizedBox(width: 6),
                                  Text(
                                    widget.content.duration!,
                                    style: GoogleFonts.tajawal(
                                      color: Colors.white, 
                                      fontSize: 10, 
                                      fontWeight: FontWeight.w800
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withAlpha(40),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white.withAlpha(40)),
                            ),
                            child: Icon(
                              _getIconForType(widget.content.type),
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                
                // Information Section with Glassmorphism
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.content.title,
                        style: GoogleFonts.amiri(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: widget.isDark ? AppColors.accent : AppColors.primary,
                          height: 1.1,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 12),
                      if (widget.content.description != null)
                        Text(
                          widget.content.description!,
                          style: GoogleFonts.tajawal(
                            fontSize: 14,
                            color: widget.isDark ? Colors.white60 : AppColors.mutedForeground,
                            height: 1.6,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      const SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: AppColors.accent.withAlpha(30),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  _getIconForType(widget.content.type),
                                  size: 14,
                                  color: AppColors.accent,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                _getTypeLabel(widget.content.type),
                                style: GoogleFonts.tajawal(
                                  fontSize: 12,
                                  color: widget.isDark ? AppColors.accent.withAlpha(200) : AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          if (widget.content.createdAt != null)
                            Text(
                              DateFormat('yyyy/MM/dd').format(widget.content.createdAt!),
                              style: GoogleFonts.tajawal(
                                fontSize: 11,
                                color: widget.isDark ? Colors.white24 : AppColors.mutedForeground.withAlpha(150),
                                fontWeight: FontWeight.bold,
                              ),
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

  Widget _buildPlaceholder() {
    return Container(
      color: widget.isDark ? AppColors.darkSurface : AppColors.secondary.withAlpha(50),
      child: Center(
        child: Icon(
          _getIconForType(widget.content.type),
          color: AppColors.accent.withAlpha(100),
          size: 48,
        ),
      ),
    );
  }

  String _getCategoryLabel(String category) {
    switch (category) {
      case 'takhliya': return 'اخلع (تصفية)';
      case 'tahliya': return 'تدبر (تخلية)';
      case 'tajalli': return 'رتل (ترقية)';
      case 'psychology': return 'تأهيل نفسي';
      default: return 'عام';
    }
  }

  String _getTypeLabel(String type) {
    switch (type) {
      case 'video': return 'فيديو تعليمي';
      case 'audio': return 'محتوى صوتي';
      default: return 'مقال معرفي';
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'video': return Icons.play_arrow_rounded;
      case 'audio': return Icons.graphic_eq_rounded;
      default: return Icons.notes_rounded;
    }
  }
}
