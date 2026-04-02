import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_video_progress_bar/audio_video_progress_bar.dart';
import 'package:rxdart/rxdart.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';

class AudioPlayerWidget extends StatefulWidget {
  final String audioUrl;
  final String title;
  final String? thumbnailUrl;

  const AudioPlayerWidget({
    super.key,
    required this.audioUrl,
    required this.title,
    this.thumbnailUrl,
  });

  @override
  State<AudioPlayerWidget> createState() => _AudioPlayerWidgetState();
}

class _AudioPlayerWidgetState extends State<AudioPlayerWidget> {
  late AudioPlayer _audioPlayer;
  double _playbackSpeed = 1.0;

  @override
  void initState() {
    super.initState();
    _audioPlayer = AudioPlayer()..setUrl(widget.audioUrl);
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  void _onSpeedChanged(double speed) {
    setState(() => _playbackSpeed = speed);
    _audioPlayer.setSpeed(speed);
  }

  Stream<PositionData> get _positionDataStream =>
      Rx.combineLatest3<Duration, Duration, Duration?, PositionData>(
          _audioPlayer.positionStream,
          _audioPlayer.bufferedPositionStream,
          _audioPlayer.durationStream,
          (position, bufferedPosition, duration) => PositionData(
              position, bufferedPosition, duration ?? Duration.zero));

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: Stack(
        children: [
          // ─── Blurred Background ──────────────────────────
          if (widget.thumbnailUrl != null)
            Positioned.fill(
              child: Image.network(
                widget.thumbnailUrl!,
                fit: BoxFit.cover,
                color: Colors.black.withAlpha(120),
                colorBlendMode: BlendMode.darken,
              ),
            ),
          Positioned.fill(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkSurface.withAlpha(180) : Colors.white.withAlpha(180),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      isDark ? Colors.black.withAlpha(100) : AppColors.secondary.withAlpha(50),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ─── Content ─────────────────────────────────────
          Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              children: [
                // Thumbnail / Icon
                Hero(
                  tag: 'audio_thumb_${widget.audioUrl}',
                  child: Container(
                    height: 220,
                    width: 220,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(80),
                          blurRadius: 30,
                          offset: const Offset(0, 15),
                        )
                      ],
                      image: widget.thumbnailUrl != null
                          ? DecorationImage(image: NetworkImage(widget.thumbnailUrl!), fit: BoxFit.cover)
                          : null,
                      color: AppColors.secondary.withAlpha(50),
                    ),
                    child: widget.thumbnailUrl == null
                        ? const Icon(Icons.graphic_eq_rounded, size: 80, color: AppColors.accent)
                        : null,
                  ),
                ),
                const SizedBox(height: 32),
                
                // Title
                Text(
                  widget.title,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.amiri(
                    fontSize: 24, 
                    fontWeight: FontWeight.bold, 
                    color: isDark ? Colors.white : AppColors.primary,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 32),
                
                // Progress Bar
                StreamBuilder<PositionData>(
                  stream: _positionDataStream,
                  builder: (context, snapshot) {
                    final positionData = snapshot.data;
                    return ProgressBar(
                      progress: positionData?.position ?? Duration.zero,
                      buffered: positionData?.bufferedPosition ?? Duration.zero,
                      total: positionData?.duration ?? Duration.zero,
                      onSeek: _audioPlayer.seek,
                      baseBarColor: isDark ? Colors.white10 : AppColors.secondary.withAlpha(80),
                      bufferedBarColor: AppColors.accent.withAlpha(30),
                      progressBarColor: AppColors.accent,
                      thumbColor: AppColors.accent,
                      barHeight: 6.0,
                      thumbRadius: 10.0,
                      thumbGlowRadius: 24,
                      timeLabelLocation: TimeLabelLocation.below,
                      timeLabelType: TimeLabelType.remainingTime,
                      timeLabelTextStyle: GoogleFonts.tajawal(
                        color: isDark ? Colors.white54 : AppColors.mutedForeground,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),
                
                // Controls Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Speed Control
                    _buildSpeedButton(),
                    
                    // Main Playback Controls
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildSeekButton(Icons.replay_10_rounded, -10),
                        const SizedBox(width: 12),
                        _buildPlayPauseButton(),
                        const SizedBox(width: 12),
                        _buildSeekButton(Icons.forward_10_rounded, 10),
                      ],
                    ),
                    
                    // placeholder for balance
                    const SizedBox(width: 48),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpeedButton() {
    return PopupMenuButton<double>(
      onSelected: _onSpeedChanged,
      offset: const Offset(0, -180),
      color: AppColors.darkSurface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      itemBuilder: (context) => [0.5, 1.0, 1.25, 1.5, 2.0].map((s) => PopupMenuItem(
        value: s,
        child: Center(
          child: Text(
            '${s}x', 
            style: GoogleFonts.tajawal(
              color: _playbackSpeed == s ? AppColors.accent : Colors.white,
              fontWeight: FontWeight.bold,
            )
          ),
        ),
      )).toList(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.accent.withAlpha(30),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.accent.withAlpha(50)),
        ),
        child: Text(
          '${_playbackSpeed}x',
          style: GoogleFonts.tajawal(color: AppColors.accent, fontWeight: FontWeight.w900, fontSize: 13),
        ),
      ),
    );
  }

  Widget _buildSeekButton(IconData icon, int seconds) {
    return IconButton(
      icon: Icon(icon, color: AppColors.accent),
      iconSize: 32,
      onPressed: () => _audioPlayer.seek(_audioPlayer.position + Duration(seconds: seconds)),
    );
  }

  Widget _buildPlayPauseButton() {
    return StreamBuilder<PlayerState>(
      stream: _audioPlayer.playerStateStream,
      builder: (context, snapshot) {
        final playerState = snapshot.data;
        final processingState = playerState?.processingState;
        final playing = playerState?.playing;
        
        if (processingState == ProcessingState.loading || processingState == ProcessingState.buffering) {
          return const SizedBox(
            width: 72, height: 72,
            child: CircularProgressIndicator(color: AppColors.accent, strokeWidth: 3),
          );
        } else if (playing != true) {
          return IconButton(
            icon: const Icon(Icons.play_circle_fill_rounded),
            iconSize: 84,
            color: AppColors.accent,
            onPressed: _audioPlayer.play,
          );
        } else if (processingState != ProcessingState.completed) {
          return IconButton(
            icon: const Icon(Icons.pause_circle_filled_rounded),
            iconSize: 84,
            color: AppColors.accent,
            onPressed: _audioPlayer.pause,
          );
        } else {
          return IconButton(
            icon: const Icon(Icons.replay_circle_filled_rounded),
            iconSize: 84,
            color: AppColors.accent,
            onPressed: () => _audioPlayer.seek(Duration.zero),
          );
        }
      },
    );
  }
}

class PositionData {
  final Duration position;
  final Duration bufferedPosition;
  final Duration duration;

  PositionData(this.position, this.bufferedPosition, this.duration);
}
