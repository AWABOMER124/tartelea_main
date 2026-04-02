// lib/features/audio_rooms/presentation/controllers/audio_room_state.dart
import '../../domain/entities/participant.dart';

class AudioRoomState {
  final bool isLoading;
  final String? error;
  final String connectionStatus; // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

  // المشاركون (يأتون من أحداث المحرك)
  final List<Participant> participants;

  // حالة المستخدم المحلي
  final bool isLocalMuted;
  final bool isLocalHandRaised;

  // بيانات تفاعلية
  final List<String> comments;
  final List<String> recentReactions;
  final bool isRecording;

  const AudioRoomState({
    this.isLoading = false,
    this.error,
    this.connectionStatus = 'disconnected',
    this.participants = const [],
    this.isLocalMuted = true,
    this.isLocalHandRaised = false,
    this.comments = const [],
    this.recentReactions = const [],
    this.isRecording = false,
  });

  factory AudioRoomState.initial() => const AudioRoomState(isLoading: true);

  // Computed properties
  List<Participant> get speakers => participants.where((p) => p.canSpeak).toList();
  List<Participant> get listeners => participants.where((p) => !p.canSpeak).toList();
  int get totalParticipants => participants.length;
  bool get isConnected => connectionStatus == 'connected';

  AudioRoomState copyWith({
    bool? isLoading,
    String? error,
    String? connectionStatus,
    List<Participant>? participants,
    bool? isLocalMuted,
    bool? isLocalHandRaised,
    List<String>? comments,
    List<String>? recentReactions,
    bool? isRecording,
  }) {
    return AudioRoomState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      connectionStatus: connectionStatus ?? this.connectionStatus,
      participants: participants ?? this.participants,
      isLocalMuted: isLocalMuted ?? this.isLocalMuted,
      isLocalHandRaised: isLocalHandRaised ?? this.isLocalHandRaised,
      comments: comments ?? this.comments,
      recentReactions: recentReactions ?? this.recentReactions,
      isRecording: isRecording ?? this.isRecording,
    );
  }
}
