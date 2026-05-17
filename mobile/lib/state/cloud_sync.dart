import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_provider.dart';
import 'storage.dart';

/// One-way pull on sign-in + periodic push of local state to Supabase
/// for the signed-in user. Matches the web behaviour
/// (`src/components/sync/CloudSync.tsx` + `src/lib/supabase/sync.ts`).
///
/// Strategy:
///   - On `signedIn` event: if remote has data, overwrite local; else
///     push the local snapshot to remote.
///   - Periodically (every 30s while signed in) push local → remote.
///   - Never deletes remote when signed out.
final Provider<CloudSync> cloudSyncProvider = Provider<CloudSync>((Ref ref) {
  final SharedPreferences prefs = ref.watch(sharedPrefsProvider);
  final bool ready = ref.watch(supabaseReadyProvider);
  final CloudSync sync = CloudSync(prefs: prefs, enabled: ready);
  if (ready) {
    ref.listen<AsyncValue<AuthState>>(authStateProvider, (
      AsyncValue<AuthState>? _,
      AsyncValue<AuthState> next,
    ) {
      next.whenData((AuthState state) {
        sync.handleAuthEvent(state);
      });
    });
  }
  ref.onDispose(sync.dispose);
  return sync;
});

class CloudSync {
  CloudSync({required this.prefs, required this.enabled}) {
    if (enabled) _startPolling();
  }

  final SharedPreferences prefs;
  final bool enabled;
  String? _lastUserId;
  Timer? _pollTimer;

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) => pushAll());
  }

  Future<void> handleAuthEvent(AuthState state) async {
    if (!enabled) return;
    if (state.event == AuthChangeEvent.signedIn ||
        state.event == AuthChangeEvent.tokenRefreshed) {
      final String? uid = state.session?.user.id;
      if (uid == null || uid == _lastUserId) return;
      _lastUserId = uid;
      await pullOnSignIn(uid);
    }
    if (state.event == AuthChangeEvent.signedOut) {
      _lastUserId = null;
    }
  }

  Future<void> pullOnSignIn(String userId) async {
    final SupabaseClient client = Supabase.instance.client;

    // saved_locations
    try {
      final List<Map<String, dynamic>> rows = await client
          .from('saved_locations')
          .select('name, country, admin1, lat, lon')
          .eq('user_id', userId);
      if (rows.isNotEmpty) {
        await prefs.setString(
          StorageKeys.savedLocations,
          jsonEncode(rows
              .map((Map<String, dynamic> r) => <String, dynamic>{
                    'name': r['name'],
                    'country': r['country'] ?? '',
                    'admin1': r['admin1'],
                    'lat': r['lat'],
                    'lon': r['lon'],
                  })
              .toList()),
        );
      }
    } catch (_) {}

    // chat_messages (last 200)
    try {
      final List<Map<String, dynamic>> rows = await client
          .from('chat_messages')
          .select('id, role, content, created_at')
          .eq('user_id', userId)
          .order('created_at', ascending: true)
          .limit(200);
      if (rows.isNotEmpty) {
        await prefs.setString(
          StorageKeys.chatMessages,
          jsonEncode(rows
              .map((Map<String, dynamic> r) => <String, dynamic>{
                    'id': r['id'],
                    'role': r['role'] == 'model' ? 'assistant' : 'user',
                    'content': r['content'],
                    'timestamp':
                        DateTime.parse(r['created_at'] as String).millisecondsSinceEpoch,
                  })
              .toList()),
        );
      }
    } catch (_) {}

    // user_preferences
    try {
      final Map<String, dynamic>? prefRow =
          await client.from('user_preferences').select().eq('user_id', userId).maybeSingle();
      if (prefRow != null) {
        await prefs.setString(
          StorageKeys.settings,
          jsonEncode(<String, dynamic>{
            'tempUnit': prefRow['temp_unit'],
            'windUnit': prefRow['wind_unit'],
            'timeFormat': prefRow['time_format'],
            'headlineTone': prefRow['headline_tone'],
            'headlineTwoLine': prefRow['headline_two_line'],
            'headlineLocationFlavor': prefRow['headline_location_flavor'],
            'headlineTimeAware': prefRow['headline_time_aware'],
            'aiEmojiUse': prefRow['ai_emoji_use'],
            'aiVerbosity': prefRow['ai_verbosity'],
            'language': prefRow['language'],
          }),
        );
      }
    } catch (_) {}
  }

  Future<void> pushAll() async {
    if (!enabled) return;
    final User? user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;
    final String userId = user.id;
    final SupabaseClient client = Supabase.instance.client;

    // saved_locations: replace all
    try {
      final String? raw = prefs.getString(StorageKeys.savedLocations);
      if (raw != null) {
        final List<dynamic> locs = jsonDecode(raw) as List<dynamic>;
        await client.from('saved_locations').delete().eq('user_id', userId);
        if (locs.isNotEmpty) {
          await client.from('saved_locations').insert(locs
              .map((dynamic l) {
                final Map<String, dynamic> m = l as Map<String, dynamic>;
                return <String, dynamic>{
                  'user_id': userId,
                  'name': m['name'],
                  'country': (m['country'] as String?)?.isEmpty == true ? null : m['country'],
                  'admin1': m['admin1'],
                  'lat': m['lat'],
                  'lon': m['lon'],
                };
              })
              .toList());
        }
      }
    } catch (_) {}

    // chat_messages: replace last 200
    try {
      final String? raw = prefs.getString(StorageKeys.chatMessages);
      if (raw != null) {
        final List<dynamic> msgs = jsonDecode(raw) as List<dynamic>;
        await client.from('chat_messages').delete().eq('user_id', userId);
        if (msgs.isNotEmpty) {
          final List<dynamic> trimmed = msgs.length > 200
              ? msgs.sublist(msgs.length - 200)
              : msgs;
          await client.from('chat_messages').insert(trimmed.map((dynamic raw) {
            final Map<String, dynamic> m = raw as Map<String, dynamic>;
            return <String, dynamic>{
              'user_id': userId,
              'role': (m['role'] == 'assistant') ? 'model' : 'user',
              'content': m['content'],
              'created_at': DateTime.fromMillisecondsSinceEpoch(
                (m['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
              ).toUtc().toIso8601String(),
            };
          }).toList());
        }
      }
    } catch (_) {}

    // user_preferences: upsert
    try {
      final String? raw = prefs.getString(StorageKeys.settings);
      if (raw != null) {
        final Map<String, dynamic> s = jsonDecode(raw) as Map<String, dynamic>;
        await client.from('user_preferences').upsert(<String, dynamic>{
          'user_id': userId,
          'temp_unit': s['tempUnit'] ?? 'C',
          'wind_unit': s['windUnit'] ?? 'kmh',
          'time_format': s['timeFormat'] ?? '24h',
          'headline_tone': s['headlineTone'] ?? 'casual',
          'headline_two_line': s['headlineTwoLine'] ?? false,
          'headline_location_flavor': s['headlineLocationFlavor'] ?? false,
          'headline_time_aware': s['headlineTimeAware'] ?? false,
          'ai_emoji_use': s['aiEmojiUse'] ?? 'light',
          'ai_verbosity': s['aiVerbosity'] ?? 'medium',
          'language': s['language'] ?? 'en',
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        }, onConflict: 'user_id');
      }
    } catch (_) {}
  }

  void dispose() {}
}
