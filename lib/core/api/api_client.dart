import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_config.dart';

class ApiClient {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  ApiClient() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('jwt_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (e, handler) {
        if (e.response?.statusCode == 401) {
          // Handle unauthorized (e.g., logout user)
        }
        return handler.next(e);
      },
    ));
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return await _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) async {
    return await _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) async {
    return await _dio.put(path, data: data);
  }

  Future<Response> delete(String path) async {
    return await _dio.delete(path);
  }
}
