import '../../core/api/api_client.dart';
import '../models/subscription_model.dart';

class SubscriptionRepository {
  final ApiClient _api;

  SubscriptionRepository(this._api);

  Future<SubscriptionModel?> getUserSubscription(String userId) async {
    final response = await _api.get('/subscriptions/$userId');
    if (response.data == null) return null;
    return SubscriptionModel.fromJson(response.data);
  }
}
