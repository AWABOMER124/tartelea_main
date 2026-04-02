class ProgressModel {
  final String userId;
  final double takhliyaProgress; // 0.0 to 1.0
  final double tahliyaProgress; // 0.0 to 1.0
  final double tajalliProgress; // 0.0 to 1.0
  final String currentRank; // 'مُريد', 'سالِك', 'واصِل'
  final int completedWorkshopsCount;
  final int spiritualDaysStreak;

  ProgressModel({
    required this.userId,
    this.takhliyaProgress = 0.0,
    this.tahliyaProgress = 0.0,
    this.tajalliProgress = 0.0,
    this.currentRank = 'مُريد',
    this.completedWorkshopsCount = 0,
    this.spiritualDaysStreak = 0,
  });

  factory ProgressModel.fromJson(Map<String, dynamic> json) {
    return ProgressModel(
      userId: json['user_id'],
      takhliyaProgress: (json['takhliya_progress'] ?? 0.0).toDouble(),
      tahliyaProgress: (json['tahliya_progress'] ?? 0.0).toDouble(),
      tajalliProgress: (json['tajalli_progress'] ?? 0.0).toDouble(),
      currentRank: json['current_rank'] ?? 'مُريد',
      completedWorkshopsCount: json['completed_workshops_count'] ?? 0,
      spiritualDaysStreak: json['spiritual_days_streak'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'takhliya_progress': takhliyaProgress,
      'tahliya_progress': tahliyaProgress,
      'tajalli_progress': tajalliProgress,
      'current_rank': currentRank,
      'completed_workshops_count': completedWorkshopsCount,
      'spiritual_days_streak': spiritualDaysStreak,
    };
  }
}
