class ContentModel {
  final String id;
  final String title;
  final String? description;
  final String category; // takhliya, tahliya, tajalli, psychological, etc.
  final String type; // video, audio, article
  final String? url; // external link (fallback)
  final String? mediaUrl; // internal storage URL (supabase)
  final String? thumbnailUrl; // preview image
  final String? duration; // e.g. "12:45"
  final bool isSudanAwareness;
  final DateTime? createdAt;

  ContentModel({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    required this.type,
    this.url,
    this.mediaUrl,
    this.thumbnailUrl,
    this.duration,
    this.isSudanAwareness = false,
    this.createdAt,
  });

  factory ContentModel.fromJson(Map<String, dynamic> json) {
    return ContentModel(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      category: json['category'],
      type: json['type'],
      url: json['url'],
      mediaUrl: json['media_url'],
      thumbnailUrl: json['thumbnail_url'],
      duration: json['duration'],
      isSudanAwareness: json['is_sudan_awareness'] ?? false,
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'type': type,
      'url': url,
      'media_url': mediaUrl,
      'thumbnail_url': thumbnailUrl,
      'duration': duration,
      'is_sudan_awareness': isSudanAwareness,
      'created_at': createdAt?.toIso8601String(),
    };
  }
}
