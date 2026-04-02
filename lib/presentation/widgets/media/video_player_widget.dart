import 'package:flutter/material.dart';
import 'package:chewie/chewie.dart';
import 'package:video_player/video_player.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';

class VideoPlayerWidget extends StatefulWidget {
  final String videoUrl;
  final String? thumbnailUrl;

  const VideoPlayerWidget({
    super.key,
    required this.videoUrl,
    this.thumbnailUrl,
  });

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  late VideoPlayerController _videoPlayerController;
  ChewieController? _chewieController;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
    await _videoPlayerController.initialize();
    
    _chewieController = ChewieController(
      videoPlayerController: _videoPlayerController,
      autoPlay: false,
      looping: false,
      aspectRatio: _videoPlayerController.value.aspectRatio,
      materialProgressColors: ChewieProgressColors(
        playedColor: AppColors.accent,
        handleColor: AppColors.accent,
        backgroundColor: Colors.white.withAlpha(25),
        bufferedColor: Colors.white.withAlpha(51),
      ),
      placeholder: widget.thumbnailUrl != null 
        ? Image.network(widget.thumbnailUrl!, fit: BoxFit.cover)
        : Container(
            color: Colors.black,
            child: const Center(child: Icon(Icons.movie_rounded, color: AppColors.accent, size: 64)),
          ),
      autoInitialize: true,
      errorBuilder: (context, errorMessage) {
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
              const SizedBox(height: 12),
              Text(
                'عذراً، فشل تحميل المقطع',
                style: GoogleFonts.tajawal(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
      },
      bufferingBuilder: (context) {
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(color: AppColors.accent, strokeWidth: 3),
              const SizedBox(height: 16),
              Text(
                'جاري التحميل...',
                style: GoogleFonts.tajawal(color: Colors.white, fontSize: 12),
              ),
            ],
          ),
        );
      },
    );
    setState(() {});
  }

  @override
  void dispose() {
    _videoPlayerController.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: _chewieController?.videoPlayerController.value.aspectRatio ?? 16/9,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black,
          boxShadow: [
            BoxShadow(color: Colors.black.withAlpha(51), blurRadius: 20, offset: const Offset(0, 10))
          ],
        ),
        child: _chewieController != null && _chewieController!.videoPlayerController.value.isInitialized
            ? Chewie(controller: _chewieController!)
            : const Center(
                child: CircularProgressIndicator(color: AppColors.accent, strokeWidth: 3),
              ),
      ),
    );
  }
}
