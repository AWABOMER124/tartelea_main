// lib/features/audio_rooms/domain/services/audio_engine.dart
//
// واجهة محرك الصوت (Audio Engine Interface)
// ─────────────────────────────────────────────
// هذا "العقد" الذي يربط كل شيء:
//   - MockAudioEngine: للتطوير والاختبار (بدون سيرفر)
//   - LiveKitAudioEngine: للإنتاج (سيرفر حقيقي)
//
// الـ Controller لا يعرف أي شيء عن التنفيذ الداخلي.
// يعرف فقط هذه الواجهة.

import '../events/room_event.dart';

/// حالة المحرك الداخلية
enum EngineConnectionState {
  disconnected,
  connecting,
  connected,
  reconnecting,
}

/// واجهة محرك الصوت — كل engine يجب أن يوفر هذه الوظائف
abstract class AudioEngine {

  /// الاتصال بالغرفة
  ///   - [url]: عنوان سيرفر الصوت (LiveKit URL)
  ///   - [token]: رمز المصادقة (JWT)
  Future<void> connect(String url, String token);

  /// قطع الاتصال
  Future<void> disconnect();

  /// بث مستمر لكل الأحداث التي تحدث في الغرفة
  /// هذا هو القلب النابض — Stream واحد لكل شيء
  Stream<RoomEvent> get eventStream;

  /// حالة الاتصال الحالية
  EngineConnectionState get connectionState;

  // ─── تحكم محلي (Local Controls) ──────────────────────

  /// كتم/إلغاء كتم المايك المحلي
  Future<void> setMicEnabled(bool enabled);

  /// هل المايك المحلي مفعّل؟
  bool get isMicEnabled;

  /// رفع/إنزال اليد
  Future<void> setHandRaised(bool raised);

  /// إرسال تفاعل (إيموجي) للغرفة
  Future<void> sendReaction(String emoji);

  /// إرسال رسالة (تعليق مباشر) للغرفة
  Future<void> sendMessage(String message);

  /// تنظيف الموارد عند الخروج
  void dispose();
}
