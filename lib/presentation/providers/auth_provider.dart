import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_provider.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/models/profile_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  return AuthRepository(api);
});

// Simple provider to check if a token exists
final authTokenProvider = FutureProvider<String?>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString('jwt_token');
});

final profileProvider = FutureProvider<ProfileModel?>((ref) async {
  final tokenAsync = ref.watch(authTokenProvider);
  final token = tokenAsync.asData?.value;
  if (token == null) return null;
  
  final api = ref.watch(apiClientProvider);
  try {
    final response = await api.get('/auth/me'); 
    return ProfileModel.fromJson(response.data);
  } catch (e) {
    return null;
  }
});

// Alias for UI compatibility
final userProvider = Provider<ProfileModel?>((ref) {
  return ref.watch(profileProvider).asData?.value;
});

final isAuthorizedProvider = Provider<bool>((ref) {
  final profileAsync = ref.watch(profileProvider);
  return profileAsync.maybeWhen(
    data: (profile) => profile != null && (profile.role == 'trainer' || profile.role == 'admin'),
    orElse: () => false,
  );
});

final isAdminProvider = Provider<bool>((ref) {
  final profileAsync = ref.watch(profileProvider);
  return profileAsync.maybeWhen(
    data: (profile) => profile != null && profile.role == 'admin',
    orElse: () => false,
  );
});
