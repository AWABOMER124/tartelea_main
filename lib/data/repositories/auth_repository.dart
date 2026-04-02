import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_config.dart';

class AuthRepository {
  final ApiClient _api;
  final _authStateController = StreamController<bool>.broadcast();

  static const _tokenKey = 'jwt_token';

  AuthRepository(this._api);

  /// Stream لمراقبة تغيّر حالة المصادقة (مسجّل / غير مسجّل)
  Stream<bool> get authStateChanges => _authStateController.stream;

  Future<Map<String, dynamic>> signIn({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _api.post(ApiConfig.login, data: {
        'email': email,
        'password': password,
      });

      final token = response.data['token'];
      if (token != null) {
        await _saveToken(token);
        _authStateController.add(true); // بث: المستخدم سجّل دخوله
      }
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> signInWithGoogle() async {
    try {
      final googleSignIn = GoogleSignIn();
      final googleUser = await googleSignIn.signIn();

      if (googleUser == null) throw Exception('تم إلغاء عملية الدخول');

      final googleAuth = await googleUser.authentication;
      
      // هنا يتم إرسال googleAuth.idToken للـ Backend
      
      // محاكاة استجابة الـ Backend حالياً (Mocking)
      final mockResponse = {
        'token': 'mock_google_jwt_token_${DateTime.now().millisecondsSinceEpoch}',
        'user': {
          'id': googleUser.id,
          'email': googleUser.email,
          'full_name': googleUser.displayName,
          'avatar_url': googleUser.photoUrl,
          'role': 'student',
        }
      };

      final token = mockResponse['token'] as String;
      await _saveToken(token);
      _authStateController.add(true);

      return mockResponse;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signUp({
    required String email,
    required String password,
    String? fullName,
  }) async {
    try {
      await _api.post(ApiConfig.signup, data: {
        'email': email,
        'password': password,
        'full_name': fullName,
      });
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    _authStateController.add(false); // بث: المستخدم سجّل خروجه
  }

  Future<void> resetPassword(String email) async {
    // TODO: تنفيذ عند جاهزية الـ Backend endpoint
  }

  /// هل يوجد جلسة نشطة (token محفوظ)؟
  Future<bool> hasActiveSession() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(_tokenKey);
  }

  /// الحصول على الـ Token المحفوظ
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // ─── Private ──────────────────────────────────────────────

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }
}
