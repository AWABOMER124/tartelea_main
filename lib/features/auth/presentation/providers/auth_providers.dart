// lib/features/auth/presentation/providers/auth_providers.dart
//
// Providers جديدة للمصادقة — تحل محل auth_provider.dart القديم
// مع الحفاظ على نفس أسماء الـ Providers للتوافق العكسي
// ─────────────────────────────────────────────────────────

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_provider.dart';
import '../../domain/entities/app_user.dart';
import '../../domain/repositories/auth_repository.dart' as domain;
import '../../data/repositories/auth_repository_impl.dart';

// ─── 1. Repository Provider ────────────────────────────────
final authRepositoryProvider = Provider<domain.AuthRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  return AuthRepositoryImpl(api);
});

// ─── 2. Current User Provider ──────────────────────────────
final currentUserProvider = FutureProvider<AppUser?>((ref) async {
  final repo = ref.watch(authRepositoryProvider);
  return repo.getCurrentUser();
});

// ─── 3. Auth State Stream ──────────────────────────────────
final authStateProvider = StreamProvider<AppUser?>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return repo.watchAuthState();
});

// ─── 4. Convenience Providers (للتوافق مع الشاشات الحالية) ─
final isAuthorizedProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider).asData?.value;
  return user != null && user.isTrainer;
});

final isAdminProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider).asData?.value;
  return user != null && user.isAdmin;
});

// ─── 5. Has Active Session ─────────────────────────────────
final hasActiveSessionProvider = FutureProvider<bool>((ref) async {
  final repo = ref.watch(authRepositoryProvider);
  return repo.hasActiveSession();
});
