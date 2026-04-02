class WorkshopModel {
  final String id;
  final String title;
  final String? description;
  final String? trainerId;
  final DateTime? scheduledAt;
  final String status;
  final String? meetingUrl;

  WorkshopModel({
    required this.id,
    required this.title,
    this.description,
    this.trainerId,
    this.scheduledAt,
    required this.status,
    this.meetingUrl,
  });

  factory WorkshopModel.fromJson(Map<String, dynamic> json) {
    return WorkshopModel(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      trainerId: json['trainer_id'],
      scheduledAt: json['scheduled_at'] != null 
          ? DateTime.parse(json['scheduled_at']) 
          : null,
      status: json['status'] ?? 'planned',
      meetingUrl: json['meeting_url'],
    );
  }
}
