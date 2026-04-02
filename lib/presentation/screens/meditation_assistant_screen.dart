import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../widgets/common_app_bar.dart';
import '../providers/theme_provider.dart';
import 'package:google_fonts/google_fonts.dart';

class MeditationAssistantScreen extends ConsumerStatefulWidget {
  const MeditationAssistantScreen({super.key});

  @override
  ConsumerState<MeditationAssistantScreen> createState() => _MeditationAssistantScreenState();
}

class _MeditationAssistantScreenState extends ConsumerState<MeditationAssistantScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isThinking = false;

  final List<Map<String, dynamic>> _messages = [
    {
      'role': 'assistant',
      'content': 'مرحباً بك في رحاب الوعي الترتيلي. أنا قبس الوعي الرقمي، هنا لأجيبك عن تفاصيل الألسنة العربية وجوهر جذور الكلمات. أيّ آية أو كلمة ترغب في تدبرها معي اليوم؟',
      'time': 'الآن'
    }
  ];

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;
    
    final userText = _messageController.text;
    _messageController.clear();

    setState(() {
      _messages.add({'role': 'user', 'content': userText, 'time': 'الآن'});
      _isThinking = true;
    });

    _animateToBottom();

    // Simulate Deep Analysis Bot Response
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() {
          _isThinking = false;
          _messages.add({
            'role': 'assistant',
            'content': 'بناءً على مدرسة الترتيل، نجد أن جذر هذه الكلمة يعود إلى الاتصال الروحي العميق. التدبر هنا يعني تتبع العواقب النفسية والروحية لهذا المعنى في حياتك السلوكية...',
            'time': 'الآن'
          });
        });
        _animateToBottom();
      }
    });
  }

  void _animateToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeOutCirc,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const CommonAppBar(titleText: 'ومضات الوعي'),
      body: Stack(
        children: [
          // ─── Premium Background ──────────────────────────
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? [AppColors.darkBackground, AppColors.darkSurface, AppColors.darkBackground]
                    : [Colors.white, AppColors.secondary.withAlpha(40), Colors.white],
                stops: const [0.0, 0.4, 1.0],
              ),
            ),
          ),
          
          Column(
            children: [
              Expanded(
                child: ListView.builder(
                  controller: _scrollController,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 140, 20, 20),
                  itemCount: _messages.length + (_isThinking ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == _messages.length && _isThinking) {
                      return _buildThinkingState(isDark);
                    }
                    final msg = _messages[index];
                    return _buildSpiritualBubble(msg, isDark);
                  },
                ),
              ),
              _buildModernInput(isDark),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildThinkingState(bool isDark) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withAlpha(8) : AppColors.secondary.withAlpha(20),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _PulsingAwarenessDots(isDark: isDark),
            const SizedBox(width: 12),
            Text(
              'جاري استقاء الوعي...',
              style: GoogleFonts.tajawal(
                fontSize: 12, 
                color: isDark ? Colors.white38 : AppColors.mutedForeground,
                fontWeight: FontWeight.bold
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpiritualBubble(Map<String, dynamic> msg, bool isDark) {
    final isUser = msg['role'] == 'user';
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.85),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(24),
            topRight: const Radius.circular(24),
            bottomLeft: Radius.circular(isUser ? 24 : 8),
            bottomRight: Radius.circular(isUser ? 8 : 24),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(isDark ? 50 : 15),
              blurRadius: 15,
              offset: const Offset(0, 8),
            )
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(24),
            topRight: const Radius.circular(24),
            bottomLeft: Radius.circular(isUser ? 24 : 8),
            bottomRight: Radius.circular(isUser ? 8 : 24),
          ),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isUser 
                    ? AppColors.accent.withAlpha(isDark ? 200 : 255) 
                    : (isDark ? Colors.white.withAlpha(15) : Colors.white.withAlpha(180)),
                border: Border.all(
                  color: isUser ? AppColors.accent : (isDark ? Colors.white.withAlpha(25) : AppColors.secondary.withAlpha(100)),
                ),
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(24),
                  topRight: const Radius.circular(24),
                  bottomLeft: Radius.circular(isUser ? 24 : 8),
                  bottomRight: Radius.circular(isUser ? 8 : 24),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    msg['content'],
                    style: isUser 
                      ? GoogleFonts.tajawal(color: Colors.white, height: 1.6, fontSize: 15, fontWeight: FontWeight.w600)
                      : GoogleFonts.amiri(
                          color: isDark ? Colors.white.withAlpha(220) : AppColors.primary, 
                          height: 1.4, 
                          fontSize: 18,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.access_time_rounded, size: 10, color: isUser ? Colors.white60 : (isDark ? Colors.white24 : AppColors.mutedForeground)),
                      const SizedBox(width: 4),
                      Text(
                        msg['time'],
                        style: GoogleFonts.tajawal(
                          fontSize: 10, 
                          color: isUser ? Colors.white60 : (isDark ? Colors.white24 : AppColors.mutedForeground),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModernInput(bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface.withAlpha(150) : Colors.white.withAlpha(200),
        border: Border(top: BorderSide(color: isDark ? Colors.white.withAlpha(25) : AppColors.secondary.withAlpha(100))),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withAlpha(10) : AppColors.secondary.withAlpha(40),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: isDark ? Colors.white.withAlpha(15) : AppColors.secondary.withAlpha(100)),
              ),
              child: TextField(
                controller: _messageController,
                style: GoogleFonts.tajawal(color: isDark ? Colors.white : AppColors.primary),
                decoration: InputDecoration(
                  hintText: 'اكتب الكلمة الغامضة عليك...',
                  hintStyle: GoogleFonts.tajawal(color: isDark ? Colors.white24 : AppColors.mutedForeground),
                  border: InputBorder.none,
                ),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Container(
            decoration: BoxDecoration(
              color: AppColors.accent,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: AppColors.accent.withAlpha(80), blurRadius: 15, spreadRadius: 2)
              ]
            ),
            child: IconButton(
              icon: const Icon(Icons.send_rounded, color: Colors.white),
              onPressed: _sendMessage,
            ),
          ),
        ],
      ),
    );
  }
}

class _PulsingAwarenessDots extends StatefulWidget {
  final bool isDark;
  const _PulsingAwarenessDots({required this.isDark});

  @override
  State<_PulsingAwarenessDots> createState() => _PulsingAwarenessDotsState();
}

class _PulsingAwarenessDotsState extends State<_PulsingAwarenessDots> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            final delay = index * 0.2;
            final val = Curves.easeInOut.transform((_controller.value - delay).clamp(0.0, 1.0));
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.accent.withAlpha((val * 255).toInt().clamp(50, 255)),
              ),
            );
          },
        );
      }),
    );
  }
}
