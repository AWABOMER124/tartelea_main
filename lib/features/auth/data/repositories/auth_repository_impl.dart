// lib/features/auth/data/repositories/auth_repository_impl.dart
//
// تنفيذ المصادقة الحقيقي — يتصل بـ API ويخزن الـ Token
// ──────────────────────────────────────────────────────────

import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_config.dart';
import '../../domain/entities/app_user.dart';
import '../../domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final ApiClient _api;
  final _authStateController = StreamController<AppUser?>.broadcast();

  static const _tokenKey = 'jwt_token';

  AuthRepositoryImpl(this._api);

  @override
  Future<AuthResult> signIn({required String email, required String password}) async {
    final response = await _api.post(ApiConfig.login, data: {
      'email': email,
      'password': password,
    });

    final token = response.data['token'] as String;
    await _saveToken(token);

    final user = _mapResponseToUser(response.data);
    _authStateController.add(user);

    return AuthResult(token: token, user: user);
  }

  @override
  Future<void> resetPassword(String email) async {
    // TODO: Implement when backend endpoint is ready
  }

  @override
  Future<void> signUp({required String email, required String password, String? fullName}) async {
    await _api.post(ApiConfig.signup, data: {
      'email': email,
      'password': password,
      'full_name': fullName,
    });
  }

  @override
  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    _authStateController.add(null);
  }

  @override
  Future<AuthResult> signInWithGoogle() async {
    try {
      final googleSignIn = GoogleSignIn();
      final googleUser = await googleSignIn.signIn();

      if (googleUser == null) throw Exception('تم إلغاء عملية الدخول');

      final googleAuth = await googleUser.authentication;
      final token = 'mock_google_jwt_${googleAuth.idToken?.substring(0, 10)}';
      
      await _saveToken(token);

      final user = AppUser(
        id: googleUser.id,
        email: googleUser.email,
        fullName: googleUser.displayName,
        avatarUrl: googleUser.photoUrl,
        role: UserRole.student,
        isPublicProfile: true,
      );

      _authStateController.add(user);

      return AuthResult(token: token, user: user);
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<AppUser?> getCurrentUser() async {
    final hasSession = await hasActiveSession();
    if (!hasSession) return null;

    try {
      final response = await _api.get('/auth/me');
      return _mapResponseToUser(response.data);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<bool> hasActiveSession() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(_tokenKey);
  }

  @override
  Stream<AppUser?> watchAuthState() => _authStateController.stream;

  // ─── Private Helpers ──────────────────────────────────────

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  AppUser _mapResponseToUser(Map<String, dynamic> json) {
    // يدعم كلا الشكلين: response مباشر أو nested في 'user'
    final userData = json['user'] ?? json;
    return AppUser(
      id: userData['id'] ?? '',
      fullName: userData['full_name'],
      avatarUrl: userData['avatar_url'],
      bio: userData['bio'],
      country: userData['country'],
      email: userData['email'],
      role: _parseRole(userData['role']),
      interests: _parseStringList(userData['interests']),
      isPublicProfile: userData['is_public_profile'] ?? true,
      isSudanAwarenessMember: userData['is_sudan_awareness_member'] ?? false,
      facebookUrl: userData['facebook_url'],
      tiktokUrl: userData['tiktok_url'],
      instagramUrl: userData['instagram_url'],
      specialties: _parseStringList(userData['specialties']),
      services: _parseStringList(userData['services']),
    );
  }

  static UserRole _parseRole(String? role) {
    return switch (role) {
      'admin' => UserRole.admin,
      'trainer' => UserRole.trainer,
      _ => UserRole.student,
    };
  }

  static List<String> _parseStringList(dynamic value) {
    if (value is List) return value.map((e) => e.toString()).toList();
    return [];
  }
}
