class LiveKitConfig {
  static const String url = String.fromEnvironment('LIVEKIT_URL');
  static const String apiKey = String.fromEnvironment('LIVEKIT_API_KEY');

  // Security note:
  // LIVEKIT_API_SECRET must never be shipped in the mobile client.
  // Generate access tokens from your backend and send only short-lived tokens to the app.
}
