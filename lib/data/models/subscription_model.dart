class SubscriptionModel {
  final String id;
  final String userId;
  final String status;
  final DateTime createdAt;
  final DateTime? expiresAt;
  final String? paypalSubscriptionId;

  SubscriptionModel({
    required this.id,
    required this.userId,
    required this.status,
    required this.createdAt,
    this.expiresAt,
    this.paypalSubscriptionId,
  });

  factory SubscriptionModel.fromJson(Map<String, dynamic> json) {
    return SubscriptionModel(
      id: json['id'],
      userId: json['user_id'],
      status: json['status'],
      createdAt: DateTime.parse(json['created_at']),
      expiresAt: json['expires_at'] != null 
          ? DateTime.parse(json['expires_at']) 
          : null,
      paypalSubscriptionId: json['paypal_subscription_id'],
    );
  }
}
