import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../widgets/common_app_bar.dart';
import '../providers/profile_provider.dart';
import '../providers/theme_provider.dart';

class AboutSchoolScreen extends ConsumerWidget {
  const AboutSchoolScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userProfile = ref.watch(userProfileProvider).value;
    final isAdmin = userProfile?.role == 'admin';

    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CommonAppBar(titleText: 'عن المدرسة'),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark 
              ? [AppColors.darkBackground, AppColors.darkSurface]
              : [Colors.white, AppColors.secondary.withAlpha(51)],
          ),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 100, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildFounderSection(context, isAdmin, isDark),
              const SizedBox(height: 32),
              _buildSchoolContactSection(isDark),
              const SizedBox(height: 32),
              _buildMissionSection(context, isAdmin, isDark),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFounderSection(BuildContext context, bool isAdmin, bool isDark) {
    return Card(
      color: isDark ? AppColors.darkCard : Colors.white,
      elevation: isDark ? 0 : 2,
      shadowColor: Colors.black.withAlpha(25),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: isDark ? Colors.white.withAlpha(51) : AppColors.secondary.withAlpha(127)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                const CircleAvatar(
                  radius: 40,
                  backgroundColor: AppColors.secondary,
                  child: Icon(Icons.person, size: 40, color: AppColors.primary),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'مؤسس المدرسة',
                        style: TextStyle(color: AppColors.secondary, fontSize: 14),
                      ),
                      Text(
                        'أحمد الليث',
                        style: TextStyle(color: isDark ? Colors.white : AppColors.primary, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      if (isAdmin)
                        TextButton.icon(
                          onPressed: () => _showEditFounderDialog(context),
                          icon: const Icon(Icons.edit, size: 14, color: AppColors.secondary),
                          label: const Text('تعديل', style: TextStyle(color: AppColors.secondary, fontSize: 12)),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              'مؤسسة تربوية سلوكية تقدم أدوات تدبر وترتيل وتعلم أساسيات اللسان العربي والسلوك الترتيلي.',
              style: TextStyle(color: isDark ? Colors.white70 : AppColors.mutedForeground, height: 1.6),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSchoolContactSection(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          'تواصل مع المدرسة',
          style: TextStyle(color: isDark ? Colors.white : AppColors.primary, fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _SocialIcon(icon: Icons.facebook, color: Colors.blue, label: 'فيسبوك', isDark: isDark),
            _SocialIcon(icon: Icons.music_note, color: Colors.black, label: 'تيكتوك', isDark: isDark),
            _SocialIcon(icon: Icons.camera_alt, color: Colors.purple, label: 'انستقرام', isDark: isDark),
          ],
        ),
      ],
    );
  }

  Widget _buildMissionSection(BuildContext context, bool isAdmin, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white.withAlpha(51) : AppColors.secondary.withAlpha(127)),
        boxShadow: isDark ? [] : [
          BoxShadow(color: Colors.black.withAlpha(15), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.auto_awesome_outlined, color: AppColors.secondary, size: 32),
              if (isAdmin)
                IconButton(
                  icon: const Icon(Icons.edit, size: 16, color: AppColors.secondary),
                  onPressed: () {},
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'رؤيتنا',
            style: TextStyle(color: isDark ? Colors.white : AppColors.primary, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'الارتقاء بالوعي الجمعي',
            textAlign: TextAlign.center,
            style: TextStyle(color: isDark ? AppColors.accent : AppColors.primary, fontSize: 20, fontStyle: FontStyle.italic, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'من خلال التفكر والتدبر والترتيل بمعناه الشامل.',
            textAlign: TextAlign.center,
            style: TextStyle(color: isDark ? Colors.white70 : AppColors.mutedForeground, height: 1.5),
          ),
        ],
      ),
    );
  }

  void _showEditFounderDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تعديل بيانات المؤسس'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(decoration: const InputDecoration(labelText: 'الاسم')),
            const SizedBox(height: 8),
            TextField(decoration: const InputDecoration(labelText: 'الوصف'), maxLines: 3),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('حفظ')),
        ],
      ),
    );
  }
}

class _SocialIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final bool isDark;
  const _SocialIcon({required this.icon, required this.color, required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withAlpha(25) : AppColors.secondary.withAlpha(127),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: isDark ? Colors.white : AppColors.primary, size: 28),
          ),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(color: isDark ? Colors.white60 : AppColors.mutedForeground, fontSize: 10)),
        ],
      ),
    );
  }
}
