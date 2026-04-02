// lib/features/audio_rooms/domain/entities/participant.dart

enum ParticipantRole { listener, speaker, host }

class Participant {
  final String id;
  final String name;
  final String avatarUrl;
  final ParticipantRole role;
  final bool isSpeaking;
  final bool isMuted;
  final bool hasHandRaised;
  final DateTime joinedAt;

  const Participant({
    required this.id,
    required this.name,
    this.avatarUrl = '',
    this.role = ParticipantRole.listener,
    this.isSpeaking = false,
    this.isMuted = true,
    this.hasHandRaised = false,
    required this.joinedAt,
  });

  bool get isHost => role == ParticipantRole.host;
  bool get canSpeak => role == ParticipantRole.speaker || role == ParticipantRole.host;
  
  Participant copyWith({
    String? name,
    String? avatarUrl,
    ParticipantRole? role,
    bool? isSpeaking,
    bool? isMuted,
    bool? hasHandRaised,
  }) {
    return Participant(
      id: id,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      role: role ?? this.role,
      isSpeaking: isSpeaking ?? this.isSpeaking,
      isMuted: isMuted ?? this.isMuted,
      hasHandRaised: hasHandRaised ?? this.hasHandRaised,
      joinedAt: joinedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Participant &&
        other.id == id &&
        other.name == name &&
        other.role == role &&
        other.isSpeaking == isSpeaking &&
        other.isMuted == isMuted &&
        other.hasHandRaised == hasHandRaised;
  }

  @override
  int get hashCode {
    return id.hashCode ^ name.hashCode ^ role.hashCode ^ isSpeaking.hashCode ^ isMuted.hashCode ^ hasHandRaised.hashCode;
  }
}
