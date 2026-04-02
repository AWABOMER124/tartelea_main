import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/profile_model.dart';
import '../../data/repositories/profile_repository.dart';
import 'auth_provider.dart';
import '../../core/api/api_provider.dart';

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  return ProfileRepository(api);
});

final userProfileProvider = FutureProvider<ProfileModel?>((ref) async {
  final user = ref.watch(userProvider);
  if (user == null) return null;
  
  return ref.read(profileRepositoryProvider).getProfile(user.id);
});
