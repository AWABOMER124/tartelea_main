// lib/features/audio_rooms/presentation/controllers/audio_room_controller.dart
//
// الـ Controller أصبح "مُستمِع" للأحداث بدل "مُدير" للبيانات.
// ─────────────────────────────────────────────────────────────
// التسلسل:
//   1. المستخدم يضغط زر ← Controller يُمرر الأمر للـ Engine
//   2. Engine يُنفّذ العملية ويُرسل Event
//   3. Controller يُحدّث الـ State بناءً على الـ Event
//   4. UI تُعيد بناء نفسها تلقائياً من خلال StreamProvider

import 'dart:async';
import 'package:rxdart/rxdart.dart';
import '../../domain/entities/participant.dart';
import '../../domain/events/room_event.dart';
import '../../domain/services/audio_engine.dart';
import 'audio_room_state.dart';

class AudioRoomController {
  final AudioEngine _engine;
  final String roomId;

  final BehaviorSubject<AudioRoomState> stateSubject =
      BehaviorSubject.seeded(AudioRoomState.initial());
  AudioRoomState get state => stateSubject.value;

  StreamSubscription? _eventSubscription;
  bool _isDisposed = false;

  AudioRoomController({
    required AudioEngine engine,
    required this.roomId,
  }) : _engine = engine {
    _init();
  }

  // ─── Initialization ──────────────────────────────────────

  Future<void> _init() async {
    try {
      // 1. الاستماع للأحداث قبل الاتصال
      _eventSubscription = _engine.eventStream.listen(
        _handleEvent,
        onError: (e) => _setState(state.copyWith(error: e.toString())),
      );

      // 2. الاتصال بالغرفة
      await _engine.connect('wss://mock.livekit.cloud', 'mock_token_$roomId');

    } catch (e) {
      if (!_isDisposed) {
        _setState(state.copyWith(isLoading: false, error: e.toString()));
      }
    }
  }

  // ─── Event Handler ───────────────────────────────────────
  // هذه الدالة تعالج كل الأحداث القادمة من المحرك
  // باستخدام Dart 3 pattern matching (exhaustive switch)

  void _handleEvent(RoomEvent event) {
    if (_isDisposed) return;

    switch (event) {
      case RoomConnectedEvent():
        _setState(state.copyWith(
          isLoading: false,
          connectionStatus: 'connected',
        ));

      case RoomReconnectingEvent(:final attemptNumber):
        _setState(state.copyWith(
          connectionStatus: 'reconnecting',
          error: 'محاولة إعادة الاتصال #$attemptNumber...',
        ));

      case RoomDisconnectedEvent(:final reason):
        _setState(state.copyWith(
          connectionStatus: 'disconnected',
          error: reason,
        ));

      case ParticipantJoinedEvent(:final participant):
        final updated = List<Participant>.from(state.participants)
          ..add(participant);
        _setState(state.copyWith(participants: updated));

      case ParticipantLeftEvent(:final participantId):
        final updated = state.participants
            .where((p) => p.id != participantId)
            .toList();
        _setState(state.copyWith(participants: updated));

      case ActiveSpeakerChangedEvent(:final activeSpeakerIds):
        final updated = state.participants.map((p) {
          return p.copyWith(isSpeaking: activeSpeakerIds.contains(p.id));
        }).toList();
        _setState(state.copyWith(participants: updated));

      case ParticipantMuteChangedEvent(:final participantId, :final isMuted):
        if (participantId == 'local_user') {
          _setState(state.copyWith(isLocalMuted: isMuted));
        }
        final updated = state.participants.map((p) {
          if (p.id == participantId) return p.copyWith(isMuted: isMuted);
          return p;
        }).toList();
        _setState(state.copyWith(participants: updated));

      case HandRaiseChangedEvent(:final participantId, :final isRaised):
        if (participantId == 'local_user') {
          _setState(state.copyWith(isLocalHandRaised: isRaised));
        }
        final updated = state.participants.map((p) {
          if (p.id == participantId) return p.copyWith(hasHandRaised: isRaised);
          return p;
        }).toList();
        _setState(state.copyWith(participants: updated));

      case ReactionReceivedEvent(:final emoji):
        final reactions = List<String>.from(state.recentReactions)..add(emoji);
        // نحتفظ بآخر 20 تفاعل فقط
        if (reactions.length > 20) reactions.removeRange(0, reactions.length - 20);
        _setState(state.copyWith(recentReactions: reactions));

      case LiveCommentEvent(:final participantName, :final message):
        final comments = List<String>.from(state.comments)
          ..add('$participantName: $message');
        // نحتفظ بآخر 50 تعليق
        if (comments.length > 50) comments.removeRange(0, comments.length - 50);
        _setState(state.copyWith(comments: comments));

      case RecordingStateChangedEvent(:final isRecording):
        _setState(state.copyWith(isRecording: isRecording));
    }
  }

  // ─── User Actions (تمر عبر المحرك) ──────────────────────

  Future<void> toggleMic() async {
    final newEnabled = !_engine.isMicEnabled;
    // Optimistic UI — نحدّث الحالة فوراً قبل أن ينتهي المحرك
    _setState(state.copyWith(isLocalMuted: !newEnabled));
    await _engine.setMicEnabled(newEnabled);
  }

  Future<void> toggleHandRaise() async {
    final newRaised = !state.isLocalHandRaised;
    // Optimistic UI
    _setState(state.copyWith(isLocalHandRaised: newRaised));
    await _engine.setHandRaised(newRaised);
  }

  Future<void> sendReaction(String emoji) async {
    await _engine.sendReaction(emoji);
  }

  Future<void> sendMessage(String message) async {
    await _engine.sendMessage(message);
  }

  // ─── Lifecycle ───────────────────────────────────────────

  void dispose() {
    _isDisposed = true;
    _eventSubscription?.cancel();
    _engine.disconnect();
    _engine.dispose();
    stateSubject.close();
  }

  void _setState(AudioRoomState value) {
    if (!_isDisposed && !stateSubject.isClosed) {
      stateSubject.add(value);
    }
  }
}
