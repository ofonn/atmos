import 'package:flutter/foundation.dart';

@immutable
class AiContent {
  const AiContent({
    required this.headline,
    required this.advice,
    this.hook,
    this.proactiveInsight = '',
    this.weekSummary = '',
    this.outfit = '',
    this.activity = '',
    required this.fetchedAt,
  });

  final String headline;
  final String? hook;
  final String advice;
  final String proactiveInsight;
  final String weekSummary;
  final String outfit;
  final String activity;
  final int fetchedAt;

  factory AiContent.fromJson(Map<String, dynamic> j) => AiContent(
        headline: j['headline']?.toString() ?? '',
        hook: j['hook']?.toString(),
        advice: j['advice']?.toString() ?? '',
        proactiveInsight: j['proactiveInsight']?.toString() ?? '',
        weekSummary: j['weekSummary']?.toString() ?? '',
        outfit: j['outfit']?.toString() ?? '',
        activity: j['activity']?.toString() ?? '',
        fetchedAt: (j['fetchedAt'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'headline': headline,
        'hook': hook,
        'advice': advice,
        'proactiveInsight': proactiveInsight,
        'weekSummary': weekSummary,
        'outfit': outfit,
        'activity': activity,
        'fetchedAt': fetchedAt,
      };
}

@immutable
class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
  });

  final String id;
  final String role; // 'user' | 'assistant'
  final String content;
  final int timestamp;

  factory ChatMessage.fromJson(Map<String, dynamic> j) => ChatMessage(
        id: j['id']?.toString() ?? '',
        role: j['role']?.toString() ?? 'assistant',
        content: j['content']?.toString() ?? '',
        timestamp: (j['timestamp'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'role': role,
        'content': content,
        'timestamp': timestamp,
      };
}
