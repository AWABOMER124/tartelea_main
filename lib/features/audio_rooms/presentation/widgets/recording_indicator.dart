// lib/features/audio_rooms/presentation/widgets/recording_indicator.dart
import 'package:flutter/material.dart';

class RecordingIndicator extends StatelessWidget {
  final bool isRecording;
  const RecordingIndicator({super.key, required this.isRecording});

  @override
  Widget build(BuildContext context) {
    if (!isRecording) return const SizedBox.shrink();
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        const Text('REC', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 10)),
      ],
    );
  }
}
