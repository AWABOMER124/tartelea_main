// lib/features/audio_rooms/presentation/controllers/providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/engines/mock_audio_engine.dart';
import '../../domain/services/audio_engine.dart';
import 'audio_room_controller.dart';
import 'audio_room_state.dart';

// ─── 1. Audio Engine Provider ──────────────────────────────
// عند جاهزية LiveKit، غيّر هذا السطر فقط:
//   return LiveKitAudioEngine();
final audioEngineProvider = Provider.autoDispose<AudioEngine>((ref) {
  final engine = MockAudioEngine();
  ref.onDispose(() => engine.dispose());
  return engine;
});

// ─── 2. Controller Provider ────────────────────────────────
// يدير دورة حياة الـ Controller (إنشاء + تنظيف)
final audioRoomControllerProvider = Provider.family.autoDispose<AudioRoomController, String>((ref, roomId) {
  final engine = ref.watch(audioEngineProvider);
  final controller = AudioRoomController(engine: engine, roomId: roomId);

  ref.onDispose(() => controller.dispose());
  return controller;
});

// ─── 3. State Stream Provider ──────────────────────────────
// يوفر حالة الغرفة كـ Stream تتحدث تلقائياً
final audioRoomStateProvider = StreamProvider.family.autoDispose<AudioRoomState, String>((ref, roomId) {
  final controller = ref.watch(audioRoomControllerProvider(roomId));
  return controller.stateSubject.stream;
});
