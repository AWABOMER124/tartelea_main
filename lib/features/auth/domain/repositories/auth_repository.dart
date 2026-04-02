// lib/features/auth/domain/repositories/auth_repository.dart
//
// واجهة المصادقة — العقد المجرد
// لا يعرف شيئاً عن API, Supabase, SharedPreferences

import '../entities/app_user.dart';

/// نتيجة عملية تسجيل الدخول
class AuthResult {
  final String token;
  final AppUser user;
  const AuthResult({required this.token, required this.user});
}

/// واجهة مستودع المصادقة
abstract class AuthRepository {
  /// تسجيل الدخول
  Future<AuthResult> signIn({required String email, required String password});

  /// إنشاء حساب جديد
  Future<void> signUp({required String email, required String password, String? fullName});

  /// تسجيل الدخول بواسطة قوقل
  Future<AuthResult> signInWithGoogle();

  /// تسجيل الخروج
  Future<void> signOut();

  /// إعادة تعيين كلمة المرور
  Future<void> resetPassword(String email);

  /// الحصول على المستخدم الحالي (من الـ Token المحفوظ)
  Future<AppUser?> getCurrentUser();

  /// هل يوجد جلسة نشطة؟
  Future<bool> hasActiveSession();

  /// Stream لمراقبة تغيرات حالة المصادقة
  Stream<AppUser?> watchAuthState();
}
