import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/models/ai_content.dart';
import 'api_providers.dart';
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
      final String reply = await ref.read(aiApiProvider).chat(
            message: trimmed,
            history: state.messages,
            weather: snap.data,
            localHour: now.hour,
            localMinute: now.minute,
          );
      _appendAssistant(reply.isEmpty ? "I'm not sure how to answer that — try rephrasing." : reply);
    } catch (e) {
      state = state.copyWith(sending: false, error: 'Could not reach Atmos AI: $e');
    }
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
