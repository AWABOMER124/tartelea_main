// lib/features/audio_rooms/presentation/screens/audio_room_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../presentation/providers/theme_provider.dart';
import '../../../../presentation/widgets/common_app_bar.dart';
import '../controllers/providers.dart';
import '../controllers/audio_room_state.dart';
import '../controllers/audio_room_controller.dart';
import '../widgets/participant_avatar.dart';
import '../widgets/control_button.dart';
import '../widgets/floating_emoji.dart';
import '../widgets/recording_indicator.dart';

class AudioRoomDetailScreen extends ConsumerStatefulWidget {
  final String roomId;
  const AudioRoomDetailScreen({super.key, required this.roomId});

  @override
  ConsumerState<AudioRoomDetailScreen> createState() => _AudioRoomDetailScreenState();
}

class _AudioRoomDetailScreenState extends ConsumerState<AudioRoomDetailScreen> {
  final ScrollController _commentScrollController = ScrollController();
  final List<Widget> _reactions = [];

  void _triggerReaction(String emoji) {
    if (!mounted) return;
    ref.read(audioRoomControllerProvider(widget.roomId)).sendReaction(emoji);

    final key = UniqueKey();
    setState(() {
      _reactions.add(FloatingEmoji(
        key: key,
        emoji: emoji,
        onComplete: () {
          if (mounted) {
            setState(() => _reactions.removeWhere((w) => w.key == key));
          }
        },
      ));
    });
  }

  @override
  void dispose() {
    _commentScrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final stateAsync = ref.watch(audioRoomStateProvider(widget.roomId));
    final controller = ref.read(audioRoomControllerProvider(widget.roomId));

    return stateAsync.when(
      loading: () => Scaffold(
        appBar: const CommonAppBar(titleText: 'جاري الانضمام...'),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(color: AppColors.primary),
              const SizedBox(height: 16),
              Text('يتم الاتصال بالغرفة...', style: TextStyle(color: isDark ? Colors.white54 : AppColors.mutedForeground)),
            ],
          ),
        ),
      ),
      error: (error, _) => Scaffold(
        appBar: const CommonAppBar(titleText: 'خطأ'),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppColors.destructive),
              const SizedBox(height: 12),
              Text('حدث خطأ: $error', textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('رجوع')),
            ],
          ),
        ),
      ),
      data: (AudioRoomState state) => _buildRoomUI(context, isDark, state, controller),
    );
  }

  Widget _buildRoomUI(
    BuildContext context,
    bool isDark,
    AudioRoomState state,
    AudioRoomController controller,
  ) {
    // Auto-scroll comments
    if (state.comments.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_commentScrollController.hasClients) {
          _commentScrollController.animateTo(
            _commentScrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    }

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CommonAppBar(titleText: 'غرفة التدبر'),
      body: Container(
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
                        // ─── Header ───────────────────────
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                '🏠 غرفة التدبر',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : AppColors.primary,
                                ),
                              ),
                            ),
                            RecordingIndicator(isRecording: state.isRecording),
                            // عداد المشاركين
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.spiritualGreen.withAlpha(30),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.people, size: 14, color: AppColors.spiritualGreen),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${state.totalParticipants}',
                                    style: const TextStyle(
                                      color: AppColors.spiritualGreen,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        // شريط حالة الاتصال
                        if (!state.isConnected && state.connectionStatus != 'disconnected')
                          Container(
                            margin: const EdgeInsets.only(top: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.orange.withAlpha(30),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                                const SizedBox(width: 8),
                                Text(state.error ?? 'جاري إعادة الاتصال...', style: const TextStyle(fontSize: 12, color: Colors.orange)),
                              ],
                            ),
                          ),

                        const SizedBox(height: 20),

                        // ─── Cover Image ──────────────────
                        Container(
                          height: 150,
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 24),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withAlpha(20), blurRadius: 10, offset: const Offset(0, 4)),
                            ],
                            image: const DecorationImage(
                              image: AssetImage('assets/images/logo.jpg'),
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),

                        // ─── Speakers ─────────────────────
                        if (state.speakers.isNotEmpty) ...[
                          Text(
                            'المتحدثون (${state.speakers.length})',
                            style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white70 : AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 24, runSpacing: 24,
                            children: state.speakers.map((p) => ParticipantAvatar(participant: p, isDark: isDark)).toList(),
                          ),
                          const SizedBox(height: 32),
                        ],

                        // ─── Listeners ────────────────────
                        if (state.listeners.isNotEmpty) ...[
                          Text(
                            'المستمعون (${state.listeners.length})',
                            style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white70 : AppColors.mutedForeground,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 20, runSpacing: 20,
                            children: state.listeners.map((p) => ParticipantAvatar(participant: p, isDark: isDark)).toList(),
                          ),
                        ],

                        const SizedBox(height: 160),
                      ],
                    ),
                  ),
                ),

                // ─── Bottom Controls ──────────────────────
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : Colors.white,
                    border: Border(top: BorderSide(color: (isDark ? Colors.white : Colors.black).withAlpha(20), width: 0.5)),
                  ),
                  child: SafeArea(
                    child: Row(
                      children: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          style: TextButton.styleFrom(
                            backgroundColor: isDark ? Colors.white.withAlpha(20) : AppColors.secondary.withAlpha(127),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          ),
                          child: const Text('✌️ مغادرة', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                        ),
                        const Spacer(),
                        ControlButton(icon: Icons.favorite_border, isActive: false, isDark: isDark, onTap: () => _triggerReaction('❤️')),
                        const SizedBox(width: 8),
                        ControlButton(
                          icon: state.isLocalHandRaised ? Icons.back_hand : Icons.back_hand_outlined,
                          isActive: state.isLocalHandRaised, isDark: isDark,
                          onTap: () => controller.toggleHandRaise(),
                        ),
                        const SizedBox(width: 8),
                        ControlButton(
                          icon: state.isLocalMuted ? Icons.mic_off : Icons.mic,
                          isActive: !state.isLocalMuted, isDark: isDark,
                          onTap: () => controller.toggleMic(),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // ─── Live Comments Overlay ────────────────────
            if (state.comments.isNotEmpty)
              Positioned(
                bottom: 130, right: 16, left: 16,
                child: SizedBox(
                  height: 110,
                  child: ListView.builder(
                    controller: _commentScrollController,
                    itemCount: state.comments.length,
                    itemBuilder: (context, index) => Padding(
                      padding: const EdgeInsets.only(bottom: 5),
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: (isDark ? Colors.white : Colors.black).withAlpha(25),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Text(
                            state.comments[index],
                            style: TextStyle(color: isDark ? Colors.white : AppColors.primary, fontSize: 12),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),

            // ─── Floating Reactions ───────────────────────
            ..._reactions,
          ],
        ),
      ),
    );
  }
}
