import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_config.dart';
import '../models/content_model.dart';

class ContentRepository {
  final ApiClient _api;

  // ─── Cache Settings ───────────────────────────────────────
  static const _cacheKey = 'cached_contents_v2';
  static const _cacheTimestampKey = 'cache_ts_contents_v2';
  static const _cacheDuration = Duration(hours: 2);

  ContentRepository(this._api);

  Future<List<ContentModel>> getContents({
    String? category,
    bool? isSudanAwareness,
  }) async {
    try {
      // 1. جلب من API
      final response = await _api.get(ApiConfig.contents, queryParameters: {
        'category': ?category,
        'is_sudan_awareness': ?isSudanAwareness,
      });

      final items = (response.data as List)
          .map((json) => ContentModel.fromJson(json))
          .toList();

      // 2. حفظ في الـ Cache
      await _saveToCache(items);
      return items;
    } catch (e) {
      // 3. Fallback: Cache أولاً
      final cached = await _loadFromCache();
      if (cached.isNotEmpty) {
        return _applyFilters(cached, category: category, isSudanAwareness: isSudanAwareness);
      }
      // 4. Fallback أخير: Mock
      return _applyFilters(_getMockContents(), category: category, isSudanAwareness: isSudanAwareness);
    }
  }

  Future<ContentModel> getContentById(String id) async {
    try {
      final response = await _api.get('${ApiConfig.contentDetail}$id');
      return ContentModel.fromJson(response.data);
    } catch (_) {
      final cached = await _loadFromCache();
      return cached.firstWhere((c) => c.id == id, orElse: () => _getMockContents().first);
    }
  }

  // ─── Cache Layer ──────────────────────────────────────────

  Future<void> _saveToCache(List<ContentModel> items) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = items.map((item) => item.toJson()).toList();
      await prefs.setString(_cacheKey, jsonEncode(jsonList));
      await prefs.setInt(_cacheTimestampKey, DateTime.now().millisecondsSinceEpoch);
    } catch (_) {
      // Caching failure shouldn't affect the user
    }
  }

  Future<List<ContentModel>> _loadFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // تحقق من صلاحية الـ Cache
      final ts = prefs.getInt(_cacheTimestampKey);
      if (ts != null) {
        final age = DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(ts));
        if (age > _cacheDuration) return []; // Cache expired
      }

      final raw = prefs.getString(_cacheKey);
      if (raw == null) return [];

      final jsonList = jsonDecode(raw) as List;
      return jsonList.map((json) => ContentModel.fromJson(json)).toList();
    } catch (_) {
      return [];
    }
  }

  List<ContentModel> _applyFilters(List<ContentModel> items, {String? category, bool? isSudanAwareness}) {
    var result = items;
    if (isSudanAwareness == true) {
      result = result.where((e) => e.isSudanAwareness).toList();
    }
    if (category != null) {
      result = result.where((e) => e.category == category).toList();
    }
    return result;
  }

  // ─── Mock Data ────────────────────────────────────────────

  List<ContentModel> _getMockContents() {
    return [
      ContentModel(
        id: 'mock-1',
        title: 'اساسيات اللسان العربي - فيديو',
        description: 'درس مرئي يشرح المفاهيم الأساسية لبداية رحلة التدبر.',
        category: 'tahliya',
        type: 'video',
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop',
        duration: '09:56',
      ),
      ContentModel(
        id: 'mock-2',
        title: 'تدبر سورة الفاتحة - صوتي',
        description: 'تحليل صوتي لعمق معاني أم الكتاب والجذور اللغوية.',
        category: 'tahliya',
        type: 'audio',
        mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
        duration: '06:12',
      ),
      ContentModel(
        id: 'mock-3',
        title: 'مفهوم التزكية',
        description: 'مقالة تشرح مفهوم التزكية في ضوء المدرسة الترتيلية.',
        category: 'takhliya',
        type: 'article',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1999&auto=format&fit=crop',
      ),
    ];
  }
}
