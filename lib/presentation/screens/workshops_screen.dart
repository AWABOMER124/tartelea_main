import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/workshop_provider.dart';
import '../../core/theme/app_colors.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/common_app_bar.dart';

class WorkshopsScreen extends ConsumerWidget {
  const WorkshopsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workshopsAsync = ref.watch(workshopsProvider);
    final isAuthorized = ref.watch(isAuthorizedProvider);
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: CommonAppBar(
        titleText: 'ورش العمل التفاعلية',
        actions: [
          if (isAuthorized)
            IconButton(
              icon: Icon(Icons.add_circle_outline, color: isDark ? Colors.white : AppColors.primary),
              onPressed: () {},
            ),
        ],
      ),
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
        child: workshopsAsync.when(
          data: (workshops) => ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 100, 16, 16),
            itemCount: workshops.length,
            itemBuilder: (context, index) {
              final workshop = workshops[index];
              return _WorkshopCard(workshop: workshop, isDark: isDark);
            },
          ),
          loading: () => Center(child: CircularProgressIndicator(color: isDark ? Colors.white : AppColors.primary)),
          error: (err, stack) => Center(child: Text('خطأ: $err', style: TextStyle(color: isDark ? Colors.white : AppColors.foreground))),
        ),
      ),
    );
  }
}

class _WorkshopCard extends StatelessWidget {
  final dynamic workshop;
  final bool isDark;
  const _WorkshopCard({required this.workshop, required this.isDark});

  @override
  Widget build(BuildContext context) {
    bool isLive = workshop.status == 'live';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: isDark ? 0 : 2,
      shadowColor: Colors.black.withAlpha(25),
      color: isDark ? AppColors.darkCard : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isLive ? Colors.red.withAlpha(127) : (isDark ? Colors.white.withAlpha(51) : AppColors.secondary.withAlpha(127)),
          width: isLive ? 1.5 : 1,
        ),
      ),
      child: InkWell(
        onTap: () => context.go('/workshop/${workshop.id}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                   _StatusBadge(status: workshop.status),
                  if (workshop.scheduledAt != null)
                    Text(
                      DateFormat('MMM dd, HH:mm').format(workshop.scheduledAt!),
                      style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : AppColors.mutedForeground),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                workshop.title,
                style: TextStyle(
                  fontSize: 18, 
                  fontWeight: FontWeight.bold, 
                  color: isDark ? Colors.white : AppColors.foreground,
                ),
              ),
              if (workshop.description != null)
                const SizedBox(height: 8),
              if (workshop.description != null)
                Text(
                  workshop.description!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: isDark ? Colors.white70 : AppColors.mutedForeground, fontSize: 13),
                ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Icon(Icons.person_outline, size: 16, color: isDark ? AppColors.secondary : AppColors.primary),
                  const SizedBox(width: 4),
                  Text(
                    'المدرب الترتيلي', 
                    style: TextStyle(
                      fontSize: 12, 
                      fontWeight: FontWeight.w500, 
                      color: isDark ? Colors.white : AppColors.foreground,
                    ),
                  ),
                  const Spacer(),
                  if (isLive)
                    const Text(
                      'انضم الآن',
                      style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13),
                    )
                  else
                    Icon(Icons.chevron_left, color: isDark ? Colors.white54 : AppColors.muted),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    switch (status) {
      case 'live':
        color = Colors.red;
        label = 'مباشر الآن';
        break;
      case 'completed':
        color = Colors.green;
        label = 'مكتمل';
        break;
      default:
        color = AppColors.secondary;
        label = 'قادم';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(25),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
