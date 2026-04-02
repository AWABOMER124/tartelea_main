// lib/features/content/presentation/providers/content_providers.dart
//
// Providers للمحتوى — مع دعم Caching

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_provider.dart';
import '../../domain/entities/content_item.dart';
import '../../domain/repositories/content_repository.dart' as domain;
import '../../data/repositories/content_repository_impl.dart';

// ─── 1. Repository Provider ────────────────────────────────
final contentRepositoryProvider = Provider<domain.ContentRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  return ContentRepositoryImpl(api);
});

// ─── 2. All Contents Provider ──────────────────────────────
final contentsProvider = FutureProvider.family<List<ContentItem>, ContentCategory?>((ref, category) async {
  final repo = ref.watch(contentRepositoryProvider);
  return repo.getContents(category: category);
});

// ─── 3. Content Detail Provider ────────────────────────────
final contentDetailProvider = FutureProvider.family<ContentItem, String>((ref, id) async {
  final repo = ref.watch(contentRepositoryProvider);
  return repo.getContentById(id);
});

// ─── 4. Search Provider ────────────────────────────────────
final contentSearchProvider = FutureProvider.family<List<ContentItem>, String>((ref, query) async {
  final repo = ref.watch(contentRepositoryProvider);
  return repo.searchContents(query);
});

// ─── 5. Sudan Awareness Provider ───────────────────────────
final sudanAwarenessContentsProvider = FutureProvider<List<ContentItem>>((ref) async {
  final repo = ref.watch(contentRepositoryProvider);
  return repo.getContents(isSudanAwareness: true);
});

// ─── 6. Grouped by Type ────────────────────────────────────
final videoContentsProvider = FutureProvider<List<ContentItem>>((ref) async {
  final repo = ref.watch(contentRepositoryProvider);
  return repo.getContents(type: ContentType.video);
});

final audioContentsProvider = FutureProvider<List<ContentItem>>((ref) async {
  final repo = ref.watch(contentRepositoryProvider);
  return repo.getContents(type: ContentType.audio);
});
