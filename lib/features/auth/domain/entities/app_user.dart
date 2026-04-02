// lib/features/auth/domain/entities/app_user.dart
//
// كيان المستخدم — Pure Dart بدون أي اعتماد على API أو Flutter
// ─────────────────────────────────────────────────────────────

enum UserRole { student, trainer, admin }

class AppUser {
  final String id;
  final String? fullName;
  final String? avatarUrl;
  final String? bio;
  final String? country;
  final UserRole role;
  final List<String> interests;
  final bool isPublicProfile;
  final bool isSudanAwarenessMember;
  final String? email;

  // Social links
  final String? facebookUrl;
  final String? tiktokUrl;
  final String? instagramUrl;
  final List<String> specialties;
  final List<String> services;

  const AppUser({
    required this.id,
    this.fullName,
    this.avatarUrl,
    this.bio,
    this.country,
    this.role = UserRole.student,
    this.interests = const [],
    this.isPublicProfile = true,
    this.isSudanAwarenessMember = false,
    this.email,
    this.facebookUrl,
    this.tiktokUrl,
    this.instagramUrl,
    this.specialties = const [],
    this.services = const [],
  });

  bool get isTrainer => role == UserRole.trainer || role == UserRole.admin;
  bool get isAdmin => role == UserRole.admin;
  String get displayName => fullName ?? 'مستخدم';

  AppUser copyWith({
    String? fullName,
    String? avatarUrl,
    String? bio,
    String? country,
    UserRole? role,
    List<String>? interests,
    bool? isPublicProfile,
  }) {
    return AppUser(
      id: id,
      fullName: fullName ?? this.fullName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      country: country ?? this.country,
      role: role ?? this.role,
      interests: interests ?? this.interests,
      isPublicProfile: isPublicProfile ?? this.isPublicProfile,
      isSudanAwarenessMember: isSudanAwarenessMember,
      email: email,
      facebookUrl: facebookUrl,
      tiktokUrl: tiktokUrl,
      instagramUrl: instagramUrl,
      specialties: specialties,
      services: services,
    );
  }
}
