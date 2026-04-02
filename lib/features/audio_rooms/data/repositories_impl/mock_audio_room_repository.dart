// lib/features/audio_rooms/data/repositories_impl/mock_audio_room_repository.dart
import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/audio_room.dart';
import '../../domain/entities/participant.dart';
import '../../domain/repositories/audio_room_repository.dart';

final mockAudioRoomRepositoryProvider = Provider<AudioRoomRepository>((ref) {
  return MockAudioRoomRepository();
});

class MockAudioRoomRepository implements AudioRoomRepository {
  final _roomController = StreamController<AudioRoom>.broadcast();
  final _participantsController = StreamController<List<Participant>>.broadcast();
  
  final List<Participant> _mockParticipants = [
    Participant(id: '1', name: 'الشيخ عبدالله', role: ParticipantRole.host, isSpeaking: true, isMuted: false, joinedAt: DateTime.now()),
    Participant(id: '2', name: 'أحمد علي', role: ParticipantRole.speaker, joinedAt: DateTime.now()),
    Participant(id: '3', name: 'د. سارة', role: ParticipantRole.speaker, joinedAt: DateTime.now()),
    Participant(id: '4', name: 'مستمع 1', role: ParticipantRole.listener, joinedAt: DateTime.now()),
    Participant(id: '5', name: 'مستمع 2', role: ParticipantRole.listener, joinedAt: DateTime.now()),
  ];

  @override
  Future<AudioRoom> getRoomDetails(String roomId) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return AudioRoom(
      id: roomId,
      title: 'غرفة التدبر - Mock',
      status: RoomStatus.connected,
      createdAt: DateTime.now(),
      participants: _mockParticipants,
    );
  }

  @override
  Future<void> joinRoom(String roomId, String token) async {
    // Mock join
  }

  @override
  Future<void> leaveRoom(String roomId) async {
    // Mock leave
  }

  @override
  Future<void> sendReaction(String roomId, String emoji) async {
    // Mock reaction
  }

  @override
  Future<void> toggleHandRaised(String roomId, bool isRaised) async {
    // Update local state if needed
  }

  @override
  Future<void> toggleSubscribedMic(bool isMuted) async {
    // Update local state if needed
  }

  @override
  Stream<List<Participant>> watchParticipants(String roomId) {
    return _participantsController.stream;
  }

  @override
  Stream<AudioRoom> watchRoomState(String roomId) {
    return _roomController.stream;
  }
}
