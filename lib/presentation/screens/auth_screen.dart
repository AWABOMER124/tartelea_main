import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../../core/theme/app_colors.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:ui';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _isLogin = true;
  bool _needsVerification = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _validateInputs() {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final name = _nameController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      return 'يرجى تعبئة البريد الإلكتروني وكلمة المرور.';
    }

    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailRegex.hasMatch(email)) {
      return 'صيغة البريد الإلكتروني غير صحيحة.';
    }

    if (password.length < 6) {
      return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
    }

    if (!_isLogin && name.isEmpty) {
      return 'يرجى إدخال الاسم الكامل.';
    }

    return null;
  }
  
  Future<void> _submit() async {
    final validationMessage = _validateInputs();
    if (validationMessage != null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(validationMessage)),
        );
      }
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      if (_isLogin) {
        await ref.read(authRepositoryProvider).signIn(
          email: _emailController.text.trim(),
          password: _passwordController.text.trim(),
        );
        // Navigate or let auth state handle it
        if (mounted) context.go('/');
      } else {
        await ref.read(authRepositoryProvider).signUp(
          email: _emailController.text.trim(),
          password: _passwordController.text.trim(),
          fullName: _nameController.text.trim(),
        );
        // After signup, you might want to show a success message or switch to login
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('تم التسجيل بنجاح. يمكنك الآن تسجيل الدخول.')),
          );
          setState(() => _isLogin = true);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تعذر إتمام العملية حالياً. يرجى المحاولة مرة أخرى.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _googleSignIn() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(authRepositoryProvider).signInWithGoogle();
      if (mounted) context.go('/');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تعذر تسجيل الدخول عبر Google حالياً.')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark 
              ? [AppColors.darkBackground, AppColors.darkSurface]
              : [Colors.white, AppColors.secondary.withAlpha(51)],
          ),
        ),
        child: Stack(
          children: [
            // Decorative background elements
            if (isDark)
              Positioned(
                top: -100,
                right: -100,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.secondary.withAlpha(25),
                  ),
                ),
              ),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(32.0),
                  child: _needsVerification ? _buildVerificationState(isDark) : _buildAuthForm(isDark),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationState(bool isDark) {
    return Column(
      children: [
        const Icon(Icons.mark_email_read_outlined, size: 80, color: AppColors.secondary),
        const SizedBox(height: 24),
        Text(
          'تأكيد الحساب',
          style: GoogleFonts.cairo(
            fontSize: 24, 
            fontWeight: FontWeight.bold, 
            color: isDark ? Colors.white : AppColors.primary,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'تم إرسال رابط تأكيد إلى بريدك الإلكتروني. يرجى تفعيل الحساب لتتمكن من الدخول.',
          textAlign: TextAlign.center,
          style: TextStyle(color: isDark ? Colors.white70 : AppColors.mutedForeground, fontSize: 16),
        ),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: () => setState(() => _needsVerification = false),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.secondary,
            foregroundColor: AppColors.primary,
            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 12),
          ),
          child: const Text('العودة لتسجيل الدخول'),
        ),
      ],
    );
  }

  Widget _buildAuthForm(bool isDark) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(32),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: isDark ? Colors.black.withAlpha(76) : Colors.white.withAlpha(230),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: isDark ? Colors.white.withAlpha(51) : AppColors.secondary.withAlpha(127)),
            boxShadow: isDark ? [] : [
              BoxShadow(color: Colors.black.withAlpha(25), blurRadius: 20, spreadRadius: 0),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Logo
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  image: const DecorationImage(
                    image: AssetImage('assets/images/logo.jpg'),
                    fit: BoxFit.cover,
                  ),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withAlpha(76), blurRadius: 10, spreadRadius: 2),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Text(
                _isLogin ? 'مرحباً بك مجدداً' : 'إنشاء حساب جديد',
                style: GoogleFonts.cairo(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : AppColors.primary,
                ),
              ),
              const SizedBox(height: 32),
              if (!_isLogin) ...[
                _buildTextField(
                  controller: _nameController,
                  label: 'الاسم الكامل',
                  icon: Icons.person_outline,
                  isDark: isDark,
                ),
                const SizedBox(height: 16),
              ],
              _buildTextField(
                controller: _emailController,
                label: 'البريد الإلكتروني',
                icon: Icons.email_outlined,
                isDark: isDark,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _passwordController,
                label: 'كلمة المرور',
                icon: Icons.lock_outline,
                isPassword: true,
                isDark: isDark,
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                    foregroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 5,
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: AppColors.primary)
                      : Text(
                          _isLogin ? 'دخول' : 'تسجيل',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Divider
              Row(
                children: [
                  Expanded(child: Divider(color: isDark ? Colors.white24 : AppColors.secondary.withAlpha(100))),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text('أو بواسطة', style: GoogleFonts.tajawal(color: isDark ? Colors.white38 : AppColors.mutedForeground, fontSize: 12)),
                  ),
                  Expanded(child: Divider(color: isDark ? Colors.white24 : AppColors.secondary.withAlpha(100))),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Google Button
              SizedBox(
                width: double.infinity,
                height: 55,
                child: OutlinedButton.icon(
                  onPressed: _isLoading ? null : _googleSignIn,
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: Image.network(
                      'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png', 
                      width: 18, 
                      errorBuilder: (c, e, s) => const Icon(Icons.g_mobiledata, color: Colors.blue, size: 18)
                    ),
                  ),
                  label: Text(
                    'الدخول عبر حساب قوقل', 
                    style: GoogleFonts.tajawal(fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppColors.primary, fontSize: 14)
                  ),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    side: BorderSide(color: isDark ? Colors.white24 : AppColors.secondary.withAlpha(150)),
                    backgroundColor: isDark ? Colors.white.withAlpha(10) : Colors.transparent,
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              TextButton(
                onPressed: () => setState(() => _isLogin = !_isLogin),
                child: Text(
                  _isLogin ? 'ليس لديك حساب؟ سجل الآن' : 'لديك حساب بالفعل؟ سجل دخولك',
                  style: const TextStyle(color: AppColors.secondary),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required bool isDark,
    bool isPassword = false,
  }) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      style: TextStyle(color: isDark ? Colors.white : AppColors.primary),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: isDark ? Colors.white.withAlpha(153) : AppColors.mutedForeground),
        prefixIcon: Icon(icon, color: AppColors.secondary),
        filled: true,
        fillColor: isDark ? Colors.white.withAlpha(13) : AppColors.secondary.withAlpha(51),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.secondary, width: 1.5),
        ),
      ),
    );
  }
}
