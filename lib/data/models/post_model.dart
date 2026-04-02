class PostModel {
  final String id;
  final String authorId;
  final String title;
  final String? body;
  final String category;
  final DateTime createdAt;

  PostModel({
    required this.id,
    required this.authorId,
    required this.title,
    this.body,
    required this.category,
    required this.createdAt,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    return PostModel(
      id: json['id'],
      authorId: json['author_id'],
      title: json['title'],
      body: json['body'],
      category: json['category'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'author_id': authorId,
      'title': title,
      'body': body,
      'category': category,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
