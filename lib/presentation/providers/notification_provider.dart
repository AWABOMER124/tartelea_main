import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/models/notification_model.dart';

class NotificationNotifier extends Notifier<List<NotificationModel>> {
  @override
  List<NotificationModel> build() {
    _initRealtime();
    return [];
  }

  final _supabase = Supabase.instance.client;
  
  void _initRealtime() {
    _supabase.channel('public:notifications')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'notifications',
        callback: (payload) {
          final newNotification = NotificationModel.fromMap(payload.newRecord);
          state = [newNotification, ...state];
        },
      )
      .subscribe();
      
    _supabase.channel('public:posts')
      .onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'posts',
        callback: (payload) {
          final postTitle = payload.newRecord['title'] ?? 'منشور جديد';
          _addLocalNotification('منشور جديد في المجتمع', postTitle, 'community', payload.newRecord['id']?.toString() ?? '');
        },
      )
      .subscribe();
  }

  void _addLocalNotification(String title, String body, String type, String relatedId) {
    final notification = NotificationModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: title,
      body: body,
      createdAt: DateTime.now(),
      type: _parseType(type),
      relatedId: relatedId,
    );
    state = [notification, ...state];
  }

  NotificationType _parseType(String type) {
    switch (type) {
      case 'community': return NotificationType.system;
      case 'room': return NotificationType.room;
      default: return NotificationType.system;
    }
  }

  void markAsRead(String id) {
    state = [
      for (final n in state)
        if (n.id == id)
          NotificationModel(
            id: n.id,
            title: n.title,
            body: n.body,
            createdAt: n.createdAt,
            type: n.type,
            isRead: true,
            relatedId: n.relatedId,
          )
        else
          n,
    ];
  }
}

final notificationProvider = NotifierProvider<NotificationNotifier, List<NotificationModel>>(NotificationNotifier.new);

final unreadNotificationsCountProvider = Provider<int>((ref) {
  return ref.watch(notificationProvider).where((n) => !n.isRead).length;
});
