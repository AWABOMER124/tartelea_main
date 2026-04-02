import '../../core/api/api_client.dart';
import '../models/profile_model.dart';

class ProfileRepository {
  final ApiClient _api;

  ProfileRepository(this._api);

  Future<ProfileModel> getProfile(String id) async {
    final response = await _api.get('/profiles/$id');
    return ProfileModel.fromJson(response.data);
  }

  Future<void> updateProfile(ProfileModel profile) async {
    await _api.put('/profiles/${profile.id}', data: profile.toJson());
  }
}
