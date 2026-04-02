import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'presentation/providers/theme_provider.dart';
import 'core/constants/supabase_config.dart';
import 'presentation/screens/content_detail_screen.dart';
import 'presentation/screens/post_detail_screen.dart';
import 'presentation/screens/workshop_recording_screen.dart';
import 'presentation/screens/workshop_detail_screen.dart';
import 'presentation/screens/home_screen.dart';
import 'presentation/screens/auth_screen.dart';
import 'presentation/screens/library_screen.dart';
import 'presentation/screens/audio_rooms_screen.dart';
import 'features/audio_rooms/presentation/screens/audio_room_detail_screen.dart';
import 'presentation/screens/notifications_screen.dart';
import 'presentation/screens/about_school_screen.dart';
import 'presentation/screens/meditation_assistant_screen.dart';
import 'presentation/screens/community_screen.dart';
import 'presentation/screens/workshops_screen.dart';
import 'presentation/screens/profile_screen.dart';
import 'presentation/screens/splash_screen.dart';
import 'presentation/screens/messages_screen.dart';
import 'presentation/screens/learning_portfolio_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await SupabaseConfig.initialize();
  
  runApp(
    const ProviderScope(
      child: TarteleaApp(),
    ),
  );
}

final _router = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
      routes: [
        GoRoute(
          path: 'content/:id',
          builder: (context, state) => ContentDetailScreen(id: state.pathParameters['id']!),
        ),
        GoRoute(
          path: 'post/:id',
          builder: (context, state) => PostDetailScreen(id: state.pathParameters['id']!),
        ),
        GoRoute(
          path: 'workshop/:id',
          builder: (context, state) => WorkshopDetailScreen(id: state.pathParameters['id']!),
        ),
        GoRoute(
          path: 'recording',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return WorkshopRecordingScreen(
              videoUrl: extra?['url'] ?? '',
              title: extra?['title'] ?? 'تسجيل ورشة العمل',
            );
          },
        ),
      ],
    ),
    GoRoute(
      path: '/library',
      builder: (context, state) => LibraryScreen(
        initialSidebarCategory: state.extra as String?,
      ),
    ),
    GoRoute(
      path: '/auth',
      builder: (context, state) => const AuthScreen(),
    ),
    GoRoute(
      path: '/audio-rooms',
      builder: (context, state) => const AudioRoomsScreen(),
    ),
    GoRoute(
      path: '/audio-room/:id',
      builder: (context, state) => AudioRoomDetailScreen(roomId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/about',
      builder: (context, state) => const AboutSchoolScreen(),
    ),
    GoRoute(
      path: '/assistant',
      builder: (context, state) => const MeditationAssistantScreen(),
    ),
    GoRoute(
      path: '/community',
      builder: (context, state) => const CommunityScreen(),
    ),
    GoRoute(
      path: '/workshops',
      builder: (context, state) => const WorkshopsScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/messages',
      builder: (context, state) => const MessagesScreen(),
    ),
    GoRoute(
      path: '/portfolio',
      builder: (context, state) => const LearningPortfolioScreen(),
    ),
    GoRoute(
      path: '/courses',
      builder: (context, state) => const LibraryScreen(initialSidebarCategory: 'courses'),
    ),
    GoRoute(
      path: '/islamic-awareness',
      builder: (context, state) => const LibraryScreen(initialSidebarCategory: 'islamic'),
    ),
    GoRoute(
      path: '/sudan-awareness',
      builder: (context, state) => const LibraryScreen(initialSidebarCategory: 'sudan'),
    ),
  ],
);

class TarteleaApp extends ConsumerWidget {
  const TarteleaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    
    return MaterialApp.router(
      title: 'Tartelea',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: _router,
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child!,
        );
      },
    );
  }
}
