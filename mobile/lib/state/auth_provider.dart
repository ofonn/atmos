import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// True if Supabase was initialized at app startup. False when env vars
/// were missing — auth UI then renders an "unavailable" notice.
final supabaseReadyProvider = Provider<bool>((ref) {
  try {
    Supabase.instance.client;
    return true;
  } catch (_) {
    return false;
  }
});

/// Live auth state stream — emits on every sign-in / sign-out / refresh.
/// Returns an empty stream when Supabase is unavailable.
final authStateProvider = StreamProvider<AuthState>((ref) {
  if (!ref.watch(supabaseReadyProvider)) {
    return const Stream<AuthState>.empty();
  }
  return Supabase.instance.client.auth.onAuthStateChange;
});

/// Current authenticated user, or null. Rebuilds whenever
/// [authStateProvider] emits so consumers see fresh state.
final currentUserProvider = Provider<User?>((ref) {
  if (!ref.watch(supabaseReadyProvider)) return null;
  // Wire-through to the auth stream so this provider re-evaluates on changes.
  ref.watch(authStateProvider);
  return Supabase.instance.client.auth.currentUser;
});
