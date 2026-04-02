// lib/features/audio_rooms/presentation/widgets/participant_grid.dart
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/participant.dart';
import 'participant_avatar.dart';

class ParticipantGrid extends StatelessWidget {
  final List<Participant> participants;
  final bool isDark;

  const ParticipantGrid({
    super.key,
    required this.participants,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final speakers = participants.where((p) => p.canSpeak).toList();
    final listeners = participants.where((p) => !p.canSpeak).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ─── Speakers Section ──────────────────────────────────
        Wrap(
          spacing: 24,
          runSpacing: 24,
          children: speakers.map((p) => ParticipantAvatar(
            participant: p,
            isDark: isDark,
          )).toList(),
        ),
        
        const SizedBox(height: 40),

        // ─── Listeners Section ─────────────────────────────────
        if (listeners.isNotEmpty) ...[
          Text(
            'المستمعون',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white70 : AppColors.mutedForeground,
            ),
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 20,
            runSpacing: 20,
            children: listeners.map((p) => ParticipantAvatar(
              participant: p,
              isDark: isDark,
            )).toList(),
          ),
        ],
      ],
    );
  }
}
