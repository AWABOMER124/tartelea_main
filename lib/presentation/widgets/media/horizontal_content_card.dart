import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:tartelea_flutter/data/models/content_model.dart';
import 'package:tartelea_flutter/core/theme/app_colors.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class HorizontalContentCard extends StatefulWidget {
  final ContentModel content;
  final bool isDark;

  const HorizontalContentCard({
    super.key,
    required this.content,
    required this.isDark,
  });

  @override
  State<HorizontalContentCard> createState() => _HorizontalContentCardState();
}

class _HorizontalContentCardState extends State<HorizontalContentCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _isPressed ? 0.96 : 1.0,
      duration: const Duration(milliseconds: 100),
      child: Container(
        width: 280,
        margin: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: widget.isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: widget.isDark ? 0.25 : 0.06),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
          border: Border.all(
            color: widget.isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.secondary.withValues(alpha: 0.4),
            width: 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: InkWell(
            onHighlightChanged: (val) => setState(() => _isPressed = val),
            onTap: () => context.go('/content/${widget.content.id}'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Thumbnail with Glass Overlay
                Stack(
                  children: [
                    AspectRatio(
                      aspectRatio: 16 / 9,
                      child: widget.content.thumbnailUrl != null
                          ? Image.network(
                              widget.content.thumbnailUrl!,
                              fit: BoxFit.cover,
                            )
                          : Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    AppColors.primary.withValues(alpha: 0.1),
                                    AppColors.accent.withValues(alpha: 0.1),
                                  ],
                                ),
                              ),
                              child: Icon(
                                Icons.auto_awesome, 
                                color: AppColors.accent.withValues(alpha: 0.4), 
                                size: 44
                              ),
                            ),
                    ),
                    // Gradient Overlay for readability
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.6),
                            ],
                            stops: const [0.6, 1.0],
                          ),
                        ),
                      ),
                    ),
                    if (widget.content.duration != null)
                      Positioned(
                        bottom: 12,
                        right: 12,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.4),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                              ),
                              child: Text(
                                widget.content.duration!,
                                style: GoogleFonts.tajawal(
                                  color: Colors.white, 
                                  fontSize: 10, 
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    // Type Icon
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.accent.withValues(alpha: 0.95),
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 4)
                          ],
                        ),
                        child: Icon(
                          _getIconForType(widget.content.type),
                          color: Colors.white,
                          size: 14,
                        ),
                      ),
                    ),
                  ],
                ),
                // Info Section
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.content.title,
                        style: GoogleFonts.amiri(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: widget.isDark ? AppColors.accent : AppColors.primary,
                          height: 1.1,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        widget.content.description ?? '',
                        style: GoogleFonts.tajawal(
                          color: widget.isDark ? Colors.white.withValues(alpha: 0.6) : AppColors.mutedForeground,
                          fontSize: 12,
                          height: 1.5,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
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

  IconData _getIconForType(String type) {
    switch (type) {
      case 'video': return Icons.play_arrow_rounded;
      case 'audio': return Icons.graphic_eq_rounded;
      default: return Icons.notes_rounded;
    }
  }
}
