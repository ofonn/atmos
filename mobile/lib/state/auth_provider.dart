import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Whether Supabase was initialized at app startup. False when env vars
/// were missing — in that case the auth screens render an "unavailable"
/// notice instead of attempting calls.
final supabaseReadyProvider = Provider<bool>((ref) {
  try {
    Supabase.instance.client;
    return true;
  } catch (_) {
    return false;
  }
});

/// Live auth state stream. Emits the current Session on every change.
final authStateProvider = StreamProvider<AuthState>((ref) {
  if (!ref.watch(supabaseReadyProvider)) {
    return const Stream<AuthState>.empty();
  }
  return Supabase.instance.client.auth.onAuthStateChange;
});

/// Current user, or null if signed out / unconfigured.
final currentUserProvider = Provider<User?>((ref) {
  if (!ref.watch(supabaseReadyProvider)) return null;
  return Supabase.instance.client.auth.currentUser;
});
