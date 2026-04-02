// lib/features/audio_rooms/domain/entities/audio_room.dart
import 'participant.dart';

enum RoomStatus { connecting, connected, reconnecting, disconnected }

class AudioRoom {
  final String id;
  final String title;
  final String description;
  final String coverUrl;
  final RoomStatus status;
  final List<Participant> participants;
  final bool isRecording;
  final DateTime createdAt;

  const AudioRoom({
    required this.id,
    required this.title,
    this.description = '',
    this.coverUrl = '',
    this.status = RoomStatus.disconnected,
    this.participants = const [],
    this.isRecording = false,
    required this.createdAt,
  });

  List<Participant> get speakers => participants.where((p) => p.canSpeak).toList();
  List<Participant> get listeners => participants.where((p) => !p.canSpeak).toList();
  int get totalParticipants => participants.length;

  AudioRoom copyWith({
    String? title,
    String? description,
    String? coverUrl,
    RoomStatus? status,
    List<Participant>? participants,
    bool? isRecording,
  }) {
    return AudioRoom(
      id: id,
      title: title ?? this.title,
      description: description ?? this.description,
      coverUrl: coverUrl ?? this.coverUrl,
      status: status ?? this.status,
      participants: participants ?? this.participants,
      isRecording: isRecording ?? this.isRecording,
      createdAt: createdAt,
    );
  }
}
