// lib/features/content/domain/repositories/content_repository.dart
//
// واجهة مستودع المحتوى — العقد المجرد
// يدعم: الفلترة، التفاصيل، والبحث

import '../entities/content_item.dart';

abstract class ContentRepository {
  /// جلب كل المحتوى (مع فلاتر اختيارية)
  Future<List<ContentItem>> getContents({
    ContentCategory? category,
    ContentType? type,
    bool? isSudanAwareness,
  });

  /// جلب محتوى واحد بالـ ID
  Future<ContentItem> getContentById(String id);

  /// البحث في المحتوى
  Future<List<ContentItem>> searchContents(String query);

  /// هل يوجد محتوى مخزّن محلياً (cached)؟
  Future<bool> hasCachedContents();

  /// حذف الـ Cache المحلي
  Future<void> clearCache();
}
