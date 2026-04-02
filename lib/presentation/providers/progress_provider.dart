import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tartelea_flutter/data/models/progress_model.dart';
import 'package:tartelea_flutter/presentation/providers/auth_provider.dart';

final userProgressProvider = Provider<ProgressModel?>((ref) {
  final user = ref.watch(userProvider);
  if (user == null) return null;
  
  // Mock data for the spiritual traveler
  return ProgressModel(
    userId: user.id,
    takhliyaProgress: 0.65,
    tahliyaProgress: 0.30,
    tajalliProgress: 0.05,
    currentRank: 'سالِك',
    completedWorkshopsCount: 12,
    spiritualDaysStreak: 7,
  );
});
