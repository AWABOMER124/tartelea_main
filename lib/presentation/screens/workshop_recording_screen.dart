import 'package:flutter/material.dart';
import '../widgets/video_player_widget.dart';

class WorkshopRecordingScreen extends StatelessWidget {
  final String videoUrl;
  final String title;

  const WorkshopRecordingScreen({
    super.key, 
    required this.videoUrl, 
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: Text(title, style: const TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: Center(
        child: VideoPlayerWidget(videoUrl: videoUrl),
      ),
    );
  }
}
