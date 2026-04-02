// lib/features/audio_rooms/presentation/widgets/participant_avatar.dart
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/participant.dart';

class ParticipantAvatar extends StatefulWidget {
  final Participant participant;
  final bool isDark;

  const ParticipantAvatar({
    super.key,
    required this.participant,
    required this.isDark,
  });

  @override
  State<ParticipantAvatar> createState() => _ParticipantAvatarState();
}

class _ParticipantAvatarState extends State<ParticipantAvatar> with SingleTickerProviderStateMixin {
  late AnimationController _rippleController;

  @override
  void initState() {
    super.initState();
    _rippleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    if (widget.participant.isSpeaking) {
      _rippleController.repeat();
    }
  }

  @override
  void didUpdateWidget(ParticipantAvatar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.participant.isSpeaking && !oldWidget.participant.isSpeaking) {
      _rippleController.repeat();
    } else if (!widget.participant.isSpeaking && oldWidget.participant.isSpeaking) {
      _rippleController.stop();
      _rippleController.reset();
    }
  }

  @override
  void dispose() {
    _rippleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isSpeaker = widget.participant.canSpeak;
    
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            if (widget.participant.isSpeaking)
              AnimatedBuilder(
                animation: _rippleController,
                builder: (context, child) {
                  return Container(
                    width: (isSpeaker ? 70 : 56) + (20 * _rippleController.value),
                    height: (isSpeaker ? 70 : 56) + (20 * _rippleController.value),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.spiritualGreen.withAlpha(((1 - _rippleController.value) * 127).toInt()),
                        width: 2,
                      ),
                    ),
                  );
                },
              ),
            CircleAvatar(
              radius: isSpeaker ? 35 : 28,
              backgroundColor: widget.isDark ? AppColors.darkCard : AppColors.secondary,
              // Use real avatarUrl if available, otherwise generic
              child: widget.participant.avatarUrl.isNotEmpty 
                  ? ClipOval(child: Image.network(widget.participant.avatarUrl, fit: BoxFit.cover))
                  : Icon(Icons.person, size: 30, color: widget.isDark ? Colors.white38 : AppColors.primary),
            ),
            if (widget.participant.isHost)
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(color: AppColors.spiritualGreen, shape: BoxShape.circle),
                  child: const Icon(Icons.star, color: Colors.white, size: 12),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          widget.participant.name,
          style: TextStyle(
            fontSize: isSpeaker ? 12 : 11,
            fontWeight: isSpeaker ? FontWeight.bold : FontWeight.normal,
            color: widget.isDark ? Colors.white70 : AppColors.primary,
          ),
        ),
      ],
    );
  }
}
