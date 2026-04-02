enum NotificationType { room, like, comment, system }

class NotificationModel {
  final String id;
  final String title;
  final String body;
  final DateTime createdAt;
  final NotificationType type;
  final bool isRead;
  final String? relatedId; // ID of the post, room, or user

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.type,
    this.isRead = false,
    this.relatedId,
  });

  factory NotificationModel.fromMap(Map<String, dynamic> map) {
    return NotificationModel(
      id: map['id']?.toString() ?? '',
      title: map['title'] ?? '',
      body: map['body'] ?? '',
      createdAt: DateTime.parse(map['created_at']),
      type: _parseType(map['type']),
      isRead: map['is_read'] ?? false,
      relatedId: map['related_id'],
    );
  }

  static NotificationType _parseType(String? type) {
    switch (type) {
      case 'room': return NotificationType.room;
      case 'like': return NotificationType.like;
      case 'comment': return NotificationType.comment;
      default: return NotificationType.system;
    }
  }
}
