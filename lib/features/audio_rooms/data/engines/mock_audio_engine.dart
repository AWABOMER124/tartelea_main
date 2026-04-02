// lib/features/audio_rooms/data/engines/mock_audio_engine.dart
//
// محرك صوت وهمي يحاكي سلوك غرفة حقيقية
// ─────────────────────────────────────────
// يولّد أحداث واقعية:
//   - مشاركون ينضمون ويغادرون
//   - متحدثون نشطون يتغيرون
//   - تعليقات مباشرة
//   - تفاعلات (إيموجي)
//
// عند جاهزية LiveKit يتم استبدال هذا الملف فقط.

import 'dart:async';
import 'dart:math';
import '../../domain/entities/participant.dart';
import '../../domain/events/room_event.dart';
import '../../domain/services/audio_engine.dart';

class MockAudioEngine implements AudioEngine {
  final _eventController = StreamController<RoomEvent>.broadcast();
  final _random = Random();

  EngineConnectionState _connectionState = EngineConnectionState.disconnected;
  bool _micEnabled = false;
  bool _disposed = false;

  Timer? _activeSpeakerTimer;
  Timer? _commentTimer;
  Timer? _participantTimer;

  // قائمة المشاركين الوهميين
  final List<Participant> _participants = [];
  int _nextParticipantId = 10;

  // أسماء عربية واقعية للمشاركين الوهميين
  static const _mockNames = [
    'عبدالرحمن', 'فاطمة', 'محمد أحمد', 'نورة',
    'خالد العمري', 'سارة', 'أسامة', 'هدى',
    'عمر بن سعد', 'ريم', 'يوسف', 'مريم',
  ];

  // تعليقات مباشرة واقعية
  static const _mockComments = [
    'سبحان الله ❤️', 'بارك الله فيكم',
    'ماشاء الله تبارك الرحمن', 'جزاكم الله خيراً',
    'اللهم صل على محمد', 'تلاوة رائعة 🤲',
    'نسأل الله العلم النافع', 'اللهم علمنا ما ينفعنا',
    'يا سلام.. أسلوب مميز', 'الله يبارك في الشيخ',
  ];

  @override
  Stream<RoomEvent> get eventStream => _eventController.stream;

  @override
  EngineConnectionState get connectionState => _connectionState;

  @override
  bool get isMicEnabled => _micEnabled;

  @override
  Future<void> connect(String url, String token) async {
    if (_disposed) return;

    _connectionState = EngineConnectionState.connecting;

    // محاكاة تأخير الاتصال
    await Future.delayed(const Duration(milliseconds: 800));
    if (_disposed) return;

    _connectionState = EngineConnectionState.connected;

    // إضافة المشاركين الأوليين
    _seedInitialParticipants();

    // إرسال حدث "الاتصال تم"
    _emit(RoomConnectedEvent(
      roomId: 'mock_room_1',
      timestamp: DateTime.now(),
    ));

    // بدء توليد الأحداث المستمرة
    _startEventGenerators();
  }

  void _seedInitialParticipants() {
    // المضيف (Host)
    final host = Participant(
      id: 'host_1',
      name: 'الشيخ عبدالله',
      role: ParticipantRole.host,
      isSpeaking: true,
      isMuted: false,
      joinedAt: DateTime.now(),
    );

    // متحدثون
    final speakers = [
      Participant(id: 'sp_1', name: 'أحمد علي', role: ParticipantRole.speaker, joinedAt: DateTime.now()),
      Participant(id: 'sp_2', name: 'د. سارة محمد', role: ParticipantRole.speaker, joinedAt: DateTime.now()),
    ];

    // مستمعون
    final listeners = List.generate(5, (i) => Participant(
      id: 'lst_$i',
      name: _mockNames[i % _mockNames.length],
      role: ParticipantRole.listener,
      joinedAt: DateTime.now(),
    ));

    _participants.addAll([host, ...speakers, ...listeners]);

    // إرسال أحداث انضمام لكل مشارك
    for (final p in _participants) {
      _emit(ParticipantJoinedEvent(participant: p, timestamp: DateTime.now()));
    }
  }

