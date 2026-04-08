class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.example.com/api',
  );

  // Auth endpoints
  static const String login = '/auth/login';
  static const String signup = '/auth/signup';
  static const String health = '/health';

  // Content endpoints
  static const String contents = '/contents';
  static const String contentDetail = '/contents/';

  // User & Social endpoints
  static const String profiles = '/profiles/';
  static const String posts = '/posts';
  static const String workshops = '/workshops';
  static const String subscriptions = '/subscriptions/';
}
