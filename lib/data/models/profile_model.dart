class ProfileModel {
  final String id;
  final String? fullName;
  final String? avatarUrl;
  final String? bio;
  final String? country;
  final List<String>? interests;
  final bool isPublicProfile;
  final bool isSudanAwarenessMember;
  final String role; // 'student', 'trainer', 'admin'
  final String? facebookUrl;
  final String? tiktokUrl;
  final String? instagramUrl;
  final List<String>? specialties;
  final List<String>? services;

  ProfileModel({
    required this.id,
    this.fullName,
    this.avatarUrl,
    this.bio,
    this.country,
    this.interests,
    this.isPublicProfile = true,
    this.isSudanAwarenessMember = false,
    this.role = 'student',
    this.facebookUrl,
    this.tiktokUrl,
    this.instagramUrl,
    this.specialties,
    this.services,
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    return ProfileModel(
      id: json['id'],
      fullName: json['full_name'],
      avatarUrl: json['avatar_url'],
      bio: json['bio'],
      country: json['country'],
      interests: (json['interests'] as List?)?.map((e) => e.toString()).toList(),
      isPublicProfile: json['is_public_profile'] ?? true,
      isSudanAwarenessMember: json['is_sudan_awareness_member'] ?? false,
      role: json['role'] ?? 'student',
      facebookUrl: json['facebook_url'],
      tiktokUrl: json['tiktok_url'],
      instagramUrl: json['instagram_url'],
      specialties: (json['specialties'] as List?)?.map((e) => e.toString()).toList(),
      services: (json['services'] as List?)?.map((e) => e.toString()).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'avatar_url': avatarUrl,
      'bio': bio,
      'country': country,
      'interests': interests,
      'is_public_profile': isPublicProfile,
      'is_sudan_awareness_member': isSudanAwarenessMember,
      'role': role,
      'facebook_url': facebookUrl,
      'tiktok_url': tiktokUrl,
      'instagram_url': instagramUrl,
      'specialties': specialties,
      'services': services,
    };
  }
}
