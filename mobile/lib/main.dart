import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(<DeviceOrientation>[
    DeviceOrientation.portraitUp,
  ]);

  // Supabase auth — env vars come from --dart-define at build time. Skip
  // initialization when missing so the app still runs without auth.
  // Guarded against double-init on hot restart.
  const supaUrl = String.fromEnvironment('SUPABASE_URL');
  const supaKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  if (supaUrl.isNotEmpty && supaKey.isNotEmpty) {
    try {
      Supabase.instance.client; // throws if not initialized — we want that path
    } catch (_) {
      await Supabase.initialize(url: supaUrl, anonKey: supaKey);
    }
  }

  runApp(const ProviderScope(child: AtmosApp()));
}