  void _startEventGenerators() {
    // 1. تغيير المتحدث النشط كل 3-6 ثوانٍ
    _activeSpeakerTimer = Timer.periodic(
      Duration(seconds: 3 + _random.nextInt(4)),
      (_) => _generateActiveSpeakerChange(),
    );

    // 2. تعليق مباشر كل 4-8 ثوانٍ
    _commentTimer = Timer.periodic(
      Duration(seconds: 4 + _random.nextInt(5)),
      (_) => _generateComment(),
    );

    // 3. مشارك ينضم/يغادر كل 10-20 ثانية
    _participantTimer = Timer.periodic(
      Duration(seconds: 10 + _random.nextInt(11)),
      (_) => _generateParticipantChange(),
    );
  }

  void _generateActiveSpeakerChange() {
    if (_disposed || _participants.isEmpty) return;

    final speakersAndHost = _participants
        .where((p) => p.canSpeak)
        .toList();

    if (speakersAndHost.isEmpty) return;

    // اختيار 1-2 متحدثين نشطين عشوائياً
    speakersAndHost.shuffle(_random);
    final activeCount = 1 + _random.nextInt(min(2, speakersAndHost.length));
    final activeIds = speakersAndHost
        .take(activeCount)
        .map((p) => p.id)
        .toList();

    _emit(ActiveSpeakerChangedEvent(
      activeSpeakerIds: activeIds,
      timestamp: DateTime.now(),
    ));
  }

  void _generateComment() {
    if (_disposed || _participants.isEmpty) return;

    final commenter = _participants[_random.nextInt(_participants.length)];
    final comment = _mockComments[_random.nextInt(_mockComments.length)];

    _emit(LiveCommentEvent(
      participantId: commenter.id,
      participantName: commenter.name,
      message: comment,
      timestamp: DateTime.now(),
    ));
  }

  void _generateParticipantChange() {
    if (_disposed) return;

    // 60% احتمال انضمام، 40% مغادرة
    if (_random.nextDouble() < 0.6 || _participants.length < 4) {
      // مشارك جديد ينضم
      final newParticipant = Participant(
        id: 'auto_${_nextParticipantId++}',
        name: _mockNames[_random.nextInt(_mockNames.length)],
        role: ParticipantRole.listener,
        joinedAt: DateTime.now(),
      );
      _participants.add(newParticipant);
      _emit(ParticipantJoinedEvent(
        participant: newParticipant,
        timestamp: DateTime.now(),
      ));
    } else {
      // مشارك يغادر (لا نزيل المضيف أبداً)
      final removable = _participants.where((p) => !p.isHost).toList();
      if (removable.isNotEmpty) {
        final leaving = removable[_random.nextInt(removable.length)];
        _participants.remove(leaving);
        _emit(ParticipantLeftEvent(
          participantId: leaving.id,
          timestamp: DateTime.now(),
        ));
      }
    }
  }

  // ─── Local Controls ──────────────────────────────────────

  @override
  Future<void> setMicEnabled(bool enabled) async {
    if (_disposed) return;
    _micEnabled = enabled;
    _emit(ParticipantMuteChangedEvent(
      participantId: 'local_user',
      isMuted: !enabled,
      timestamp: DateTime.now(),
    ));
  }

  @override
  Future<void> setHandRaised(bool raised) async {
    if (_disposed) return;
    _emit(HandRaiseChangedEvent(
      participantId: 'local_user',
      isRaised: raised,
      timestamp: DateTime.now(),
    ));
  }

  @override
  Future<void> sendReaction(String emoji) async {
    if (_disposed) return;
    _emit(ReactionReceivedEvent(
      participantId: 'local_user',
      emoji: emoji,
      timestamp: DateTime.now(),
    ));
  }

  @override
  Future<void> sendMessage(String message) async {
    if (_disposed) return;
    _emit(LiveCommentEvent(
      participantId: 'local_user',
      participantName: 'أنت',
      message: message,
      timestamp: DateTime.now(),
    ));
  }

  @override
  Future<void> disconnect() async {
    _stopTimers();
    _connectionState = EngineConnectionState.disconnected;
    _emit(RoomDisconnectedEvent(reason: 'User left', timestamp: DateTime.now()));
  }

  @override
  void dispose() {
    _disposed = true;
    _stopTimers();
    _eventController.close();
  }

  // ─── Internal Helpers ────────────────────────────────────

  void _emit(RoomEvent event) {
    if (!_disposed && !_eventController.isClosed) {
      _eventController.add(event);
    }
  }

  void _stopTimers() {
    _activeSpeakerTimer?.cancel();
    _commentTimer?.cancel();
    _participantTimer?.cancel();
  }
}
