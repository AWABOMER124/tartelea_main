import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.6, curve: Curves.easeIn)),
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack)),
    );

    _controller.forward();

    // Navigate to home after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        context.go('/');
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : Colors.white,
      body: Stack(
        children: [
          // Background decorative elements
          Positioned(
            top: -100,
            right: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.accent.withValues(alpha: 0.05),
              ),
            ),
          ),
          Positioned(
            bottom: -50,
            left: -50,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.primary.withValues(alpha: 0.03),
              ),
            ),
          ),
          
          Center(
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Hero(
                      tag: 'app_logo',
                      child: Container(
                        width: 180,
                        height: 180,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.2),
                              blurRadius: 40,
                              offset: const Offset(0, 15),
                            ),
                          ],
                          image: const DecorationImage(
                            image: AssetImage('assets/images/logo.jpg'),
                            fit: BoxFit.cover,
                          ),
                          border: Border.all(
                            color: AppColors.accent.withValues(alpha: 0.5),
                            width: 3,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    Text(
                      'المدرسة الترتيلية',
                      style: GoogleFonts.amiri(
                        fontSize: 42,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppColors.accent : AppColors.primary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: 60,
                      height: 3,
                      decoration: BoxDecoration(
                        color: AppColors.accent,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'رحلة في رحاب اللسان والوعي',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontStyle: FontStyle.italic,
                        color: isDark ? Colors.white70 : AppColors.mutedForeground,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Bottom loading indicator or version
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 50.0),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 40,
                      height: 40,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(AppColors.accent),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'الإصدار 1.0.0',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white24 : Colors.grey.shade400,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
