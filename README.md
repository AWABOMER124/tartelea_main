# tartelea_flutter

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.


## Runtime configuration (required)

This app expects sensitive/config values through compile-time `--dart-define` flags.

### Required defines
- `API_BASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`

### Example (Android release)
```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://your-domain.com/api \
  --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your_supabase_anon_key \
  --dart-define=LIVEKIT_URL=wss://your-project.livekit.cloud \
  --dart-define=LIVEKIT_API_KEY=your_livekit_api_key
```

> Do not store server secrets (e.g., LiveKit API secret) in the mobile app.
