import '../../core/api/api_client.dart';
import '../models/post_model.dart';

class PostRepository {
  final ApiClient _api;

  PostRepository(this._api);

  Future<List<PostModel>> getPosts({String? category}) async {
    final response = await _api.get('/posts', queryParameters: {
      if (category != null) 'category': category,
    });
    
    return (response.data as List)
        .map((json) => PostModel.fromJson(json))
        .toList();
  }

  Future<PostModel> createPost({
    required String title,
    String? body,
    required String category,
  }) async {
    final response = await _api.post('/posts', data: {
      'title': title,
      'body': body,
      'category': category,
    });

    return PostModel.fromJson(response.data);
  }

  Future<void> likePost(String postId) async {
    await _api.post('/posts/$postId/like');
  }

  Future<void> addComment(String postId, String text) async {
    await _api.post('/posts/$postId/comment', data: {
      'content': text,
    });
  }
}
