import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final supabaseProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

class SupabaseConfig {
  static const String url = String.fromEnvironment('SUPABASE_URL');
  static const String anonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  static Future<void> initialize() async {
    if (url.isEmpty || anonKey.isEmpty) {
      throw StateError(
        'Supabase environment values are missing. '
        'Provide SUPABASE_URL and SUPABASE_ANON_KEY via --dart-define.',
      );
    }

    await Supabase.initialize(
      url: url,
      anonKey: anonKey,
    );
  }
}
