class ApiConfig {
  static const String baseUrl =
      'http://72.62.41.242:3000/api'; // Replace with VPS IP for production

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
