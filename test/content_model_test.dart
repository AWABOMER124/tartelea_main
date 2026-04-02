import 'package:flutter_test/flutter_test.dart';
import 'package:tartelea_flutter/data/models/content_model.dart';

void main() {
  group('ContentModel Tests', () {
    test('fromJson should return a valid ContentModel', () {
      final json = {
        'id': '123',
        'title': 'Test Content',
        'description': 'Description',
        'category': 'library',
        'type': 'video',
        'url': 'https://example.com',
        'is_sudan_awareness': true,
        'created_at': '2024-03-24T12:00:00Z',
      };

      final model = ContentModel.fromJson(json);

      expect(model.id, '123');
      expect(model.title, 'Test Content');
      expect(model.isSudanAwareness, true);
    });

    test('toJson should return a valid Map', () {
      final model = ContentModel(
        id: '123',
        title: 'Test Content',
        category: 'library',
        type: 'video',
      );

      final json = model.toJson();

      expect(json['id'], '123');
      expect(json['title'], 'Test Content');
      expect(json['is_sudan_awareness'], false);
    });
  });
}
