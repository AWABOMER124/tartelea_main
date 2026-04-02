// lib/features/audio_rooms/domain/repositories/audio_room_repository.dart
import '../entities/audio_room.dart';
import '../entities/participant.dart';

abstract class AudioRoomRepository {
  Future<AudioRoom> getRoomDetails(String roomId);
  
  /// Stream of room state changes (e.g. connections drop, re-connect)
  Stream<AudioRoom> watchRoomState(String roomId);
  
  /// Stream of participants joining, leaving, speaking, etc.
  Stream<List<Participant>> watchParticipants(String roomId);

  Future<void> joinRoom(String roomId, String token);
  Future<void> leaveRoom(String roomId);
  
  Future<void> toggleSubscribedMic(bool isMuted);
  Future<void> toggleHandRaised(String roomId, bool isRaised);
  
  /// Send reactions like emojis to the room
  Future<void> sendReaction(String roomId, String emoji);
}
