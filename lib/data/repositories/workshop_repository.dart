import '../../core/api/api_client.dart';
import '../models/workshop_model.dart';

class WorkshopRepository {
  final ApiClient _api;

  WorkshopRepository(this._api);

  Future<List<WorkshopModel>> getWorkshops() async {
    final response = await _api.get('/workshops');
    return (response.data as List)
        .map((json) => WorkshopModel.fromJson(json))
        .toList();
  }
}
