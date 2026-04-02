import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData get lightTheme {
    return _buildTheme(Brightness.light);
  }

  static ThemeData get darkTheme {
    return _buildTheme(Brightness.dark);
  }

  static ThemeData _buildTheme(Brightness brightness) {
    final bool isDark = brightness == Brightness.dark;
    
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: brightness,
        primary: isDark ? AppColors.secondary : AppColors.primary,
        secondary: isDark ? AppColors.accent : AppColors.secondary,
        surface: isDark ? AppColors.darkSurface : AppColors.background,
        error: AppColors.destructive,
        onPrimary: isDark ? AppColors.primary : Colors.white,
        onSurface: isDark ? Colors.white : AppColors.foreground,
      ),
      scaffoldBackgroundColor: isDark ? AppColors.darkBackground : AppColors.background,
      
      textTheme: GoogleFonts.cairoTextTheme().copyWith(
        displayLarge: GoogleFonts.amiri(
          fontSize: 42,
          fontWeight: FontWeight.bold,
          height: 1.2,
          letterSpacing: -0.5,
          color: isDark ? Colors.white : AppColors.foreground,
        ),
        displayMedium: GoogleFonts.amiri(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: isDark ? Colors.white : AppColors.foreground,
        ),
        titleLarge: GoogleFonts.cairo(
          fontSize: 22,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.7,
          color: isDark ? Colors.white : AppColors.foreground,
        ),
        titleMedium: GoogleFonts.cairo(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: isDark ? Colors.white : AppColors.foreground,
        ),
        bodyLarge: GoogleFonts.cairo(
          fontSize: 16,
          height: 1.6,
          color: isDark ? Colors.white.withValues(alpha: 0.9) : AppColors.foreground,
        ),
        bodyMedium: GoogleFonts.cairo(
          fontSize: 14,
          height: 1.5,
          color: isDark ? Colors.white.withValues(alpha: 0.7) : AppColors.mutedForeground,
        ),
      ),
      
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.amiri(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: isDark ? Colors.white : AppColors.primary,
        ),
        iconTheme: IconThemeData(color: isDark ? Colors.white : AppColors.primary),
      ),
      
      cardTheme: CardThemeData(
        color: isDark ? AppColors.darkCard : Colors.white,
        elevation: isDark ? 0 : 4,
        shadowColor: Colors.black.withValues(alpha: 0.05),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(28),
          side: BorderSide(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : AppColors.secondary.withValues(alpha: 0.3),
            width: 1,
          ),
        ),
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? AppColors.darkSurface : Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.secondary),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.secondary),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: AppColors.accent, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      ),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: Colors.white,
          elevation: 0,
          textStyle: GoogleFonts.cairo(fontWeight: FontWeight.w800, fontSize: 16),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
      ),
    );
  }
}
