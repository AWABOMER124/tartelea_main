// lib/features/content/domain/entities/content_item.dart
//
// كيان المحتوى — Pure Dart
// يمثل: فيديو، صوتي، مقالة

enum ContentType { video, audio, article }

enum ContentCategory {
  tahliya,     // التحلية
  takhliya,    // التخلية
  tajalli,     // التجلي
  psychological, // نفسي
  sudan,       // وعي سوداني
  general,     // عام
}

class ContentItem {
  final String id;
  final String title;
  final String? description;
  final ContentCategory category;
  final ContentType type;
  final String? externalUrl;
  final String? mediaUrl;
  final String? thumbnailUrl;
  final String? duration;
  final bool isSudanAwareness;
  final DateTime? createdAt;

  const ContentItem({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    required this.type,
    this.externalUrl,
    this.mediaUrl,
    this.thumbnailUrl,
    this.duration,
    this.isSudanAwareness = false,
    this.createdAt,
  });

  /// هل المحتوى يحتوي على وسائط قابلة للتشغيل؟
  bool get hasMedia => mediaUrl != null && mediaUrl!.isNotEmpty;
  bool get isVideo => type == ContentType.video;
  bool get isAudio => type == ContentType.audio;
  bool get isArticle => type == ContentType.article;

  /// Icon حسب نوع المحتوى
  String get typeLabel => switch (type) {
    ContentType.video => '🎬 فيديو',
    ContentType.audio => '🎧 صوتي',
    ContentType.article => '📝 مقالة',
  };
}
