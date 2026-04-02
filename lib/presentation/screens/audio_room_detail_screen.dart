import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../providers/theme_provider.dart';
import '../widgets/common_app_bar.dart';
import '../../features/audio_rooms/presentation/controllers/providers.dart';
import '../../features/audio_rooms/presentation/widgets/participant_grid.dart';
import '../../features/audio_rooms/presentation/widgets/control_button.dart';
import '../../features/audio_rooms/presentation/widgets/recording_indicator.dart';
import '../../features/audio_rooms/presentation/widgets/floating_emoji.dart';

class AudioRoomDetailScreen extends ConsumerStatefulWidget {
  final String roomId;
  const AudioRoomDetailScreen({super.key, required this.roomId});

  @override
  ConsumerState<AudioRoomDetailScreen> createState() => _AudioRoomDetailScreenState();
}

class _AudioRoomDetailScreenState extends ConsumerState<AudioRoomDetailScreen> {
  final ScrollController _commentController = ScrollController();
  final List<Widget> _activeReactions = [];

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _onReactionReceived(String emoji) {
    if (!mounted) return;
    final key = UniqueKey();
    setState(() {
      _activeReactions.add(
        FloatingEmoji(
          key: key,
          emoji: emoji,
          onComplete: () {
            if (mounted) {
              setState(() => _activeReactions.removeWhere((w) => w.key == key));
            }
          },
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final roomStateAsync = ref.watch(audioRoomStateProvider(widget.roomId));
    final controller = ref.read(audioRoomControllerProvider(widget.roomId));

    // ─── Listen for Real-time Reactions ─────────────────────
    ref.listen(audioRoomStateProvider(widget.roomId), (prev, next) {
      if (next is AsyncData && prev is AsyncData) {
        final nextVal = next.asData!.value;
        final prevVal = prev!.asData!.value;
        
        // Handle Reactions
        if (nextVal.recentReactions.length > prevVal.recentReactions.length) {
          final newEmoji = nextVal.recentReactions.last;
          _onReactionReceived(newEmoji);
        }

        // Handle Errors via Snackbar
        if (nextVal.error != null && nextVal.error != prevVal.error) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(nextVal.error!),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    });

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CommonAppBar(titleText: 'غرفة التدبر'),
      body: roomStateAsync.when(
        data: (state) {
          // Automatic scroll for new comments
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (_commentController.hasClients) {
              _commentController.animateTo(
                _commentController.position.maxScrollExtent,
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOut,
              );
            }
          });

          return Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark 
                  ? [AppColors.darkBackground, AppColors.darkSurface]
                  : [Colors.white, AppColors.secondary.withAlpha(51)],
              ),
            ),
            child: Stack(
              children: [
                Column(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(24, 120, 24, 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '🏠 اخلع تدبر رتل', 
                                  style: TextStyle(
                                    fontSize: 16, 
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : AppColors.primary,
                                  ),
                                ),
                                RecordingIndicator(isRecording: state.isRecording),
                                Icon(Icons.more_horiz, color: isDark ? Colors.white54 : AppColors.primary),
                              ],
                            ),
                            const SizedBox(height: 20),
                            Container(
                              height: 180,
                              width: double.infinity,
                              margin: const EdgeInsets.only(bottom: 24),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withAlpha(20),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  )
                                ],
                                image: const DecorationImage(
                                  image: AssetImage('assets/images/logo.jpg'),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            
                            // ─── Real Participant Grid ─────────────────────
                            ParticipantGrid(
                              participants: state.participants,
                              isDark: isDark,
                            ),

                            const SizedBox(height: 120), // Space for comments
                          ],
                        ),
                      ),
                    ),
                    _buildBottomControls(context, controller, state, isDark),
                  ],
                ),
                
                // ─── Floating Comments Overlay ───────────────────
                Positioned(
                  bottom: 140,
                  right: 16,
                  left: 16,
                  child: _buildCommentsOverlay(state.comments, isDark),
                ),

                // ─── Floating Reactions ──────────────────────────
                ..._activeReactions,

                // ─── Connection Overlays ─────────────────────────
                if (state.connectionStatus == 'connecting' || state.connectionStatus == 'reconnecting')
                  Positioned.fill(
                    child: Container(
                      color: Colors.black.withAlpha(150),
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const CircularProgressIndicator(color: AppColors.spiritualGreen),
                            const SizedBox(height: 16),
                            Text(
                              state.connectionStatus == 'connecting' ? 'جاري الاتصال بالغرفة...' : 'جاري إعادة الاتصال...',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _buildCommentsOverlay(List<String> comments, bool isDark) {
    return SizedBox(
      height: 150,
      width: 250,
      child: ListView.builder(
        controller: _commentController,
        itemCount: comments.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: (isDark ? Colors.white : Colors.black).withAlpha(30),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    comments[index],
                    style: TextStyle(
                      color: isDark ? Colors.white : AppColors.primary, 
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBottomControls(BuildContext context, dynamic controller, dynamic state, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        border: Border(
          top: BorderSide(
            color: (isDark ? Colors.white : Colors.black).withAlpha(20),
            width: 0.5,
          ),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              style: TextButton.styleFrom(
                backgroundColor: isDark ? Colors.white.withAlpha(20) : AppColors.secondary.withAlpha(127),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: const Text('✌️ مغادرة بهدوء', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            ),
            const Spacer(),
            ControlButton(
              icon: Icons.favorite_border,
              isActive: false,
              isDark: isDark,
              onTap: () {
                controller.sendReaction('❤️');
              },
            ),
            const SizedBox(width: 8),
            ControlButton(
              icon: state.isLocalHandRaised ? Icons.back_hand : Icons.back_hand_outlined,
              isActive: state.isLocalHandRaised,
              isDark: isDark,
              onTap: () => controller.toggleHandRaise(),
            ),
            const SizedBox(width: 12),
            ControlButton(
              icon: state.isLocalMuted ? Icons.mic_off : Icons.mic,
              isActive: !state.isLocalMuted,
              isDark: isDark,
              onTap: () => controller.toggleMic(),
            ),
          ],
        ),
      ),
    );
  }
}
