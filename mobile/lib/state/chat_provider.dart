import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/models/ai_content.dart';
import 'api_providers.dart';
import 'settings_provider.dart';
import 'storage.dart';
import 'weather_provider.dart';

class ChatState {
  const ChatState({this.messages = const <ChatMessage>[], this.sending = false, this.error});
  final List<ChatMessage> messages;
  final bool sending;
  final String? error;

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? sending,
    String? error,
    bool clearError = false,
  }) =>
      ChatState(
        messages: messages ?? this.messages,
        sending: sending ?? this.sending,
        error: clearError ? null : (error ?? this.error),
      );
}

class ChatNotifier extends Notifier<ChatState> {
  @override
  ChatState build() {
    final String? raw = ref.read(sharedPrefsProvider).getString(StorageKeys.chatMessages);
    if (raw == null) return const ChatState();
    try {
      final List<dynamic> list = jsonDecode(raw) as List<dynamic>;
      return ChatState(
        messages: list
            .map((dynamic e) => ChatMessage.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
    } catch (_) {
      return const ChatState();
    }
  }

  void _persist(List<ChatMessage> msgs) {
    ref.read(sharedPrefsProvider).setString(
          StorageKeys.chatMessages,
          jsonEncode(msgs.map((ChatMessage m) => m.toJson()).toList()),
        );
    // Cloud mirror is handled by CloudSync — it polls every 30s.
  }

  Future<void> sendMessage(String content) async {
    final String trimmed = content.trim();
    if (trimmed.isEmpty || state.sending) return;
    final WeatherSnapshot? snap = ref.read(weatherProvider).valueOrNull;

    final ChatMessage userMsg = ChatMessage(
      id: 'u-${DateTime.now().millisecondsSinceEpoch}',
      role: 'user',
      content: trimmed,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    final List<ChatMessage> withUser = <ChatMessage>[...state.messages, userMsg];
    state = state.copyWith(messages: withUser, sending: true, clearError: true);
    _persist(withUser);

    if (snap == null) {
      _appendAssistant("I'm waiting for weather data. Once that loads I can answer properly.");
      return;
    }

    try {
      final DateTime now = DateTime.now();
      final settings = ref.read(settingsProvider);
      final String reply = await ref.read(aiApiProvider).chat(
            message: trimmed,
            history: state.messages,
            weather: snap.data,
            localHour: now.hour,
            localMinute: now.minute,
            emojiUse: settings.aiEmojiUse,
            verbosity: settings.aiVerbosity,
          );
      _appendAssistant(reply.isEmpty ? "I'm not sure how to answer that — try rephrasing." : reply);
    } catch (e) {
      // Special-case 429 (daily limit) so the UI can show an Upgrade CTA
      // instead of a generic error. dio throws DioException, but we keep
      // this dep-light by string-matching the status code.
      final String es = e.toString();
      final bool rateLimited = es.contains('429') ||
          es.contains('Daily limit') ||
          es.contains('Status code: 429');
      final String msg = rateLimited
          ? "You've hit today's free limit. Upgrade for more, or try again tomorrow."
          : 'The AI is napping. Try again in a moment.';
      state = state.copyWith(sending: false, error: msg);
    }
  }

  /// Re-send the last user message after a failure.
  Future<void> retryLast() async {
    final ChatMessage? last = state.messages.where((ChatMessage m) => m.role == 'user').lastOrNull;
    if (last == null) return;
    // Drop trailing assistant errors (if any) before retrying.
    state = state.copyWith(error: null);
    await sendMessage(last.content);
  }

  void _appendAssistant(String content) {
    final ChatMessage msg = ChatMessage(
      id: 'a-${DateTime.now().millisecondsSinceEpoch}',
      role: 'assistant',
      content: content,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    final List<ChatMessage> next = <ChatMessage>[...state.messages, msg];
    state = state.copyWith(messages: next, sending: false);
    _persist(next);
  }

  void clear() {
    state = const ChatState();
    ref.read(sharedPrefsProvider).remove(StorageKeys.chatMessages);
  }
}

final NotifierProvider<ChatNotifier, ChatState> chatProvider =
    NotifierProvider<ChatNotifier, ChatState>(ChatNotifier.new);

const List<String> quickPrompts = <String>[
  'Will it rain today?',
  'What should I wear?',
  'Best time to go outside?',
  'Plan my week based on the weather forecast.',
  'How windy will it be?',
  'When is sunset?',
];
