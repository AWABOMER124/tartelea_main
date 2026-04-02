// lib/features/audio_rooms/domain/events/room_event.dart
//
// كل شيء يحدث في الغرفة الصوتية يُمثَّل كـ "حدث" (Event).
// هذا يجعل النظام:
//   - قابل للاختبار (Testable)
//   - قابل للتتبع (Loggable)
//   - مفصول تماماً عن مصدر البيانات (LiveKit, Mock, أو أي شيء آخر)

import '../entities/participant.dart';

/// الحدث الأب — كل أنواع الأحداث ترث منه
sealed class RoomEvent {
  final DateTime timestamp;
  const RoomEvent({required this.timestamp});
}

// ─── أحداث الاتصال (Connection Events) ─────────────────────────

/// الغرفة اتصلت بنجاح
class RoomConnectedEvent extends RoomEvent {
  final String roomId;
  const RoomConnectedEvent({required this.roomId, required super.timestamp});
}

/// فُقد الاتصال ويجري إعادة محاولة
class RoomReconnectingEvent extends RoomEvent {
  final int attemptNumber;
  const RoomReconnectingEvent({required this.attemptNumber, required super.timestamp});
}

/// فُقد الاتصال نهائياً
class RoomDisconnectedEvent extends RoomEvent {
  final String? reason;
  const RoomDisconnectedEvent({this.reason, required super.timestamp});
}

// ─── أحداث المشاركين (Participant Events) ───────────────────────

/// انضم مشارك جديد للغرفة
class ParticipantJoinedEvent extends RoomEvent {
  final Participant participant;
  const ParticipantJoinedEvent({required this.participant, required super.timestamp});
}

/// غادر مشارك الغرفة
class ParticipantLeftEvent extends RoomEvent {
  final String participantId;
  const ParticipantLeftEvent({required this.participantId, required super.timestamp});
}

/// تغيّرت حالة المتحدث النشط (Active Speaker)
class ActiveSpeakerChangedEvent extends RoomEvent {
  final List<String> activeSpeakerIds;
  const ActiveSpeakerChangedEvent({required this.activeSpeakerIds, required super.timestamp});
}

// ─── أحداث الصوت (Audio Events) ─────────────────────────────────

/// كتم/إلغاء كتم مشارك لمايكه
class ParticipantMuteChangedEvent extends RoomEvent {
  final String participantId;
  final bool isMuted;
  const ParticipantMuteChangedEvent({
    required this.participantId,
    required this.isMuted,
    required super.timestamp,
  });
}

/// رفع/إنزال يد مشارك
class HandRaiseChangedEvent extends RoomEvent {
  final String participantId;
  final bool isRaised;
  const HandRaiseChangedEvent({
    required this.participantId,
    required this.isRaised,
    required super.timestamp,
  });
}

// ─── أحداث تفاعلية (Interaction Events) ─────────────────────────

/// مشارك أرسل تفاعل (إيموجي)
class ReactionReceivedEvent extends RoomEvent {
  final String participantId;
  final String emoji;
  const ReactionReceivedEvent({
    required this.participantId,
    required this.emoji,
    required super.timestamp,
  });
}

/// رسالة تعليق مباشر في الغرفة
class LiveCommentEvent extends RoomEvent {
  final String participantId;
  final String participantName;
  final String message;
  const LiveCommentEvent({
    required this.participantId,
    required this.participantName,
    required this.message,
    required super.timestamp,
  });
}

// ─── أحداث تسجيل (Recording Events) ─────────────────────────────

/// بدأ/توقف تسجيل الغرفة
class RecordingStateChangedEvent extends RoomEvent {
  final bool isRecording;
  const RecordingStateChangedEvent({required this.isRecording, required super.timestamp});
}
